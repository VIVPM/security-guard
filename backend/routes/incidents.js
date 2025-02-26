const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Incident = require('../models/Incident');
const User = require('../models/User');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Configure multer to use memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Configure Cloudinary using .env credentials
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to format date as DD-MM-YYYY
function formatDateDDMMYYYY(date) {
    const d = new Date(date);
    const day = ('0' + d.getDate()).slice(-2);
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}

// GET /api/incidents - List incidents with filtering and search
router.get('/incidents', authMiddleware, async (req, res) => {
    try {
        const { search, status, fromDate, toDate, fromTime, toTime } = req.query;
        // Convert guard ID to ObjectId
        const guardId = new mongoose.Types.ObjectId(req.user.id);

        let filter = { guard: guardId }; // This ensures the guard only sees their incidents

        let searchConditions = [];
        if (search) {
            const regex = new RegExp(search, 'i');
            searchConditions = [
                { location: { $regex: regex } },
                { address: { $regex: regex } },
                { description: { $regex: regex } },
            ];
        }

        // Filter by status if provided
        if (status) {
            filter.status = status;
        }

        // Filter by incidentDate range
        if (fromDate && toDate) {
            filter.incidentDate = { $gte: new Date(fromDate), $lte: new Date(toDate) };
        } else if (fromDate) {
            filter.incidentDate = { $gte: new Date(fromDate) };
        } else if (toDate) {
            filter.incidentDate = { $lte: new Date(toDate) };
        }

        // Filter by incidentTime range (times stored as "HH:mm" strings)
        if (fromTime && toTime) {
            filter.incidentTime = { $gte: fromTime, $lte: toTime };
        } else if (fromTime) {
            filter.incidentTime = { $gte: fromTime };
        } else if (toTime) {
            filter.incidentTime = { $lte: toTime };
        }

        // Use aggregation to also search by guard's name
        let incidents = await Incident.aggregate([
            {
                $lookup: {
                    from: 'users', // ensure this is your actual collection name for users
                    localField: 'guard',
                    foreignField: '_id',
                    as: 'guardData',
                },
            },
            { $unwind: '$guardData' },
            {
                $match: {
                    ...filter,
                    ...(search && { $or: searchConditions }),
                },
            },
            {
                $addFields: {
                    statusOrder: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "Reported"] }, then: 1 },
                                { case: { $eq: ["$status", "Investigating"] }, then: 2 },
                                { case: { $eq: ["$status", "Resolved"] }, then: 3 }
                            ],
                            default: 4
                        }
                    }
                }
            },
            {
                $sort: { statusOrder: 1, createdAt: 1 }
            },
            {
                $project: {
                    incidentTime: 1,
                    incidentDate: 1,
                    location: 1,
                    address: 1,
                    description: 1,
                    images: 1,
                    videos: 1,
                    status: 1,
                    createdAt: 1,
                    guard: '$guardData'
                }
            }
        ]);

        res.json(incidents);
    } catch (error) {
        console.error('Error fetching incidents:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});


// Use upload.fields to handle multiple files for images and videos
const multiUpload = upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 5 },
]);

// POST /api/incidents - Create a new incident (guard reports incident)
router.post('/incidents', authMiddleware, multiUpload, async (req, res) => {
    try {
        let { incidentDate, incidentTime, location, address, description, status } = req.body;
        if (!incidentTime || !incidentDate || !location || !description) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }
        status = status || 'Reported';

        // Create folder name based on location and incidentDate in DD-MM-YYYY format
        const formattedLocation = location.replace(/\s+/g, '_');
        const formattedDate = formatDateDDMMYYYY(incidentDate);
        const folderName = `incident_reports/incident_${formattedLocation}_${formattedDate}`;

        let imagesUrls = [];
        let videosUrls = [];

        // Process images if provided
        if (req.files && req.files.images && req.files.images.length > 0) {
            for (const file of req.files.images) {
                // Upload image to Cloudinary
                const result = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: folderName, resource_type: 'image' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    stream.end(file.buffer);
                });
                imagesUrls.push(result.secure_url);
            }
        }

        // Process videos if provided
        if (req.files && req.files.videos && req.files.videos.length > 0) {
            for (const file of req.files.videos) {
                // Upload video to Cloudinary
                const result = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: folderName, resource_type: 'video' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    stream.end(file.buffer);
                });
                videosUrls.push(result.secure_url);
            }
        }

        const newIncident = new Incident({
            guard: req.user.id, // from token (guard who is reporting)
            incidentDate: new Date(incidentDate),
            incidentTime: incidentTime,
            location,
            address,
            description,
            images: imagesUrls,
            videos: videosUrls,
            status,
        });
        await newIncident.save();

        // Find admins whose location matches the guard's location
        const guard = await User.findById(req.user.id); // Get the guard's details
        const matchingAdmins = await User.find({
            'personalInfo.type': 'Admin',
            'personalInfo.location': guard.personalInfo.location // Match location
        });

        // Send notifications only to matching admins
        matchingAdmins.forEach(async (admin) => {
            await Notification.create({
                user: admin._id,
                message: 'A new incident has been reported in your area.',
                severity: 'warning'
            });
        });
        res.status(201).json({ message: 'Incident reported successfully.', incident: newIncident });
    } catch (error) {
        console.error('Error creating incident:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/incidents/:id - Update an incident
router.put('/incidents/:id', authMiddleware, multiUpload, async (req, res) => {
    try {
        const incidentId = req.params.id;
        let { incidentDate, incidentTime, location, address, description, status } = req.body;
        if (!incidentTime || !incidentDate || !location || !description) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        // Create folder name based on location and incidentDate in DD-MM-YYYY format
        const formattedLocation = location.replace(/\s+/g, '_');
        const formattedDate = formatDateDDMMYYYY(incidentDate);
        const folderName = `incident_reports/incident_${formattedLocation}_${formattedDate}`;

        let imagesUrls = [];
        let videosUrls = [];

        // Process new images if provided
        if (req.files && req.files.images && req.files.images.length > 0) {
            for (const file of req.files.images) {
                const result = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: folderName, resource_type: 'image' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    stream.end(file.buffer);
                });
                imagesUrls.push(result.secure_url);
            }
        }

        // Process new videos if provided
        if (req.files && req.files.videos && req.files.videos.length > 0) {
            for (const file of req.files.videos) {
                const result = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: folderName, resource_type: 'video' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    stream.end(file.buffer);
                });
                videosUrls.push(result.secure_url);
            }
        }

        const updateData = {
            incidentDate: new Date(incidentDate),
            incidentTime: incidentTime,
            location,
            address,
            description,
            status,
        };

        // Only update images/videos if new ones are uploaded
        if (imagesUrls.length > 0) {
            updateData.images = imagesUrls;
        }
        if (videosUrls.length > 0) {
            updateData.videos = videosUrls;
        }

        const updatedIncident = await Incident.findByIdAndUpdate(incidentId, updateData, { new: true });
        if (!updatedIncident) {
            return res.status(404).json({ message: 'Incident not found.' });
        }

        // Get guard details
        const guard = await User.findById(updatedIncident.guard);

        // Find admins whose location matches the guard's location
        const matchingAdmins = await User.find({
            'personalInfo.type': 'Admin',
            'personalInfo.location': guard.personalInfo.location // Match location
        });

        // Send notifications only to matching admins
        matchingAdmins.forEach(async (admin) => {
            await Notification.create({
                user: admin._id,
                message: 'An incident has been updated in your area.',
                severity: 'warning'
            });
        });
        res.json({ message: 'Incident updated successfully.', incident: updatedIncident });
    } catch (error) {
        console.error('Error updating incident:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/incidents/:id - Delete an incident
router.delete('/incidents/:id', authMiddleware, async (req, res) => {
    try {
        const deletedIncident = await Incident.findByIdAndDelete(req.params.id);
        if (!deletedIncident) {
            return res.status(404).json({ message: 'Incident not found.' });
        }
        res.json({ message: 'Incident deleted successfully.' });
    } catch (error) {
        console.error('Error deleting incident:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
