// src/pages/RegisterPage.js
import React, { useState } from 'react';
import {
    Container,
    TextField,
    Button,
    Box,
    Typography,
    Grid,
    Divider,
    Snackbar,
    Alert,
    CircularProgress
} from '@mui/material';
import { useHistory } from 'react-router-dom';
import { Add, Delete } from '@mui/icons-material';
import axios from 'axios';
import apiList from './apiList';

const RegisterPage = () => {
    const history = useHistory();

    // State for file upload (profile picture)
    const [file, setFile] = useState(null);

    // State for form data
    const [formData, setFormData] = useState({
        personalInfo: {
            name: "",
            dateOfBirth: "",
            gender: "",
            location: "",
            address: "",
            email: "",
            phone: "",
            // profilePicture will be uploaded and its URL saved via Cloudinary
            profilePicture: "",
            password: "",
            type: "Guard"
        },
        workExperience: [
            {
                role: "",
                company: "",
                startDate: "",
                endDate: "",
                description: "",
                url: ""
            }
        ],
        certifications: [
            {
                title: "",
                issuingAuthority: "",
                dateIssued: "",
                url: ""
            }
        ],
        trainingAndSkills: {
            trainings: "", // Comma separated
            skills: ""     // Comma separated
        },
        emergencyContact: {
            name: "",
            relationship: "",
            phone: ""
        }
    });

    // State for submission/loading indicator
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Snackbar state for notifications
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    // Handle file selection for profile picture
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    // Change handlers for nested fields
    const handlePersonalInfoChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            personalInfo: { ...formData.personalInfo, [name]: value }
        });
    };

    const handleWorkExperienceChange = (index, e) => {
        const { name, value } = e.target;
        const newWorkExp = [...formData.workExperience];
        newWorkExp[index] = { ...newWorkExp[index], [name]: value };
        setFormData({ ...formData, workExperience: newWorkExp });
    };

    const addWorkExperience = () => {
        setFormData({
            ...formData,
            workExperience: [
                ...formData.workExperience,
                { role: "", company: "", startDate: "", endDate: "", description: "", url: "" }
            ]
        });
    };

    const removeWorkExperience = (index) => {
        const newWorkExp = formData.workExperience.filter((_, i) => i !== index);
        setFormData({ ...formData, workExperience: newWorkExp });
    };

    const handleCertificationChange = (index, e) => {
        const { name, value } = e.target;
        const newCerts = [...formData.certifications];
        newCerts[index] = { ...newCerts[index], [name]: value };
        setFormData({ ...formData, certifications: newCerts });
    };

    const addCertification = () => {
        setFormData({
            ...formData,
            certifications: [
                ...formData.certifications,
                { title: "", issuingAuthority: "", dateIssued: "", url: "" }
            ]
        });
    };

    const removeCertification = (index) => {
        const newCerts = formData.certifications.filter((_, i) => i !== index);
        setFormData({ ...formData, certifications: newCerts });
    };

    const handleTrainingAndSkillsChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            trainingAndSkills: { ...formData.trainingAndSkills, [name]: value }
        });
    };

    const handleEmergencyContactChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            emergencyContact: { ...formData.emergencyContact, [name]: value }
        });
    };

    // On form submission
    const onSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true); // Start the loading indicator

        try {
            // Create a FormData object to hold file and other data
            const data = new FormData();

            // Append file if selected
            if (file) {
                data.append('profilePicture', file);
            }
            // Append other fields as JSON strings
            data.append('personalInfo', JSON.stringify(formData.personalInfo));
            data.append('workExperience', JSON.stringify(formData.workExperience));
            data.append('certifications', JSON.stringify(formData.certifications));
            data.append('trainingAndSkills', JSON.stringify(formData.trainingAndSkills));
            data.append('emergencyContact', JSON.stringify(formData.emergencyContact));

            await axios.post(apiList.signup, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // If a file was uploaded, show a message indicating the image upload was successful
            if (file) {
                setSnackbarMessage('Image uploaded successfully and user registered successfully!');
            } else {
                setSnackbarMessage('User registered successfully!');
            }
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            setTimeout(() => history.push('/'), 1500);
        } catch (err) {
            setSnackbarMessage(
                'Registration failed: ' +
                (err.response?.data?.message || 'An error occurred')
            );
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setIsSubmitting(false); // Stop the loading indicator
        }
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbarOpen(false);
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" align="center" gutterBottom>
                    Register as Guard
                </Typography>
                <form onSubmit={onSubmit}>
                    {/* Personal Information Section */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6">Personal Information</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Name"
                                    name="name"
                                    value={formData.personalInfo.name}
                                    onChange={handlePersonalInfoChange}
                                    fullWidth
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.personalInfo.email}
                                    onChange={handlePersonalInfoChange}
                                    fullWidth
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Password"
                                    name="password"
                                    type="password"
                                    value={formData.personalInfo.password}
                                    onChange={handlePersonalInfoChange}
                                    fullWidth
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="User Type"
                                    name="type"
                                    value={formData.personalInfo.type}
                                    fullWidth
                                    disabled
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Date of Birth"
                                    name="dateOfBirth"
                                    type="date"
                                    value={formData.personalInfo.dateOfBirth}
                                    onChange={handlePersonalInfoChange}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    label="Gender"
                                    name="gender"
                                    value={formData.personalInfo.gender}
                                    onChange={handlePersonalInfoChange}
                                    fullWidth
                                    SelectProps={{ native: true }}
                                    required
                                >
                                    <option value=""></option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    label="Location"
                                    name="location"
                                    value={formData.personalInfo.location}
                                    onChange={handlePersonalInfoChange}
                                    fullWidth
                                    required
                                    SelectProps={{ native: true }}
                                >
                                    <option value=""></option>
                                    <option value="Bengaluru">Bengaluru</option>
                                    <option value="Mysuru">Mysuru</option>
                                    <option value="Mangalore">Mangalore</option>
                                    <option value="Hubli">Hubli</option>
                                    <option value="Belgaum">Belgaum</option>
                                    <option value="Kalaburagi">Kalaburagi</option>
                                    <option value="Davanagere">Davanagere</option>
                                    <option value="Ballari">Ballari</option>
                                    <option value="Shivamogga">Shivamogga</option>
                                    <option value="Tumakuru">Tumakuru</option>
                                </TextField>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Phone"
                                    name="phone"
                                    value={formData.personalInfo.phone}
                                    onChange={handlePersonalInfoChange}
                                    fullWidth
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Address"
                                    name="address"
                                    value={formData.personalInfo.address}
                                    onChange={handlePersonalInfoChange}
                                    fullWidth
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                {/* File input for profile picture */}
                                <Button variant="outlined" component="label" fullWidth>
                                    Upload Profile Picture
                                    <input
                                        type="file"
                                        name="profilePicture"
                                        hidden
                                        onChange={handleFileChange}
                                        accept="image/*"
                                    />
                                </Button>
                                {file && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        {file.name}
                                    </Typography>
                                )}
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Work Experience Section */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6">Work Experience</Typography>
                        <Divider sx={{ mb: 2 }} />
                        {formData.workExperience.map((exp, index) => (
                            <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Role"
                                            name="role"
                                            value={exp.role}
                                            onChange={(e) => handleWorkExperienceChange(index, e)}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Company"
                                            name="company"
                                            value={exp.company}
                                            onChange={(e) => handleWorkExperienceChange(index, e)}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Start Date"
                                            name="startDate"
                                            type="date"
                                            value={exp.startDate}
                                            onChange={(e) => handleWorkExperienceChange(index, e)}
                                            fullWidth
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="End Date"
                                            name="endDate"
                                            type="date"
                                            value={exp.endDate}
                                            onChange={(e) => handleWorkExperienceChange(index, e)}
                                            fullWidth
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Description"
                                            name="description"
                                            value={exp.description}
                                            onChange={(e) => handleWorkExperienceChange(index, e)}
                                            fullWidth
                                            multiline
                                            rows={3}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="URL"
                                            name="url"
                                            value={exp.url}
                                            onChange={(e) => handleWorkExperienceChange(index, e)}
                                            fullWidth
                                        />
                                    </Grid>
                                </Grid>
                                <Box sx={{ mt: 1 }}>
                                    <Button variant="outlined" color="secondary" onClick={() => removeWorkExperience(index)} startIcon={<Delete />}>
                                        Remove Experience
                                    </Button>
                                </Box>
                            </Box>
                        ))}
                        <Button variant="contained" color="primary" onClick={addWorkExperience} startIcon={<Add />}>
                            Add Work Experience
                        </Button>
                    </Box>

                    {/* Certifications Section */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6">Certifications</Typography>
                        <Divider sx={{ mb: 2 }} />
                        {formData.certifications.map((cert, index) => (
                            <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Title"
                                            name="title"
                                            value={cert.title}
                                            onChange={(e) => handleCertificationChange(index, e)}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Issuing Authority"
                                            name="issuingAuthority"
                                            value={cert.issuingAuthority}
                                            onChange={(e) => handleCertificationChange(index, e)}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Date Issued"
                                            name="dateIssued"
                                            type="date"
                                            value={cert.dateIssued}
                                            onChange={(e) => handleCertificationChange(index, e)}
                                            fullWidth
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="URL"
                                            name="url"
                                            value={cert.url}
                                            onChange={(e) => handleCertificationChange(index, e)}
                                            fullWidth
                                        />
                                    </Grid>
                                </Grid>
                                <Box sx={{ mt: 1 }}>
                                    <Button variant="outlined" color="secondary" onClick={() => removeCertification(index)} startIcon={<Delete />}>
                                        Remove Certification
                                    </Button>
                                </Box>
                            </Box>
                        ))}
                        <Button variant="contained" color="primary" onClick={addCertification} startIcon={<Add />}>
                            Add Certification
                        </Button>
                    </Box>

                    {/* Training & Skills Section */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6">Training & Skills</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    label="Trainings (comma separated)"
                                    name="trainings"
                                    value={formData.trainingAndSkills.trainings}
                                    onChange={handleTrainingAndSkillsChange}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Skills (comma separated)"
                                    name="skills"
                                    value={formData.trainingAndSkills.skills}
                                    onChange={handleTrainingAndSkillsChange}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Emergency Contact Section */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6">Emergency Contact</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Name"
                                    name="name"
                                    value={formData.emergencyContact.name}
                                    onChange={handleEmergencyContactChange}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Relationship"
                                    name="relationship"
                                    value={formData.emergencyContact.relationship}
                                    onChange={handleEmergencyContactChange}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Phone"
                                    name="phone"
                                    value={formData.emergencyContact.phone}
                                    onChange={handleEmergencyContactChange}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    <Button type="submit" variant="contained" color="primary" fullWidth disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                                Registering...
                            </>
                        ) : (
                            "Register"
                        )}
                    </Button>
                </form>
            </Box>

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

export default RegisterPage;
