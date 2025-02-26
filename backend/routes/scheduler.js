// scheduler.js
const cron = require('node-cron');
const Attendance = require('../models/Attendance');

// Schedule a task to run at midnight every day (00:00)
cron.schedule('0 0 * * *', async () => {
    try {
        // Define today's boundaries in local time
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Find all Attendance documents.
        const attendances = await Attendance.find();
        let updateCount = 0;

        // For each Attendance document, update any record for today missing checkOutTime.
        for (const attendance of attendances) {
            let updated = false;
            for (let record of attendance.records) {
                const recordDate = new Date(record.date);
                // If record's date falls within today and no check-out exists.
                if (recordDate >= todayStart && recordDate <= todayEnd && !record.checkOutTime) {
                    // Set checkOutTime to midnight (todayStart)
                    record.checkOutTime = new Date(todayStart);
                    // Copy checkInLocation as checkOutLocation.
                    record.checkOutLocation = record.checkInLocation;
                    updated = true;
                }
            }
            if (updated) {
                await attendance.save();
                updateCount++;
            }
        }
        console.log(`Updated ${updateCount} attendance records with missing check-out at midnight.`);
    } catch (error) {
        console.error('Error updating attendance records at midnight:', error);
    }
});
