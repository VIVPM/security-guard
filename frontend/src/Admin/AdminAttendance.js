// // src/components/AdminAttendance.js
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import {
//     Container,
//     Box,
//     TextField,
//     Button,
//     Typography,
//     Paper,
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableRow,
//     Snackbar,
//     Alert
// } from '@mui/material';
// import apiList from '../components/apiList';

// const AdminAttendance = () => {
//     const today = new Date().toISOString().split('T')[0];
//     const [selectedDate, setSelectedDate] = useState(today);
//     const [attendanceData, setAttendanceData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

//     const handleDateChange = (e) => {
//         setSelectedDate(e.target.value);
//     };

//     const fetchAttendance = async () => {
//         setLoading(true);
//         try {
//             const token = localStorage.getItem('token');
//             const response = await axios.get(`${apiList.specificAttendanceDateGuards}?date=${selectedDate}`, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             setAttendanceData(response.data);
//         } catch (error) {
//             console.error('Error fetching attendance:', error);
//             setSnackbar({ open: true, message: 'Error fetching attendance.', severity: 'error' });
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchAttendance();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, []);

//     const handleSendEmail = async (guardId) => {
//         try {
//             const token = localStorage.getItem('token');
//             await axios.post(
//                 apiList.sendEmailGuards,
//                 { guardId, date: selectedDate },
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );
//             setSnackbar({ open: true, message: 'Email sent successfully.', severity: 'success' });
//         } catch (error) {
//             console.error('Error sending email:', error);
//             setSnackbar({ open: true, message: 'Error sending email.', severity: 'error' });
//         }
//     };

//     // Helper function to format time if present.
//     const formatTime = (time) => {
//         if (!time) return null;
//         return new Date(time).toLocaleTimeString();
//     };

//     const handleSnackbarClose = (event, reason) => {
//         if (reason === 'clickaway') return;
//         setSnackbar({ ...snackbar, open: false });
//     };

//     return (
//         <Container sx={{ mt: 4 }}>
//             <Typography variant="h4" gutterBottom>
//                 Attendance for Admin
//             </Typography>
//             <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
//                 <TextField
//                     label="Select Date"
//                     type="date"
//                     value={selectedDate}
//                     onChange={handleDateChange}
//                     InputLabelProps={{ shrink: true }}
//                 />
//                 <Button variant="contained" color="primary" sx={{ ml: 2 }} onClick={fetchAttendance}>
//                     Submit
//                 </Button>
//             </Box>
//             {loading ? (
//                 <Typography>Loading...</Typography>
//             ) : (
//                 <Paper>
//                     <Table>
//                         <TableHead>
//                             <TableRow>
//                                 <TableCell>Guard Name</TableCell>
//                                 <TableCell>Place Name</TableCell>
//                                 <TableCell>Address</TableCell>
//                                 <TableCell>Shift Time</TableCell>
//                                 <TableCell>Check In Time</TableCell>
//                                 <TableCell>Check Out Time</TableCell>
//                                 <TableCell>Status</TableCell>
//                                 <TableCell>Action</TableCell>
//                             </TableRow>
//                         </TableHead>
//                         <TableBody>
//                             {attendanceData.map((record, index) => (
//                                 <TableRow key={index}>
//                                     <TableCell>{record.guardName}</TableCell>
//                                     <TableCell>{record.placeName}</TableCell>
//                                     <TableCell>{record.address}</TableCell>
//                                     <TableCell>{record.shiftTime}</TableCell>
//                                     <TableCell>
//                                         {record.checkInTime
//                                             ? formatTime(record.checkInTime)
//                                             : `${record.guardName} didn't check in yet`}
//                                     </TableCell>
//                                     <TableCell>
//                                         {record.checkOutTime
//                                             ? formatTime(record.checkOutTime)
//                                             : `${record.guardName} didn't check out yet`}
//                                     </TableCell>
//                                     <TableCell>{record.status}</TableCell>
//                                     <TableCell>
//                                         <Button
//                                             variant="contained"
//                                             color="secondary"
//                                             onClick={() => handleSendEmail(record.guardId)}
//                                         >
//                                             Send Email
//                                         </Button>
//                                     </TableCell>
//                                 </TableRow>
//                             ))}
//                             {attendanceData.length === 0 && (
//                                 <TableRow>
//                                     <TableCell colSpan={8} align="center">
//                                         No attendance records found for this date.
//                                     </TableCell>
//                                 </TableRow>
//                             )}
//                         </TableBody>
//                     </Table>
//                 </Paper>
//             )}
//             <Snackbar
//                 open={snackbar.open}
//                 autoHideDuration={4000}
//                 onClose={handleSnackbarClose}
//                 anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
//             >
//                 <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
//                     {snackbar.message}
//                 </Alert>
//             </Snackbar>
//         </Container>
//     );
// };

// export default AdminAttendance;


// src/components/AdminAttendance.js
import React, { useState } from 'react';
import axios from 'axios';
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Snackbar,
    Alert
} from '@mui/material';
import apiList from '../components/apiList';

const AdminAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(false);
    // New state to track if the submit button was clicked.
    const [submitted, setSubmitted] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
        // Reset submitted flag if the date changes.
        setSubmitted(false);
    };

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${apiList.specificAttendanceDateGuards}?date=${selectedDate}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAttendanceData(response.data);
            // Set submitted to true so that the Action column shows only after clicking Submit.
            setSubmitted(true);
        } catch (error) {
            console.error('Error fetching attendance:', error);
            setSnackbar({ open: true, message: 'Error fetching attendance.', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmail = async (guardId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                apiList.sendEmailGuards,
                { guardId, date: selectedDate },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSnackbar({ open: true, message: 'Email sent successfully.', severity: 'success' });
        } catch (error) {
            console.error('Error sending email:', error);
            setSnackbar({ open: true, message: 'Error sending email.', severity: 'error' });
        }
    };

    // Helper function to format time if present.
    const formatTime = (time) => {
        if (!time) return null;
        return new Date(time).toLocaleTimeString();
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                Attendance for Admin
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TextField
                    label="Select Date"
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    InputLabelProps={{ shrink: true }}
                />
                <Button variant="contained" color="primary" sx={{ ml: 2 }} onClick={fetchAttendance}>
                    Submit
                </Button>
            </Box>
            {loading ? (
                <Typography>Loading...</Typography>
            ) : (
                <Paper>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Guard Name</TableCell>
                                <TableCell>Place Name</TableCell>
                                <TableCell>Address</TableCell>
                                <TableCell>Shift Time</TableCell>
                                <TableCell>Check In Time</TableCell>
                                <TableCell>Check Out Time</TableCell>
                                <TableCell>Status</TableCell>
                                {/* Render the Action column only if the form was submitted and the selected date is today */}
                                {submitted && selectedDate === today && <TableCell>Action</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {attendanceData.map((record, index) => (
                                <TableRow key={index}>
                                    <TableCell>{record.guardName}</TableCell>
                                    <TableCell>{record.placeName}</TableCell>
                                    <TableCell>{record.address}</TableCell>
                                    <TableCell>{record.shiftTime}</TableCell>
                                    <TableCell>
                                        {record.checkInTime
                                            ? formatTime(record.checkInTime)
                                            : `${record.guardName} didn't check in yet`}
                                    </TableCell>
                                    <TableCell>
                                        {record.checkOutTime
                                            ? formatTime(record.checkOutTime)
                                            : `${record.guardName} didn't check out yet`}
                                    </TableCell>
                                    <TableCell>{record.status}</TableCell>
                                    {/* Only show the Send Email button if submitted is true and the selected date is today */}
                                    {submitted && selectedDate === today && (
                                        <TableCell>
                                            <Button
                                                variant="contained"
                                                color="secondary"
                                                onClick={() => handleSendEmail(record.guardId)}
                                            >
                                                Send Email
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                            {attendanceData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={submitted && selectedDate === today ? 8 : 7} align="center">
                                        No attendance records found for this date.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Paper>
            )}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default AdminAttendance;
