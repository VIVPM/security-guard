// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require("path");
// Load environment variables
dotenv.config();

const authRoutes = require('./routes/auth'); // Import routes from the routes folder
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');
const placeRoutes = require('./routes/places');
const incidentRoutes = require('./routes/incidents');
const notificationRoutes = require('./routes/notifications');
const reportRouter = require('./routes/reports');
const attendanceRouter = require('./routes/attendances');
require('./routes/scheduler');

const app = express();
const port = process.env.PORT || 5000;
// app.use(express.static(path.join(__dirname, "build")));

// Middleware to parse JSON bodies
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(cors({ origin: true }));
app.use(express.json());

// Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI, {
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Use the authentication routes under the '/api' path
app.use('/apiAuth', authRoutes);
app.use('/apiProfile', profileRoutes);
app.use('/admin', adminRoutes);
app.use('/apiPlaces', placeRoutes);
app.use('/apiIncidents', incidentRoutes);
app.use('/apiNotifications', notificationRoutes);
app.use('/apiReports', reportRouter);
app.use('/apiAttendance', attendanceRouter);

// app.get("*", (req, res) => {
//     // if (req.originalUrl.startsWith("/apiAuth") || req.originalUrl.startsWith("/apiProfile") || req.originalUrl.startsWith("/admin") || req.originalUrl.startsWith("/apiPlaces") || req.originalUrl.startsWith("/apiNotifications") || req.originalUrl.startsWith("/apiReports") || req.originalUrl.startsWith("/apiAttendance")) {
//     //     return res.status(404).json({ message: "API route not found" });
//     // }
//     res.sendFile(path.join(__dirname, "build", "index.html"));
// });

app.listen(port, () => console.log(`Server running on port ${port}`));
