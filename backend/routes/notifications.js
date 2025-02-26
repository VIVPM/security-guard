// routes/notifications.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');

// GET notifications for the logged-in user (all, sorted by newest first)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id }).sort({ timestamp: -1 });
        res.json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// PUT route to mark all notifications as read for the current user
router.put('/read', authMiddleware, async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user.id, read: false }, { $set: { read: true } });
        res.json({ message: 'Notifications marked as read' });
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
