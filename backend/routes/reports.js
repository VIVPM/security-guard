const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Place = require('../models/Place');
const Incident = require('../models/Incident');

// GET /apiReports/guard/:guardId
router.get('/guard/:guardId', async (req, res) => {
    try {
        const guardId = req.params.guardId;
        const guardObjectId = new mongoose.Types.ObjectId(guardId);
        const { startDate, endDate } = req.query;

        // Build date filter for Place collection (using the "date" field)
        const placeFilter = { guard: guardObjectId };
        if (startDate || endDate) {
            placeFilter.date = {};
            if (startDate) placeFilter.date.$gte = new Date(startDate);
            if (endDate) placeFilter.date.$lte = new Date(endDate);
        }

        // Build filter for other guards in Place collection
        const otherPlaceFilter = { guard: { $ne: guardObjectId } };
        if (startDate || endDate) {
            otherPlaceFilter.date = {};
            if (startDate) otherPlaceFilter.date.$gte = new Date(startDate);
            if (endDate) otherPlaceFilter.date.$lte = new Date(endDate);
        }

        // Build date filter for Incident collection (using the "incidentDate" field)
        const incidentFilter = { guard: guardObjectId };
        if (startDate || endDate) {
            incidentFilter.incidentDate = {};
            if (startDate) incidentFilter.incidentDate.$gte = new Date(startDate);
            if (endDate) incidentFilter.incidentDate.$lte = new Date(endDate);
        }

        // Graph 1: Place Status Distribution
        const placeStatus = await Place.aggregate([
            { $match: placeFilter },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // Graph 2: Average Hours Assigned for selected guard
        const selectedGuardHoursData = await Place.aggregate([
            { $match: placeFilter },
            {
                $project: {
                    startParts: { $split: ["$startTime", ":"] },
                    endParts: { $split: ["$endTime", ":"] }
                }
            },
            {
                $project: {
                    startHour: { $toInt: { $arrayElemAt: ["$startParts", 0] } },
                    startMin: { $toInt: { $arrayElemAt: ["$startParts", 1] } },
                    endHour: { $toInt: { $arrayElemAt: ["$endParts", 0] } },
                    endMin: { $toInt: { $arrayElemAt: ["$endParts", 1] } }
                }
            },
            {
                $project: {
                    hoursAssigned: {
                        $divide: [
                            {
                                $subtract: [
                                    { $add: [{ $multiply: ["$endHour", 60] }, "$endMin"] },
                                    { $add: [{ $multiply: ["$startHour", 60] }, "$startMin"] }
                                ]
                            },
                            60
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    avgHours: { $avg: "$hoursAssigned" }
                }
            }
        ]);
        const selectedGuardAvgHours = selectedGuardHoursData.length > 0 ? selectedGuardHoursData[0].avgHours : 0;

        // Graph 2: Average Hours Assigned for other guards
        const otherGuardsHoursData = await Place.aggregate([
            { $match: otherPlaceFilter },
            {
                $project: {
                    startParts: { $split: ["$startTime", ":"] },
                    endParts: { $split: ["$endTime", ":"] }
                }
            },
            {
                $project: {
                    startHour: { $toInt: { $arrayElemAt: ["$startParts", 0] } },
                    startMin: { $toInt: { $arrayElemAt: ["$startParts", 1] } },
                    endHour: { $toInt: { $arrayElemAt: ["$endParts", 0] } },
                    endMin: { $toInt: { $arrayElemAt: ["$endParts", 1] } }
                }
            },
            {
                $project: {
                    hoursAssigned: {
                        $divide: [
                            {
                                $subtract: [
                                    { $add: [{ $multiply: ["$endHour", 60] }, "$endMin"] },
                                    { $add: [{ $multiply: ["$startHour", 60] }, "$startMin"] }
                                ]
                            },
                            60
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    avgHours: { $avg: "$hoursAssigned" }
                }
            }
        ]);
        const otherGuardsAvgHours = otherGuardsHoursData.length > 0 ? otherGuardsHoursData[0].avgHours : 0;

        // Graph 3: Count of Places Assigned – selected guard vs. others
        const selectedGuardPlaceCount = await Place.countDocuments(placeFilter);
        const otherGuardsPlaceData = await Place.aggregate([
            { $match: otherPlaceFilter },
            { $group: { _id: "$guard", count: { $sum: 1 } } },
            { $group: { _id: null, avgCount: { $avg: "$count" } } }
        ]);
        const otherGuardsAvgPlaceCount = otherGuardsPlaceData.length > 0 ? otherGuardsPlaceData[0].avgCount : 0;

        // Graph 4: Incident Status Distribution for selected guard
        const incidentStatus = await Incident.aggregate([
            { $match: incidentFilter },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // Graph 5: Count of Incidents Reported – selected guard vs. others
        const selectedGuardIncidentCount = await Incident.countDocuments(incidentFilter);
        const otherIncidentFilter = { guard: { $ne: guardObjectId } };
        if (startDate || endDate) {
            otherIncidentFilter.incidentDate = {};
            if (startDate) otherIncidentFilter.incidentDate.$gte = new Date(startDate);
            if (endDate) otherIncidentFilter.incidentDate.$lte = new Date(endDate);
        }
        const otherGuardsIncidentData = await Incident.aggregate([
            { $match: otherIncidentFilter },
            { $group: { _id: "$guard", count: { $sum: 1 } } },
            { $group: { _id: null, avgCount: { $avg: "$count" } } }
        ]);
        const otherGuardsAvgIncidentCount = otherGuardsIncidentData.length > 0 ? otherGuardsIncidentData[0].avgCount : 0;

        // Graph 6: Global Incident Resolution (all guards)
        let incidentGlobalFilter = {};
        if (startDate || endDate) {
            incidentGlobalFilter.incidentDate = {};
            if (startDate) incidentGlobalFilter.incidentDate.$gte = new Date(startDate);
            if (endDate) incidentGlobalFilter.incidentDate.$lte = new Date(endDate);
        }
        const resolvedCount = await Incident.countDocuments({ status: "Resolved", ...incidentGlobalFilter });
        const nonResolvedCount = await Incident.countDocuments({ status: { $ne: "Resolved" }, ...incidentGlobalFilter });

        res.json({
            placeStatus,
            selectedGuardAvgHours,
            otherGuardsAvgHours,
            selectedGuardPlaceCount,
            otherGuardsAvgPlaceCount,
            incidentStatus,
            selectedGuardIncidentCount,
            otherGuardsAvgIncidentCount,
            globalIncidentResolution: {
                resolved: resolvedCount,
                nonResolved: nonResolvedCount
            }
        });
    } catch (error) {
        console.error('Error fetching report data:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/all', async (req, res) => {
    try {
        // No date filters are applied; use empty filter objects.
        const placeFilter = {};
        const incidentFilter = {};

        // Aggregate Place Status Distribution across all guards.
        const placeStatus = await Place.aggregate([
            { $match: placeFilter },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // Aggregate Incident Status Distribution across all guards.
        const incidentStatus = await Incident.aggregate([
            { $match: incidentFilter },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        res.json({ placeStatus, incidentStatus });
    } catch (error) {
        console.error('Error fetching aggregated report data:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
