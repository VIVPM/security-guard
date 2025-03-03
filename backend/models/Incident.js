const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
    // The guard (user) who reported the incident
    guard: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // The date and time when the incident occurred
    incidentTime: {
        type: String,
        required: true,
    },
    // The date when the incident occurred (without time component)
    incidentDate: {
        type: Date,
        required: true,
    },
    // A brief description or landmark indicating the incident location
    location: {
        type: String,
        required: true,
    },
    // A more detailed address of the incident location
    address: {
        type: String,
    },
    // A detailed description of the incident
    description: {
        type: String,
        required: true,
    },
    // Array of image file URLs related to the incident
    images: [
        {
            type: String,
        },
    ],
    // Array of video file URLs related to the incident
    videos: [
        {
            type: String,
        },
    ],
    // Status of the incident with predefined allowed values
    status: {
        type: String,
        enum: ['Reported', 'Investigating', 'Resolved'],
        default: 'Reported',
    },
    // New attributes: store geocoded latitude and longitude
    latitude: {
        type: Number,
    },
    longitude: {
        type: Number,
    },
    // Automatically record the time the incident report was created
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Incident', IncidentSchema);