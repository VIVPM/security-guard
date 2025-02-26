const mongoose = require('mongoose');

const AttendanceRecordSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
    },
    checkInTime: {
        type: Date,
        required: true,
    },
    checkInLocation: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
    },
    checkOutTime: {
        type: Date,
    },
    checkOutLocation: {
        latitude: { type: Number },
        longitude: { type: Number },
    }
}, { _id: false }); // disable _id for subdocuments if desired

const AttendanceSchema = new mongoose.Schema({
    guard: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // one document per guard
    },
    records: [AttendanceRecordSchema]
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
