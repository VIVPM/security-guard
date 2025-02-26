// src/pages/ResetPasswordPage.jsx
import React, { useState } from 'react';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Snackbar,
    Alert,
    LinearProgress,
} from '@mui/material';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';

const ResetPasswordPage = () => {
    const { token } = useParams();
    const history = useHistory();

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });
    const { password, confirmPassword } = formData;

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [loading, setLoading] = useState(false);

    // For password strength indicator
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordFeedback, setPasswordFeedback] = useState('');

    const onChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (name === 'password') {
            evaluatePasswordStrength(value);
        }
    };

    const evaluatePasswordStrength = (pwd) => {
        let strength = 0;
        let feedback = '';

        // Checks for: length, lowercase, uppercase, digit, special character
        if (pwd.length >= 8) strength += 1;
        if (/[a-z]/.test(pwd)) strength += 1;
        if (/[A-Z]/.test(pwd)) strength += 1;
        if (/\d/.test(pwd)) strength += 1;
        if (/[@$!%*?&]/.test(pwd)) strength += 1;

        if (strength <= 2) {
            feedback = 'Weak';
        } else if (strength === 3) {
            feedback = 'Moderate';
        } else if (strength >= 4) {
            feedback = 'Strong';
        }

        setPasswordStrength(strength);
        setPasswordFeedback(feedback);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setSnackbar({ open: true, message: 'Passwords do not match.', severity: 'error' });
            return;
        }
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/apiAuth/reset-password', {
                token,
                password,
                confirmPassword,
            });
            setSnackbar({ open: true, message: res.data.message, severity: 'success' });
            setTimeout(() => history.push('/login'), 1500);
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Reset failed.', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 4 }}>
                <Typography variant="h4" align="center" gutterBottom>
                    Reset Password
                </Typography>
                <Typography variant="body1" align="center" gutterBottom>
                    Password must be at least 8 characters long and include uppercase, lowercase, digit, and special character.
                </Typography>
                <form onSubmit={onSubmit}>
                    <TextField
                        label="New Password"
                        variant="outlined"
                        margin="normal"
                        fullWidth
                        type="password"
                        name="password"
                        value={password}
                        onChange={onChange}
                        required
                    />
                    <Box sx={{ width: '100%', mb: 1 }}>
                        <LinearProgress variant="determinate" value={(passwordStrength / 5) * 100} />
                        <Typography variant="caption">{passwordFeedback}</Typography>
                    </Box>
                    <TextField
                        label="Confirm New Password"
                        variant="outlined"
                        margin="normal"
                        fullWidth
                        type="password"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={onChange}
                        required
                    />
                    <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }} disabled={loading}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                </form>
            </Box>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default ResetPasswordPage;
