// models/Location.js
const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    latitude: {
        type: Number,
        required: true,
    },
    longitude: {
        type: Number,
        required: true,
    },
}, { timestamps: true }); // adds createdAt and updatedAt automatically

module.exports = mongoose.model('Location', LocationSchema);
