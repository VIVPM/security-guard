// routes/places.js
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const Place = require('../models/Place'); // Your Place schema
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


// async function geocodeAddress(address) {
//     // Make sure to set your API key in your environment variables (e.g., .env file)
//     const apiKey = process.env.OPENCAGE_API_KEY;
//     if (!apiKey) {
//         throw new Error('OpenCage API key is not defined.');
//     }

//     const encodedAddress = encodeURIComponent(address);
//     const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodedAddress}&key=${apiKey}&limit=1`;

//     const response = await axios.get(url);
//     if (!response.data || response.data.results.length === 0) {
//         throw new Error('Geocoding failed: No results found');
//     }

//     const { lat, lng } = response.data.results[0].geometry;
//     return { latitude: lat, longitude: lng };
// }

async function geocodeAddress(address) {
    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
        throw new Error('Geoapify API key is not defined.');
    }
    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodedAddress}&apiKey=${apiKey}&limit=1`;

    const response = await axios.get(url);
    if (!response.data || !response.data.features || response.data.features.length === 0) {
        throw new Error('Geocoding failed: No results found');
    }

    // Geoapify returns coordinates in the form [lon, lat]
    const { coordinates } = response.data.features[0].geometry;
    return { latitude: coordinates[1], longitude: coordinates[0] };
}


// GET /apiPlaces/places - List all places with optional filtering
router.get('/places', authMiddleware, async (req, res) => {
    try {
        // await updateCompletedStatusForToday();
        const { search, status, fromDate, toDate, fromTime, toTime } = req.query;
        let matchStage = { admin: new mongoose.Types.ObjectId(req.user.id) }; // Filter by Admin

        // Filter by status
        if (status) {
            matchStage.status = status;
        }

        // Filter by date range
        if (fromDate && toDate) {
            matchStage.date = { $gte: new Date(fromDate), $lte: new Date(toDate) };
        } else if (fromDate) {
            matchStage.date = { $gte: new Date(fromDate) };
        } else if (toDate) {
            matchStage.date = { $lte: new Date(toDate) };
        }

        // Filter by start time (stored as HH:mm strings)
        if (fromTime && toTime) {
            matchStage.startTime = { $gte: fromTime, $lte: toTime };
        } else if (fromTime) {
            matchStage.startTime = { $gte: fromTime };
        } else if (toTime) {
            matchStage.startTime = { $lte: toTime };
        }

        // If search is provided, add an $or to match placeName, address, or guard's name.
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            matchStage.$or = [
                { placeName: { $regex: searchRegex } },
                { address: { $regex: searchRegex } },
                { "guardData.personalInfo.name": { $regex: searchRegex } },
                { "adminData.personalInfo.name": { $regex: searchRegex } }
            ];
        }

        // Use aggregation pipeline with $lookup to join guard data
        const places = await Place.aggregate([
            {
                $lookup: {
                    from: 'users', // Change this if your users collection has a different name
                    localField: 'guard',
                    foreignField: '_id',
                    as: 'guardData'
                }
            },
            { $unwind: "$guardData" },
            {
                $lookup: {
                    from: 'users', // Lookup admin details
                    localField: 'admin',
                    foreignField: '_id',
                    as: 'adminData'
                }
            },
            { $unwind: "$adminData" },
            { $match: matchStage },
            {
                $project: {
                    date: 1,
                    startTime: 1,
                    endTime: 1,
                    placeName: 1,
                    address: 1,
                    status: 1,
                    placePhoto: 1,
                    guard: "$guardData",
                    admin:"$adminData"
                }
            }
        ]);
        
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
    } catch (error) {
        console.error('Error fetching places:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});


// POST /apiPlaces/places - Create a new place record with geocoding
router.post('/places', upload.single('placePhoto'), authMiddleware, async (req, res) => {
    try {
        let { date, startTime, endTime, guard, placeName, address, status } = req.body;
        if (!date || !startTime || !endTime || !guard || !placeName || !address) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }
        const shiftDate = new Date(date);
        if (!status) status = 'Scheduled';

        // Conflict Check: Ensure the guard is not already assigned on the same day.
        const startOfDay = new Date(shiftDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(shiftDate);
        endOfDay.setHours(23, 59, 59, 999);
        const existingPlace = await Place.findOne({
            guard,
            date: { $gte: startOfDay, $lte: endOfDay },
        });
        if (existingPlace) {
            return res.status(400).json({ message: 'Guard is already assigned to a place on this day.' });
        }

        // Geocode the address using Nominatim
        let coords;
        try {
            coords = await geocodeAddress(address);
        } catch (err) {
            return res.status(400).json({ message: 'Unable to geocode address.' });
        }

        let placePhotoUrl = "";
        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'place_photos' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(req.file.buffer);
            });
            placePhotoUrl = result.secure_url;
        }

        const newPlace = new Place({
            date: shiftDate,
            startTime,
            endTime,
            guard,
            admin: req.user.id, // Assign Admin Here
            placeName,
            address,
            placePhoto: placePhotoUrl,
            status,
            latitude: coords.latitude, // Save geocoded latitude
            longitude: coords.longitude // Save geocoded longitude
        });

        await newPlace.save();
        // Create a notification for the assigned guard
        await Notification.create({
            user: guard,
            message: 'A new place has been assigned to you.',
            severity: 'info'
        });
        res.status(201).json({ message: 'Place created successfully.', place: newPlace });
    } catch (error) {
        console.error('Error creating place:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});


// DELETE /apiPlaces/places/:id - Delete a place record
router.delete('/places/:id', authMiddleware, async (req, res) => {
    try {
        const place = await Place.findByIdAndDelete(req.params.id);
        if (!place) {
            return res.status(404).json({ message: 'Place not found.' });
        }
        res.json({ message: 'Place deleted successfully.' });
    } catch (error) {
        console.error('Error deleting place:', error.message);
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /apiPlaces/places/:id - Update a place record
router.put('/places/:id', upload.single('placePhoto'), authMiddleware, async (req, res) => {
    try {
        const placeId = req.params.id;
        let { date, startTime, endTime, guard, placeName, address, status } = req.body;
        if (!date || !startTime || !endTime || !guard || !placeName || !address) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }
        const shiftDate = new Date(date);
        if (!status) status = 'Scheduled';

        // Conflict Check: Ensure the guard is not already assigned on the same day.
        const startOfDay = new Date(shiftDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(shiftDate);
        endOfDay.setHours(23, 59, 59, 999);
        // const existingPlace = await Place.findOne({
        //     guard,
        //     date: { $gte: startOfDay, $lte: endOfDay },
        // });
        // if (existingPlace) {
        //     return res.status(400).json({ message: 'Guard is already assigned to a place on this day.' });
        // }

        let updateData = {
            date: shiftDate,
            startTime,
            endTime,
            guard,
            placeName,
            address,
            status,
        };

        // If a new place photo is uploaded, update the photo URL.
        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'place_photos' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(req.file.buffer);
            });
            updateData.placePhoto = result.secure_url;
        }

        // Re-geocode the address to update coordinates.
        try {
            const coords = await geocodeAddress(address);
            updateData.latitude = coords.latitude;
            updateData.longitude = coords.longitude;
        } catch (err) {
            return res.status(400).json({ message: 'Unable to geocode address.' });
        }

        const updatedPlace = await Place.findByIdAndUpdate(placeId, updateData, { new: true });
        if (!updatedPlace) {
            return res.status(404).json({ message: 'Place not found' });
        }
        await Notification.create({
            user: guard,
            message: 'Place details have been updated.',
            severity: 'info'
        });
        res.json({ message: 'Place updated successfully', place: updatedPlace });
    } catch (error) {
        console.error('Error updating place:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;
