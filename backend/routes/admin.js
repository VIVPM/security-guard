// routes/admin.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const User = require('../models/User');
const Incident = require("../models/Incident");
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');

// Configure multer to use in-memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Configure Cloudinary (ensure your .env has CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /admin/guards - Add a new guard
router.post('/guards', upload.single('profilePicture'), authMiddleware, async (req, res) => {
    let { personalInfo, workExperience, certifications, trainingAndSkills, emergencyContact } = req.body;
    try {
        // Parse JSON fields
        if (personalInfo) personalInfo = JSON.parse(personalInfo);
        if (workExperience) workExperience = JSON.parse(workExperience);
        if (certifications) certifications = JSON.parse(certifications);
        if (trainingAndSkills) trainingAndSkills = JSON.parse(trainingAndSkills);
        if (emergencyContact) emergencyContact = JSON.parse(emergencyContact);

        // Check if user already exists by email
        const existingUser = await User.findOne({ 'personalInfo.email': personalInfo.email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // If a profile picture file is uploaded, upload it to Cloudinary
        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'profile_pictures' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(req.file.buffer);
            });
            personalInfo.profilePicture = result.secure_url;
        }

        // Hash the password (assuming admin provides a password)
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        personalInfo.password = await bcrypt.hash(personalInfo.password, salt);

        // Create new guard (user)
        const newUser = new User({
            personalInfo,
            workExperience: workExperience || [],
            certifications: certifications || [],
            trainingAndSkills: trainingAndSkills || { trainings: [], skills: [] },
            emergencyContact: emergencyContact || {},
        });

        await newUser.save();
        res.status(201).json({ message: 'Guard added successfully', user: newUser });
    } catch (error) {
        console.error('Error adding guard:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /admin/guard/:id - Fetch single guard information by id
router.get('/guard/:id', authMiddleware, async (req, res) => {
    // Only allow access if the authenticated user is an admin.
    if (req.user.type !== 'Admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    try {
        const guard = await User.findById(req.params.id).select('-personalInfo.password');
        if (!guard) {
            return res.status(404).json({ message: 'Guard not found' });
        }
        res.json(guard);
    } catch (error) {
        console.error('Error fetching guard:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});
router.get('/guards', authMiddleware, async (req, res) => {
    // Only allow access if the authenticated user is an admin.
    if (req.user.type !== 'Admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    try {
        const admin = await User.findById(req.user.id);
        const adminLocation = admin.personalInfo.location;
        const query = { 'personalInfo.location': adminLocation};
        // If a type filter is provided (e.g. ?type=Guard or ?type=Admin)
        if (req.query.type) {
            query['personalInfo.type'] = req.query.type;
        }
        // If a search query is provided, add regex conditions on multiple fields
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            query.$or = [
                { 'personalInfo.name': { $regex: searchRegex } },
                { 'personalInfo.email': { $regex: searchRegex } },
                { 'personalInfo.gender': { $regex: searchRegex } },
                { 'personalInfo.location': { $regex: searchRegex } },
                { 'personalInfo.phone': { $regex: searchRegex } },
                { 'personalInfo.address': { $regex: searchRegex } },
            ];
        }

        const guards = await User.find(query).select('-personalInfo.password');
        res.json(guards);
    } catch (err) {
        console.error('Error fetching guard profiles:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /admin/incidents - Get all incidents reported by guards with search & filters
router.get('/incidents', authMiddleware, async (req, res) => {
    // Ensure the user is an admin.
    if (req.user.type !== 'Admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const admin = await User.findById(req.user.id);
        const adminLocation = admin.personalInfo.location;

        const { search, status, fromDate, toDate, fromTime, toTime } = req.query;
        let filter = {};

        // Build search conditions
        let searchConditions = [];
        if (search) {
            const regex = new RegExp(search, 'i');
            searchConditions = [
                { location: { $regex: regex } },
                { address: { $regex: regex } },
                { description: { $regex: regex } },
                { 'guardData.personalInfo.name': { $regex: regex } },
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

        // Filter by incidentTime range (assuming "HH:mm" strings)
        if (fromTime && toTime) {
            filter.incidentTime = { $gte: fromTime, $lte: toTime };
        } else if (fromTime) {
            filter.incidentTime = { $gte: fromTime };
        } else if (toTime) {
            filter.incidentTime = { $lte: toTime };
        }

        // Aggregate incidents with lookup on guard data
        const incidents = await Incident.aggregate([
            {
                $lookup: {
                    from: 'users', // ensure this matches your actual users collection name
                    localField: 'guard',
                    foreignField: '_id',
                    as: 'guardData'
                }
            },
            { $unwind: '$guardData' },
            {
                $match: {
                    ...filter,
                    'guardData.personalInfo.type': 'Guard',
                    'guardData.personalInfo.location': adminLocation,
                    ...(search && { $or: searchConditions })
                }
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
        console.error('Error fetching incidents for admin:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT route to update incident status remains unchanged
router.put('/incidents/:id/status', authMiddleware, async (req, res) => {
    if (req.user.type !== 'Admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const incidentId = req.params.id;
    const { status } = req.body;
    const allowedStatuses = ['Reported', 'Investigating', 'Resolved'];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value.' });
    }

    try {
        const updatedIncident = await Incident.findByIdAndUpdate(
            incidentId,
            { status },
            { new: true }
        );

        if (!updatedIncident) {
            return res.status(404).json({ message: 'Incident not found.' });
        }

        // Find the guard who reported the incident
        const guard = await User.findById(updatedIncident.guard);

        if (!guard) {
            return res.status(404).json({ message: 'Guard not found.' });
        }

        // Create the appropriate notification based on the status
        let notificationMessage = '';
        if (status === 'Investigating') {
            notificationMessage = 'The incident status has been updated to Investigating. Please stay alert.';
        } else if (status === 'Resolved') {
            notificationMessage = 'Thank you for reporting the incident. The incident is now resolved.';
        }

        // Create the notification
        await Notification.create({
            user: guard._id,
            message: notificationMessage,
            severity: 'info',
        });

        res.json({ message: 'Incident status updated successfully and notification sent.', incident: updatedIncident });
    } catch (error) {
        console.error('Error updating incident status:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});



// DELETE guard by id (only admin can delete)
router.delete('/guard/:id', authMiddleware, async (req, res) => {
    if (req.user.type !== 'Admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Guard deleted successfully' });
    } catch (error) {
        console.error('Error deleting guard:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/guards/:id/background-check', authMiddleware, async (req, res) => {
    const guardId = req.params.id;
    const { clearanceLevel, status, lastUpdated } = req.body; // Expect these fields from the frontend
    try {
        const guard = await User.findById(guardId);
        if (!guard) {
            return res.status(404).json({ message: 'Guard not found' });
        }
        // Update the backgroundCheck field
        guard.backgroundCheck = {
            clearanceLevel,
            status,
            lastUpdated: lastUpdated ? new Date(lastUpdated) : new Date(),
        };
        await guard.save();
        // Create a notification for this guard
        await Notification.create({
            user: guard._id,
            message: 'Your background check has been updated. Please review your profile.',
            severity: 'info'
        });
        res.json({ message: 'Background check updated successfully', guard });
    } catch (error) {
        console.error('Error updating background check:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/guards/accepted - Get guards with background check status "Accepted"
router.get('/guards/accepted', authMiddleware, async (req, res) => {
    try {
        const acceptedGuards = await User.find({
            'personalInfo.type': 'Guard',
            'backgroundCheck.status': 'Accepted'
        }).select('personalInfo');
        res.json(acceptedGuards);
    } catch (err) {
        console.error('Error fetching accepted guards:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;
