// scheduler.js
const cron = require('node-cron');
const Attendance = require('../models/Attendance');
const Place = require('../models/Place');

// Schedule a task to run at 17:00 (5:00 PM) every day.
cron.schedule('27 17 * * *', async () => {
    try {
        // Define today's boundaries in local time.
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Find all Attendance documents.
        const attendances = await Attendance.find();
        let attendanceUpdateCount = 0;
        let placeUpdateCount = 0;

        // For each Attendance document, update any record for today missing checkOutTime.
        for (const attendance of attendances) {
            let updated = false;
            for (let record of attendance.records) {
                const recordDate = new Date(record.date);
                // If the record's date falls within today and no check-out exists.
                if (recordDate >= todayStart && recordDate <= todayEnd && !record.checkOutTime) {
                    // Set checkOutTime (using todayStart as a base, modify as needed).
                    record.checkOutTime = new Date(todayStart);
                    // Copy checkInLocation as checkOutLocation.
                    record.checkOutLocation = record.checkInLocation;
                    updated = true;
                }
            }
            if (updated) {
                await attendance.save();
                attendanceUpdateCount++;

                // Find the corresponding Place record for the same guard with today's date.
                const place = await Place.findOne({
                    guard: attendance.guard,
                    date: { $gte: todayStart, $lte: todayEnd }
                });
                if (place && place.status !== 'Completed') {
                    place.status = 'Completed';
                    await place.save();
                    placeUpdateCount++;
                }
            }
        }
        console.log(`Updated ${attendanceUpdateCount} attendance record(s) and ${placeUpdateCount} place record(s) to completed status.`);
    } catch (error) {
        console.error('Error updating records at 17:00:', error);
    }
});
