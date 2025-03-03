// src/pages/ProfilePage.js
import React, { useState, useEffect } from 'react';
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
    Avatar,
    Paper,
    // CircularProgress,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import axios from 'axios';
import apiList from './apiList';

const ProfilePage = () => {
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        personalInfo: {
            name: "",
            dateOfBirth: "",
            gender: "",
            location: "",
            address: "",
            email: "",
            phone: "",
            profilePicture: "",
            password: "",
            type: "Guard",
        },
        workExperience: [],
        certifications: [],
        trainingAndSkills: {
            trainings: "",
            skills: "",
        },
        emergencyContact: {
            name: "",
            relationship: "",
            phone: "",
        },
        backgroundCheck: {} // New field for background check data
    });
    const [file, setFile] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    // Fetch current profile on mount
    useEffect(() => {
        axios
            .get(apiList.getProfile, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            })
            .then((res) => {
                const data = res.data;
                setFormData({
                    personalInfo: data.personalInfo,
                    workExperience: data.workExperience || [],
                    certifications: data.certifications || [],
                    trainingAndSkills: {
                        trainings: data.trainingAndSkills?.trainings
                            ? data.trainingAndSkills.trainings.join(', ')
                            : "",
                        skills: data.trainingAndSkills?.skills
                            ? data.trainingAndSkills.skills.join(', ')
                            : "",
                    },
                    emergencyContact: data.emergencyContact || {},
                    backgroundCheck: data.backgroundCheck || {},
                });
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    // Handle file input change and show preview
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setPreviewImage(URL.createObjectURL(e.target.files[0]));
        }
    };

    // Handlers for changes in form fields
    const handlePersonalInfoChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            personalInfo: { ...prev.personalInfo, [name]: value },
        }));
    };

    const handleWorkExperienceChange = (index, e) => {
        const { name, value } = e.target;
        const newWorkExp = [...formData.workExperience];
        newWorkExp[index] = { ...newWorkExp[index], [name]: value };
        setFormData((prev) => ({ ...prev, workExperience: newWorkExp }));
    };

    const addWorkExperience = () => {
        setFormData((prev) => ({
            ...prev,
            workExperience: [
                ...prev.workExperience,
                { role: "", company: "", startDate: "", endDate: "", description: "", url: "" },
            ],
        }));
    };

    const removeWorkExperience = (index) => {
        const newWorkExp = formData.workExperience.filter((_, i) => i !== index);
        setFormData((prev) => ({ ...prev, workExperience: newWorkExp }));
    };

    const handleCertificationChange = (index, e) => {
        const { name, value } = e.target;
        const newCerts = [...formData.certifications];
        newCerts[index] = { ...newCerts[index], [name]: value };
        setFormData((prev) => ({ ...prev, certifications: newCerts }));
    };

    const addCertification = () => {
        setFormData((prev) => ({
            ...prev,
            certifications: [
                ...prev.certifications,
                { title: "", issuingAuthority: "", dateIssued: "", url: "" },
            ],
        }));
    };

    const removeCertification = (index) => {
        const newCerts = formData.certifications.filter((_, i) => i !== index);
        setFormData((prev) => ({ ...prev, certifications: newCerts }));
    };

    const handleTrainingAndSkillsChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            trainingAndSkills: { ...prev.trainingAndSkills, [name]: value },
        }));
    };

    const handleEmergencyContactChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            emergencyContact: { ...prev.emergencyContact, [name]: value },
        }));
    };

    // On form submission, send FormData (including file, if any)
    const onSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        if (file) {
            data.append('profilePicture', file);
        }
        data.append('personalInfo', JSON.stringify(formData.personalInfo));
        data.append('workExperience', JSON.stringify(formData.workExperience));
        data.append('certifications', JSON.stringify(formData.certifications));
        data.append('trainingAndSkills', JSON.stringify(formData.trainingAndSkills));
        data.append('emergencyContact', JSON.stringify(formData.emergencyContact));
        // Note: Background check is not editable in this form.
        try {
            await axios.put(apiList.putProfile, data, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            setSnackbarMessage('Profile updated successfully!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (err) {
            setSnackbarMessage('Profile update failed: ' + (err.response?.data?.message || 'An error occurred'));
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbarOpen(false);
    };

    if (loading)
        return (
            <Typography variant="h6" align="center">
                Loading profile...
            </Typography>
        );

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" align="center" gutterBottom>
                    My Profile
                </Typography>

                {/* Profile Image Preview */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                    <Avatar
                        src={previewImage || formData.personalInfo.profilePicture}
                        alt={formData.personalInfo.name}
                        sx={{ width: 150, height: 150, mb: 1, cursor: 'pointer' }}
                        onClick={() => document.getElementById('profilePicInput').click()}
                    />
                    <Button variant="outlined" component="label">
                        Change Profile Picture
                        <input type="file" id="profilePicInput" hidden accept="image/*" onChange={handleFileChange} />
                    </Button>
                </Box>

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
                                    // disabled
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Date of Birth"
                                    name="dateOfBirth"
                                    type="date"
                                    value={formData.personalInfo.dateOfBirth ? formData.personalInfo.dateOfBirth.split('T')[0] : ''}
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
                                    <option value="">Select</option>
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
                                            value={exp.startDate ? exp.startDate.split('T')[0] : ''}
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
                                            value={exp.endDate ? exp.endDate.split('T')[0] : ''}
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
                                        <TextField label="Title" name="title" value={cert.title} onChange={(e) => handleCertificationChange(index, e)} fullWidth />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField label="Issuing Authority" name="issuingAuthority" value={cert.issuingAuthority} onChange={(e) => handleCertificationChange(index, e)} fullWidth />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField label="Date Issued" name="dateIssued" type="date" value={cert.dateIssued ? cert.dateIssued.split('T')[0] : ''} onChange={(e) => handleCertificationChange(index, e)} fullWidth InputLabelProps={{ shrink: true }} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField label="URL" name="url" value={cert.url} onChange={(e) => handleCertificationChange(index, e)} fullWidth />
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
                                <TextField label="Trainings (comma separated)" name="trainings" value={formData.trainingAndSkills.trainings} onChange={handleTrainingAndSkillsChange} fullWidth />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField label="Skills (comma separated)" name="skills" value={formData.trainingAndSkills.skills} onChange={handleTrainingAndSkillsChange} fullWidth />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Emergency Contact Section */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6">Emergency Contact</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <TextField label="Name" name="name" value={formData.emergencyContact.name} onChange={handleEmergencyContactChange} fullWidth />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField label="Relationship" name="relationship" value={formData.emergencyContact.relationship} onChange={handleEmergencyContactChange} fullWidth />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField label="Phone" name="phone" value={formData.emergencyContact.phone} onChange={handleEmergencyContactChange} fullWidth />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Background Check Section (Read-Only) */}
                    {formData.backgroundCheck &&
                        (formData.backgroundCheck.clearanceLevel ||
                            formData.backgroundCheck.status ||
                            formData.backgroundCheck.lastUpdated) && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6">Background Check</Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="body2">
                                        <strong>Clearance Level:</strong>{" "}
                                        {formData.backgroundCheck.clearanceLevel || "-"}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Status:</strong>{" "}
                                        {formData.backgroundCheck.status || "-"}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Last Updated:</strong>{" "}
                                        {formData.backgroundCheck.lastUpdated
                                            ? new Date(formData.backgroundCheck.lastUpdated).toLocaleDateString()
                                            : "-"}
                                    </Typography>
                                </Paper>
                            </Box>
                        )}

                    <Button type="submit" variant="contained" color="primary" fullWidth>
                        Update Profile
                    </Button>
                </form>
            </Box>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                sx={{ top: '75% !important', transform: 'translateY(-50%)' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default ProfilePage;
