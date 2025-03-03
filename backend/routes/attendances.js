const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Attendance = require('../models/Attendance');
const Place = require('../models/Place');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Helper: Calculate distance in meters using the Haversine formula.
function getDistanceFromLatLonInKMeters(lat1, lon1, lat2, lon2) {
    function deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
    const R = 6371; // Earth's radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function formatTime(date) {
    return date.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit'
    });
}


// POST /api/attendance/clock-in
// Allow clock-in only when a scheduled place is assigned for today.
// In routes/attendance.js

router.post('/clock-in', auth, async (req, res) => {
    if (req.user.type !== 'Guard') {
        return res.status(403).json({ message: 'Access denied' });
    }
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ message: 'Latitude and longitude are required.' });
    }

    try {
        // Define today's boundaries.
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Find the scheduled place for today with status "Scheduled".
        const assignedPlace = await Place.findOne({
            guard: req.user.id,
            date: { $gte: todayStart, $lte: todayEnd },
            status: 'Scheduled'
        });
        
        if (!assignedPlace) {
            return res.status(400).json({ message: 'No scheduled place assigned for today. Attendance is not required.' });
        }

        // Verify geofence: check guard's location against assigned place coordinates.
        const distance = getDistanceFromLatLonInKMeters(
            latitude,
            longitude,
            assignedPlace.latitude,
            assignedPlace.longitude
        );
        const allowedDistance = 1; // allowed threshold in kilometers
        // console.log(distance);
        if (distance > allowedDistance) {
            return res.status(400).json({
                message: `You are not at the assigned place. Current distance is ${distance.toFixed(2)} meters.`
            });
        }

        // Retrieve or create a single Attendance document for the guard.
        let attendanceDoc = await Attendance.findOne({ guard: req.user.id });
        if (!attendanceDoc) {
            attendanceDoc = new Attendance({ guard: req.user.id, records: [] });
        }

        // Check if a record for today already exists.
        const alreadyClockedIn = attendanceDoc.records.find(record => {
            const recordDate = new Date(record.date);
            return recordDate >= todayStart && recordDate <= todayEnd;
        });
        if (alreadyClockedIn) {
            return res.status(400).json({ message: 'Already clocked in for today.' });
        }

        // Add a new record for today's check-in.
        attendanceDoc.records.push({
            date: new Date(),
            checkInTime: new Date(),
            checkInLocation: { latitude, longitude }
        });
        await attendanceDoc.save();
        // Update the Place status to "In Progress"
        await Place.findByIdAndUpdate(assignedPlace._id, { status: 'In Progress' });

        res.status(201).json({ message: 'Checked in successfully.', attendance: attendanceDoc });
    } catch (error) {
        console.error('Error during clock-in:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// POST /api/attendance/clock-out
// Update the record for today with clock-out time and location.
router.post('/clock-out', auth, async (req, res) => {
    if (req.user.type !== 'Guard') {
        return res.status(403).json({ message: 'Access denied' });
    }
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ message: 'Latitude and longitude are required.' });
    }
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const attendanceDoc = await Attendance.findOne({ guard: req.user.id });
        if (!attendanceDoc) {
            return res.status(400).json({ message: 'No attendance record found for today.' });
        }
        // Find today's record without a check-out time.
        const record = attendanceDoc.records.find(record => {
            const recordDate = new Date(record.date);
            return recordDate >= todayStart && recordDate <= todayEnd && !record.checkOutTime;
        });
        if (!record) {
            return res.status(400).json({ message: 'No clock-in record found for today or already clocked out.' });
        }

        // Retrieve the assigned place (which should be in "In Progress").
        const assignedPlace = await Place.findOne({
            guard: req.user.id,
            date: { $gte: todayStart, $lte: todayEnd },
            status: 'In Progress'
        });
        if (!assignedPlace) {
            return res.status(400).json({ message: 'No active shift found for today.' });
        }

        // Determine the shift end time from the Place.
        const [endHour, endMinute] = assignedPlace.endTime.split(':');
        const shiftEnd = new Date(todayStart);
        shiftEnd.setHours(Number(endHour), Number(endMinute), 0, 0);

        // Convert current time to IST
        const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        // console.log(formatTime(shiftEnd)); // For debugging

        // Ensure current time in IST is at or after shift end.
        if (nowIST < shiftEnd) {
            return res.status(400).json({ message: `You cannot check out before ${formatTime(shiftEnd)}` });
        }


        // Update attendance record with check-out details.
        record.checkOutTime = new Date();
        record.checkOutLocation = { latitude, longitude };
        await attendanceDoc.save();

        // Update Place status to "Completed"
        await Place.findByIdAndUpdate(assignedPlace._id, { status: 'Completed' });

        res.json({ message: 'Checked out successfully.', attendance: attendanceDoc });
    } catch (error) {
        console.error('Error during clock-out:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// GET /api/attendance/guard - Get attendance records for the logged-in guard
router.get('/guard', auth, async (req, res) => {
    if (req.user.type !== 'Guard') {
        return res.status(403).json({ message: 'Access denied' });
    }
    try {
        const attendanceDoc = await Attendance.findOne({ guard: req.user.id });
        res.json(attendanceDoc ? attendanceDoc.records : []);
    } catch (error) {
        console.error('Error fetching attendance records:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/attendance/admin - Get attendance for all guards (admin only)
router.get('/admin', auth, async (req, res) => {
    if (req.user.type !== 'Admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    try {
        const attendanceDocs = await Attendance.find()
            .populate('guard', 'personalInfo.name')
            .sort({ updatedAt: -1 });
        res.json(attendanceDocs);
    } catch (error) {
        console.error('Error fetching attendance records:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// GET /api/attendance/admin/date?date=YYYY-MM-DD
router.get('/date', auth, async (req, res) => {
    if (req.user.type !== 'Admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    try {
        let { date } = req.query;
        if (!date) {
            // Default to today if no date is provided
            date = new Date().toISOString().split('T')[0];
        }
        const selectedDate = new Date(date);
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Find all Place documents created by this admin on the given date.
        const places = await Place.find({
            admin: req.user.id,
            date: { $gte: startOfDay, $lte: endOfDay }
        }).populate('guard', 'personalInfo');

        // For each place, look up the attendance record for that guard on the same day.
        const results = await Promise.all(places.map(async (place) => {
            const attendanceDoc = await Attendance.findOne({ guard: place.guard._id });
            let record = null;
            if (attendanceDoc && attendanceDoc.records && attendanceDoc.records.length > 0) {
                record = attendanceDoc.records.find(r => {
                    const rDate = new Date(r.date);
                    return rDate >= startOfDay && rDate <= endOfDay;
                });
            }

            // Define options for the time format in IST
            const options = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' };

            // Convert the start and end times to IST format
            const startTimeIST = new Date(place.startTime).toLocaleTimeString('en-US', options);
            const endTimeIST = new Date(place.endTime).toLocaleTimeString('en-US', options);

            // Create the shift time string in IST
            const shiftTime = `${startTimeIST} - ${endTimeIST}`;


            return {
                guardId: place.guard._id,
                guardName: place.guard.personalInfo.name,
                guardEmail: place.guard.personalInfo.email,
                placeName: place.placeName,
                address: place.address,
                checkInTime: record && record.checkInTime ? record.checkInTime : null,
                checkOutTime: record && record.checkOutTime ? record.checkOutTime : null,
                status: place.status,
                shiftTime
            };
        }));
        res.json(results);
    } catch (err) {
        console.error('Error fetching admin attendance:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});


// POST /api/attendance/admin/send-email
// Accepts { guardId, date } in the request body and sends a default email notification.
router.post('/send-email', auth, async (req, res) => {
    if (req.user.type !== 'Admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    const { guardId, date } = req.body;
    if (!guardId) {
        return res.status(400).json({ message: 'guardId is required' });
    }
    try {
        const guard = await User.findById(guardId);
        if (!guard) {
            return res.status(404).json({ message: 'Guard not found' });
        }
        const guardEmail = guard.personalInfo.email;
        const guardName = guard.personalInfo.name;

        // Format the date in IST if provided.
        const formattedDate = date
            ? new Date(date).toLocaleDateString('en-IN', {
                timeZone: 'Asia/Kolkata',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            })
            : 'today';

        // Configure nodemailer transporter.
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // Set in your environment variables
                pass: process.env.EMAIL_PASS, // Set in your environment variables (or app password)
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: guardEmail,
            subject: 'Attendance Notification',
            text: `Hello ${guardName},\n\nThis is a reminder regarding your attendance for ${formattedDate}. Please ensure you have checked in and checked out properly.\n\nThank you.`
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'Email sent successfully.' });
    } catch (err) {
        console.error('Error sending email:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
