import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Button,
    Typography,
    Box,
    Paper,
    CircularProgress,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Snackbar,
    Alert,
    Pagination
} from '@mui/material';

// Helper: Format a date string to IST (e.g., "dd/mm/yyyy")
const formatDateToIST = (dateStr) => {
    const options = {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    };
    return new Date(dateStr).toLocaleDateString('en-IN', options);
};

// Helper: Format a time string (with given date) to IST with AM/PM.
const formatTimeToIST = (dateStr, timeStr) => {
    const dateObj = new Date(dateStr);
    const [hours, minutes] = timeStr.split(':');
    dateObj.setHours(Number(hours), Number(minutes), 0, 0);
    return dateObj.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
};

const AttendanceDashboard = () => {
    const [places, setPlaces] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    // State for current time (updated periodically)
    const [currentTime, setCurrentTime] = useState(new Date());
    // Snackbar state
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Update currentTime every 30 seconds
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);

    // Fetch assigned places on mount.
    useEffect(() => {
        const fetchPlaces = async () => {
            setLoading(true);
            try {
                const res = await axios.get('https://security-guard.onrender.com/apiProfile/guard', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                setPlaces(res.data);
            } catch (err) {
                setError('Failed to load assigned places.');
            } finally {
                setLoading(false);
            }
        };
        fetchPlaces();
    }, []);

    // Helper: Get current position
    const getCurrentPosition = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve(pos.coords),
                (err) => reject(err)
            );
        });
    };

    // Handler for Check In action
    const handleCheckIn = async (place) => {
        try {
            const coords = await getCurrentPosition();
            const res = await axios.post(
                'https://security-guard.onrender.com/apiAttendance/clock-in',
                {
                    placeId: place._id,
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            setSnackbar({ open: true, message: res.data.message, severity: 'success' });
            setPlaces((prev) =>
                prev.map((p) =>
                    p._id === place._id
                        ? { ...p, status: 'In Progress', attendance: res.data.attendance }
                        : p
                )
            );
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.response?.data?.message || 'Error during check in.',
                severity: 'error'
            });
        }
    };

    // Handler for Check Out action
    const handleCheckOut = async (place) => {
        try {
            const coords = await getCurrentPosition();
            const res = await axios.post(
                'https://security-guard.onrender.com/apiAttendance/clock-out',
                {
                    placeId: place._id,
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            setSnackbar({ open: true, message: res.data.message, severity: 'success' });
            setPlaces((prev) =>
                prev.map((p) =>
                    p._id === place._id
                        ? { ...p, status: 'Completed', attendance: res.data.attendance }
                        : p
                )
            );
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.response?.data?.message || 'Error during check out.',
                severity: 'error'
            });
        }
    };

    // Determine if the given place is for today.
    const isToday = (dateStr) => {
        const d = new Date(dateStr);
        const today = new Date();
        return (
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate()
        );
    };

    // Paginate items.
    const paginatedPlaces = places.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(places.length / itemsPerPage);

    // Determine if any action is available in the paginated list.
    const anyActionAvailable = paginatedPlaces.some((place) => {
        const activeToday = isToday(place.date);
        const canCheckIn = activeToday && place.status === 'Scheduled';
        let canCheckOut = false;
        if (activeToday && place.status === 'In Progress') {
            const [endHour, endMinute] = place.endTime.split(':');
            const shiftEnd = new Date(
                currentTime.getFullYear(),
                currentTime.getMonth(),
                currentTime.getDate(),
                Number(endHour),
                Number(endMinute)
            );
            canCheckOut = currentTime >= shiftEnd;
        }
        return canCheckIn || (activeToday && place.status === 'In Progress' && canCheckOut);
    });

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>
                My Assigned Places & Attendance
            </Typography>
            {loading && <CircularProgress />}
            {error && <Typography color="error">{error}</Typography>}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Place</TableCell>
                            <TableCell>Address</TableCell>
                            <TableCell>Shift Time</TableCell>
                            <TableCell>Status</TableCell>
                            {anyActionAvailable && <TableCell align="center">Action</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedPlaces.map((place) => {
                            const activeToday = isToday(place.date);
                            const canCheckIn = activeToday && place.status === 'Scheduled';
                            let canCheckOut = false;
                            if (activeToday && place.status === 'In Progress') {
                                const [endHour, endMinute] = place.endTime.split(':');
                                const shiftEnd = new Date(
                                    currentTime.getFullYear(),
                                    currentTime.getMonth(),
                                    currentTime.getDate(),
                                    Number(endHour),
                                    Number(endMinute)
                                );
                                canCheckOut = currentTime >= shiftEnd;
                            }
                            return (
                                <TableRow key={place._id}>
                                    <TableCell>{formatDateToIST(place.date)}</TableCell>
                                    <TableCell>{place.placeName}</TableCell>
                                    <TableCell>{place.address}</TableCell>
                                    <TableCell>
                                        {formatTimeToIST(place.date, place.startTime)} - {formatTimeToIST(place.date, place.endTime)}
                                    </TableCell>
                                    <TableCell>{place.status}</TableCell>
                                    {anyActionAvailable && (
                                        <TableCell align="center">
                                            {activeToday && canCheckIn && (
                                                <Button variant="contained" color="primary" onClick={() => handleCheckIn(place)}>
                                                    Check In
                                                </Button>
                                            )}
                                            {activeToday && place.status === 'In Progress' && (
                                                <Button
                                                    variant="contained"
                                                    color="secondary"
                                                    onClick={() => handleCheckOut(place)}
                                                    disabled={!canCheckOut}
                                                >
                                                    Check Out
                                                </Button>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            {/* Pagination controls */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(event, value) => setCurrentPage(value)}
                    color="primary"
                />
            </Box>
            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                sx={{
                    top: '75% !important',
                    transform: 'translateY(-50%)',
                }}
            >
                <Alert onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AttendanceDashboard;
