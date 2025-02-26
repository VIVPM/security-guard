// models/Place.js
const mongoose = require('mongoose');

const PlaceSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
    },
    startTime: {
        type: String,
        required: true,
    },
    endTime: {
        type: String,
        required: true,
    },
    guard: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    placeName: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    placePhoto: {
        type: String,
    },
    // New fields: store the coordinates of the place.
    latitude: {
        type: Number,
        required: true,
    },
    longitude: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['Scheduled', 'In Progress', 'Completed'],
        default: 'Scheduled',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Place', PlaceSchema);
