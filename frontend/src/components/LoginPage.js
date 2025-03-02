import React, { useState, useContext, useEffect } from 'react';
import {
    Container,
    TextField,
    Button,
    Box,
    Typography,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { AuthContext } from '../components/AuthContext';
import apiList from './apiList';

const LoginPage = () => {
    const history = useHistory();
    const { login } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const { email, password } = formData;

    // Snackbar state
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    // Forgot Password Dialog state
    const [forgotDialogOpen, setForgotDialogOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');

    // Will hold the watch id returned by geolocation.watchPosition
    let watchId = null;

    const onChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(apiList.login, { email, password });
            // Save token via context
            login(res.data.token);
            console.log(res);

            // Check if the logged-in user is a Guard.
            // Assuming res.data.user is returned with the login response
            // if (res.data.user && res.data.user.personalInfo.type === 'Guard') {
            //     // Request geolocation permission and start watching position changes
            //     if ("geolocation" in navigator) {
            //         watchId = navigator.geolocation.watchPosition(
            //             (position) => {
            //                 const { latitude, longitude } = position.coords;
            //                 console.log('Coordinates:', latitude, longitude);
            //                 axios.post('http://localhost:5000/apiLocations', { latitude, longitude }, {
            //                     headers: { Authorization: `Bearer ${res.data.token}` }
            //                 })
            //                     .catch(err => console.error('Location update error:', err));
            //             },
            //             (error) => console.error('Error getting location:', error),
            //             { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            //         );
            //     } else {
            //         console.error('Geolocation not available');
            //     }
            // }

            setSnackbarMessage('User logged in successfully!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            setTimeout(() => history.push('/'), 1500);
        } catch (err) {
            setSnackbarMessage(
                'Login failed: ' +
                (err.response?.data?.message || 'An error occurred')
            );
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbarOpen(false);
    };

    const handleForgotSubmit = async () => {
        try {
            await axios.post(apiList.forgotPassword, { email: forgotEmail });
            setSnackbarMessage('Password reset link sent to your email.');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            setForgotDialogOpen(false);
        } catch (err) {
            setSnackbarMessage(
                'Failed to send reset link: ' +
                (err.response?.data?.message || 'An error occurred')
            );
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    useEffect(() => {
        return () => {
            // Clear geolocation watch when the component unmounts
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 4 }}>
                <Typography variant="h4" align="center" gutterBottom>
                    Login
                </Typography>
                <form onSubmit={onSubmit}>
                    <TextField
                        label="Email"
                        variant="outlined"
                        margin="normal"
                        fullWidth
                        type="email"
                        name="email"
                        value={email}
                        onChange={onChange}
                        required
                    />
                    <TextField
                        label="Password"
                        variant="outlined"
                        margin="normal"
                        fullWidth
                        type="password"
                        name="password"
                        value={password}
                        onChange={onChange}
                        required
                    />
                    <Box sx={{ textAlign: 'right', mt: 1 }}>
                        <Button color="primary" onClick={() => setForgotDialogOpen(true)}>
                            Forgot password?
                        </Button>
                    </Box>
                    <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
                        Login
                    </Button>
                </form>
            </Box>

            {/* Forgot Password Dialog */}
            <Dialog open={forgotDialogOpen} onClose={() => setForgotDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Forgot Password</DialogTitle>
                <DialogContent>
                    <Typography>Please enter your email address. You will receive a link to reset your password.</Typography>
                    <TextField
                        label="Email"
                        variant="outlined"
                        margin="normal"
                        fullWidth
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setForgotDialogOpen(false)} color="primary" variant="contained">
                        Cancel
                    </Button>
                    <Button onClick={handleForgotSubmit} color="primary" variant="contained">
                        Send Reset Link
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                sx={{
                    top: '75% !important',
                    transform: 'translateY(-50%)',
                }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default LoginPage;
