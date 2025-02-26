// routes/locationRoutes.js
const express = require('express');
const router = express.Router();
const Location = require('../models/location');
const auth = require('../middleware/auth'); // Your auth middleware

// POST /api/locations
// Update (or create) location for the current user
router.post('/', auth, async (req, res) => {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ message: 'Latitude and longitude are required.' });
    }
    try {
        let location = await Location.findOne({ user: req.user.id });
        if (!location) {
            location = new Location({
                user: req.user.id,
                latitude,
                longitude,
            });
            await location.save();
        } else {
            location.latitude = latitude;
            location.longitude = longitude;
            await location.save();
        }
        res.json({ message: 'Location updated successfully', location });
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/locations/:userId
// Get location for a given user
router.get('/:userId', auth, async (req, res) => {
    try {
        const location = await Location.findOne({ user: req.params.userId });
        if (!location) {
            return res.status(404).json({ message: 'Location not found.' });
        }
        res.json(location);
    } catch (error) {
        console.error('Error fetching location:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
