// routes/profile.js
const express = require('express');
const dotenv = require('dotenv');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const router = express.Router();
const Place = require("../models/Place");
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
dotenv.config();

// Configure multer to use memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Configure Cloudinary (make sure your .env has CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET current user's profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-personalInfo.password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT update current user's profile, with file upload support for profile picture
router.put('/profile', upload.single('profilePicture'), authMiddleware, async (req, res) => {
    let { personalInfo, workExperience, certifications, trainingAndSkills, emergencyContact } = req.body;
    try {
        let user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Parse JSON fields (they are sent as JSON strings)
        if (personalInfo) {
            try {
                personalInfo = JSON.parse(personalInfo);
            } catch (e) {
                // already an object
            }
        }
        if (workExperience) {
            workExperience = JSON.parse(workExperience);
        }
        if (certifications) {
            certifications = JSON.parse(certifications);
        }
        if (trainingAndSkills) {
            trainingAndSkills = JSON.parse(trainingAndSkills);
        }
        if (emergencyContact) {
            emergencyContact = JSON.parse(emergencyContact);
        }

        // If a new profile picture file is uploaded, upload it to Cloudinary
        if (req.file) {
            try {
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
                // Update the profilePicture field in personalInfo with the Cloudinary secure URL
                personalInfo = { ...personalInfo, profilePicture: result.secure_url };
            } catch (error) {
                console.error("Cloudinary upload error:", error);
                return res.status(500).json({ message: 'Failed to upload image' });
            }
        }

        // Merge updates: replace arrays entirely and merge personalInfo
        if (personalInfo) {
            user.personalInfo = { ...user.personalInfo.toObject(), ...personalInfo };
        }
        if (workExperience) {
            user.workExperience = workExperience;
        }
        if (certifications) {
            user.certifications = certifications;
        }
        if (trainingAndSkills) {
            user.trainingAndSkills = trainingAndSkills;
        }
        if (emergencyContact) {
            user.emergencyContact = emergencyContact;
        }

        await user.save();
        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('Error updating profile:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /apiProfile/guard - Return places assigned to the logged-in guard
router.get('/guard', authMiddleware, async (req, res) => {
    try {
        // Update statuses for today’s places before fetching.
        // await updateCompletedStatusForToday();

        const guardId = req.user.id; // Assuming auth middleware adds guard's id to req.user
        const { search, status, fromDate, toDate, fromTime, toTime } = req.query;
        let query = { guard: guardId };

        // Filter by search on placeName, status, or address.
        if (search) {
            const regex = new RegExp(search, 'i');
            query.$or = [
                { placeName: { $regex: regex } },
                { status: { $regex: regex } },
                { address: { $regex: regex } }
            ];
        }

        // Filter by status if provided.
        if (status) {
            query.status = status;
        }

        // Filter by date range.
        if (fromDate && toDate) {
            query.date = { $gte: new Date(fromDate), $lte: new Date(toDate) };
        } else if (fromDate) {
            query.date = { $gte: new Date(fromDate) };
        } else if (toDate) {
            query.date = { $lte: new Date(toDate) };
        }

        // Filter by start time.
        if (fromTime && toTime) {
            query.startTime = { $gte: fromTime, $lte: toTime };
        } else if (fromTime) {
            query.startTime = { $gte: fromTime };
        } else if (toTime) {
            query.startTime = { $lte: toTime };
        }

        const places = await Place.find(query).populate('guard', 'personalInfo.name').populate('admin', 'personalInfo.name');
        // Sort places so that "Scheduled" comes first, then "Completed"
        const statusOrder = {
            "Scheduled": 1,
            "In Progress": 2,
            "Completed": 3
        };

        const sortedPlaces = places.sort((a, b) => {
            const orderA = statusOrder[a.status] || 4;
            const orderB = statusOrder[b.status] || 4;
            if (orderA !== orderB) {
                return orderA - orderB;
            } else {
                // For Completed, sort by date in descending order.
                if (a.status === "Completed") {
                    return new Date(b.date) - new Date(a.date);
                } else {
                    // For Scheduled or In Progress, sort by date in ascending order.
                    return new Date(a.date) - new Date(b.date);
                }
            }
        });
        
        res.json(sortedPlaces);
    } catch (err) {
        console.error("Error fetching guard places:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
