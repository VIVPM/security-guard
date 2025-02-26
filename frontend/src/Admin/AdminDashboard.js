import React, { useEffect, useState } from 'react';
import {
    Container,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    RadioGroup,
    Typography,
    CircularProgress,
    Button,
    Box,
    Snackbar,
    Radio,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Link as MuiLink,
    FormControlLabel,
    Avatar,
    Pagination, // <-- Import Pagination from MUI
} from '@mui/material';
import axios from 'axios';
// import { Add, Delete } from '@mui/icons-material';

const AdminDashboard = () => {
    const [guards, setGuards] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination state: only five guards per page
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const displayedGuards = guards.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Modal for "More Information" details
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedGuard, setSelectedGuard] = useState(null);
    const [selectedSection, setSelectedSection] = useState(''); // 'workExperience', 'certifications', 'trainingAndSkills'
    const [filterType, setFilterType] = useState(''); // Final filter applied ("Admin", "Guard", or "")
    const [tempFilter, setTempFilter] = useState(''); // Temporary filter selection in dialog

    // Modal for zoomed profile image
    const [zoomImage, setZoomImage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Delete confirmation dialog state
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [guardToDelete, setGuardToDelete] = useState(null);

    // Snackbar state
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // New state for Background Check modal
    const [bgCheckModalOpen, setBgCheckModalOpen] = useState(false);
    const [bgCheckData, setBgCheckData] = useState({
        clearanceLevel: '',
        status: '',
        lastUpdated: '',
    });

    // Helper: Format date strings into locale date (or empty string)
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const dateObj = new Date(dateStr);
        return isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleDateString();
    };

    // Helper: Ensure URL starts with "http://" or "https://"
    const formatURL = (url) => {
        if (url.startsWith('https://')) {
            return url;
        }
        return `https://${url}`;
    };

    // Fetch all guard profiles from the backend
    useEffect(() => {
        axios
            .get('https://security-guard.onrender.com/admin/guards', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            })
            .then((res) => {
                setGuards(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching guard profiles:', err.response?.data || err);
                setLoading(false);
            });
    }, []);

    // "More Information" modal handlers
    const handleMoreInfo = (guard) => {
        setSelectedGuard(guard);
        setSelectedSection('');
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedGuard(null);
        setSelectedSection('');
    };

    const renderSectionForm = () => {
        if (!selectedGuard) return null;
        switch (selectedSection) {
            case 'workExperience':
                return (
                    <Box>
                        {selectedGuard.workExperience && selectedGuard.workExperience.length > 0 ? (
                            selectedGuard.workExperience.map((exp, idx) => (
                                <Box key={idx} sx={{ mb: 2, p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                                    <TextField label="Role" value={exp.role || ''} fullWidth margin="dense" InputProps={{ readOnly: true }} />
                                    <TextField label="Company" value={exp.company || ''} fullWidth margin="dense" InputProps={{ readOnly: true }} />
                                    <TextField label="Start Date" value={exp.startDate ? formatDate(exp.startDate) : ''} fullWidth margin="dense" InputProps={{ readOnly: true }} />
                                    <TextField label="End Date" value={exp.endDate ? formatDate(exp.endDate) : ''} fullWidth margin="dense" InputProps={{ readOnly: true }} />
                                    <TextField label="Description" value={exp.description || ''} fullWidth margin="dense" multiline InputProps={{ readOnly: true }} />
                                    {exp.url && (
                                        <Box sx={{ mt: 1 }}>
                                            <Typography variant="body2">
                                                <strong>URL:</strong>{' '}
                                                <MuiLink href={formatURL(exp.url)} target="_blank" rel="noopener noreferrer">
                                                    {exp.url}
                                                </MuiLink>
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            ))
                        ) : (
                            <Typography variant="body2">No work experience provided.</Typography>
                        )}
                    </Box>
                );
            case 'certifications':
                return (
                    <Box>
                        {selectedGuard.certifications && selectedGuard.certifications.length > 0 ? (
                            selectedGuard.certifications.map((cert, idx) => (
                                <Box key={idx} sx={{ mb: 2, p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                                    <TextField label="Title" value={cert.title || ''} fullWidth margin="dense" InputProps={{ readOnly: true }} />
                                    <TextField label="Issuing Authority" value={cert.issuingAuthority || ''} fullWidth margin="dense" InputProps={{ readOnly: true }} />
                                    <TextField label="Date Issued" value={cert.dateIssued ? formatDate(cert.dateIssued) : ''} fullWidth margin="dense" InputProps={{ readOnly: true }} />
                                    {cert.url && (
                                        <Box sx={{ mt: 1 }}>
                                            <Typography variant="body2">
                                                <strong>URL:</strong>{' '}
                                                <MuiLink href={formatURL(cert.url)} target="_blank" rel="noopener noreferrer">
                                                    {cert.url}
                                                </MuiLink>
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            ))
                        ) : (
                            <Typography variant="body2">No certifications provided.</Typography>
                        )}
                    </Box>
                );
            case 'trainingAndSkills':
                return (
                    <Box>
                        <TextField
                            label="Trainings"
                            value={
                                selectedGuard.trainingAndSkills && selectedGuard.trainingAndSkills.trainings
                                    ? selectedGuard.trainingAndSkills.trainings.join(', ')
                                    : ''
                            }
                            fullWidth
                            margin="dense"
                            InputProps={{ readOnly: true }}
                        />
                        <TextField
                            label="Skills"
                            value={
                                selectedGuard.trainingAndSkills && selectedGuard.trainingAndSkills.skills
                                    ? selectedGuard.trainingAndSkills.skills.join(', ')
                                    : ''
                            }
                            fullWidth
                            margin="dense"
                            InputProps={{ readOnly: true }}
                        />
                    </Box>
                );
            default:
                return (
                    <Typography variant="body2">
                        Click one of the buttons below to view additional information.
                    </Typography>
                );
        }
    };

    // Delete confirmation dialog handlers
    const handleDeleteClick = (guard) => {
        setGuardToDelete(guard);
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setGuardToDelete(null);
    };

    // Fetch guards from backend with optional search and type filter
    const fetchGuards = async () => {
        setLoading(true);
        try {
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (filterType) params.type = filterType;
            const response = await axios.get('https://security-guard.onrender.com/admin/guards', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                params,
            });
            setGuards(response.data);
            // Reset to the first page after fetching new data
            setCurrentPage(1);
        } catch (error) {
            console.error('Error fetching guard profiles:', error);
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to fetch guard profiles',
                severity: 'error',
            });
            console.log(snackbar);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGuards();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterType]);

    const handleSearchButton = () => {
        fetchGuards();
    };

    const handleConfirmDelete = async () => {
        try {
            await axios.delete(`https://security-guard.onrender.com/admin/guard/${guardToDelete._id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setGuards(guards.filter((g) => g._id !== guardToDelete._id));
            setSnackbarMessage('Guard deleted successfully!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            handleCloseDeleteDialog();
        } catch (err) {
            setSnackbarMessage('Failed to delete guard: ' + (err.response?.data?.message || 'An error occurred'));
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            handleCloseDeleteDialog();
        }
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbarOpen(false);
    };

    const openFilterDialog = () => {
        setTempFilter(filterType); // Initialize with current filter value
        setFilterDialogOpen(true);
    };

    const applyFilter = () => {
        setFilterType(tempFilter);
        setFilterDialogOpen(false);
    };

    // Handlers for "Add Guard" modal
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [selectedAddCategory, setSelectedAddCategory] = useState('');
    const [newGuardData, setNewGuardData] = useState({
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
            type: "",
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
    });
    const [newGuardFile, setNewGuardFile] = useState(null);

    const handleAddModalClose = () => {
        setAddModalOpen(false);
        setSelectedAddCategory('');
        setNewGuardData({
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
                type: "",
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
        });
        setNewGuardFile(null);
    };

    // Handler for Background Check modal (for updating background check info)
    const handleBgCheckClick = (guard) => {
        setSelectedGuard(guard);
        setBgCheckData({
            clearanceLevel: guard.backgroundCheck?.clearanceLevel || '',
            status: guard.backgroundCheck?.status || '',
            lastUpdated: guard.backgroundCheck?.lastUpdated
                ? new Date(guard.backgroundCheck.lastUpdated).toISOString().split('T')[0]
                : '',
        });
        setBgCheckModalOpen(true);
    };
    const handleBgCheckModalClose = () => {
        setBgCheckModalOpen(false);
        setBgCheckData({
            clearanceLevel: '',
            status: '',
            lastUpdated: '',
        });
    };

    const handleBgCheckSubmit = async () => {
        try {
            await axios.put(`https://security-guard.onrender.com/admin/guards/${selectedGuard._id}/background-check`, bgCheckData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setSnackbarMessage('Background check updated successfully!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            // Optionally refresh guard list
            axios
                .get('https://security-guard.onrender.com/admin/guards', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                })
                .then((res) => setGuards(res.data));
            handleBgCheckModalClose();
        } catch (error) {
            setSnackbarMessage('Failed to update background check: ' + (error.response?.data?.message || 'An error occurred'));
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    if (loading) {
        return (
            <Container sx={{ mt: 4, textAlign: 'center' }}>
                <CircularProgress />
                <Typography variant="h6">Loading guard profiles...</Typography>
            </Container>
        );
    }

    return (
        <Container sx={{ mt: 4 }} maxWidth="xl">
            <Typography variant="h4" gutterBottom>
                Admin Dashboard - Guard Profiles
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                {/* Left side: Add Guard button */}
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setAddModalOpen(true)}
                >
                    Add Guard
                </Button>

                {/* Right side: Search controls */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button variant="contained" color="secondary" onClick={openFilterDialog}>
                        Filter
                    </Button>
                    <TextField
                        label="Search Guards"
                        variant="outlined"
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ width: 250 }}
                    />
                    <Button variant="contained" color="primary" onClick={handleSearchButton}>
                        Search
                    </Button>
                </Box>
            </Box>

            <TableContainer component={Paper}>
                <Table aria-label="guard profiles table">
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Sl. No.</strong></TableCell>
                            <TableCell><strong>Profile</strong></TableCell>
                            <TableCell><strong>Type</strong></TableCell>
                            <TableCell><strong>Name</strong></TableCell>
                            <TableCell><strong>Email</strong></TableCell>
                            <TableCell><strong>DOB</strong></TableCell>
                            <TableCell><strong>Gender</strong></TableCell>
                            <TableCell><strong>Location</strong></TableCell>
                            <TableCell><strong>Phone</strong></TableCell>
                            <TableCell><strong>Address</strong></TableCell>
                            <TableCell align="center"><strong>More Information</strong></TableCell>
                            <TableCell align="center"><strong>Options</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayedGuards.map((guard, index) => (
                            <TableRow key={guard._id}>
                                <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        {guard.personalInfo.profilePicture && (
                                            <Avatar
                                                alt={guard.personalInfo.name}
                                                src={guard.personalInfo.profilePicture}
                                                sx={{ mr: 1, cursor: 'pointer' }}
                                                onClick={() => setZoomImage(guard.personalInfo.profilePicture)}
                                            />
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell>{guard.personalInfo.type}</TableCell>
                                <TableCell>{guard.personalInfo.name}</TableCell>
                                <TableCell>{guard.personalInfo.email}</TableCell>
                                <TableCell>{guard.personalInfo.dateOfBirth ? formatDate(guard.personalInfo.dateOfBirth) : ''}</TableCell>
                                <TableCell>{guard.personalInfo.gender}</TableCell>
                                <TableCell>{guard.personalInfo.location}</TableCell>
                                <TableCell>{guard.personalInfo.phone}</TableCell>
                                <TableCell>{guard.personalInfo.address}</TableCell>
                                <TableCell align="center">
                                    <Button variant="outlined" onClick={() => handleMoreInfo(guard)}>
                                        More Information
                                    </Button>
                                </TableCell>
                                <TableCell align="center">
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                        <Button variant="outlined" onClick={() => handleBgCheckClick(guard)}>
                                            Background Check
                                        </Button>
                                        <Button variant="outlined" color="error" onClick={() => handleDeleteClick(guard)}>
                                            Delete
                                        </Button>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination: Always show at the bottom center */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination
                    count={Math.max(Math.ceil(guards.length / itemsPerPage), 1)}
                    page={currentPage}
                    onChange={(e, value) => setCurrentPage(value)}
                    color="primary"
                />
            </Box>

            {/* Filter Dialog */}
            <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)}>
                <DialogTitle>Filter Guards by Type</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1">Select Type</Typography>
                        <RadioGroup
                            value={tempFilter}
                            onChange={(e) => setTempFilter(e.target.value)}
                        >
                            <FormControlLabel value="" control={<Radio />} label="All" />
                            <FormControlLabel value="Admin" control={<Radio />} label="Admin" />
                            <FormControlLabel value="Guard" control={<Radio />} label="Guard" />
                        </RadioGroup>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFilterDialogOpen(false)} variant="contained" color="primary">
                        Cancel
                    </Button>
                    <Button onClick={applyFilter} variant="contained" color="primary">
                        Apply
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal Dialog for More Information */}
            <Dialog open={modalOpen} onClose={handleCloseModal} fullWidth maxWidth="md">
                <DialogTitle>
                    Additional Information for {selectedGuard?.personalInfo.name}
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2, gap: 2 }}>
                        <Button
                            variant={selectedSection === 'workExperience' ? 'contained' : 'outlined'}
                            onClick={() => setSelectedSection('workExperience')}
                        >
                            Work Experience
                        </Button>
                        <Button
                            variant={selectedSection === 'certifications' ? 'contained' : 'outlined'}
                            onClick={() => setSelectedSection('certifications')}
                        >
                            Certifications
                        </Button>
                        <Button
                            variant={selectedSection === 'trainingAndSkills' ? 'contained' : 'outlined'}
                            onClick={() => setSelectedSection('trainingAndSkills')}
                        >
                            Training & Skills
                        </Button>
                    </Box>
                    {renderSectionForm()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal Dialog for Zoomed Profile Image */}
            <Dialog open={Boolean(zoomImage)} onClose={() => setZoomImage(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Profile Picture</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <img
                            src={zoomImage}
                            alt="Zoomed Profile"
                            style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setZoomImage(null)} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete guard {guardToDelete?.personalInfo.name}?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog} color="primary">
                        No
                    </Button>
                    <Button onClick={handleConfirmDelete} color="error">
                        Yes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Background Check Modal */}
            <Dialog open={bgCheckModalOpen} onClose={handleBgCheckModalClose} fullWidth maxWidth="sm">
                <DialogTitle>Update Background Check for {selectedGuard?.personalInfo.name}</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Clearance Level"
                        value={bgCheckData.clearanceLevel}
                        onChange={(e) => setBgCheckData({ ...bgCheckData, clearanceLevel: e.target.value })}
                        fullWidth
                        margin="dense"
                    />
                    <TextField
                        label="Status"
                        value={bgCheckData.status}
                        onChange={(e) => setBgCheckData({ ...bgCheckData, status: e.target.value })}
                        fullWidth
                        margin="dense"
                    />
                    <TextField
                        label="Last Updated"
                        type="date"
                        value={bgCheckData.lastUpdated}
                        onChange={(e) => setBgCheckData({ ...bgCheckData, lastUpdated: e.target.value })}
                        fullWidth
                        margin="dense"
                        InputLabelProps={{ shrink: true }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleBgCheckModalClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleBgCheckSubmit} color="primary">
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal Dialog for Adding Guard */}
            <Dialog open={addModalOpen} onClose={handleAddModalClose} fullWidth maxWidth="md">
                <DialogTitle>Add New Guard</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-around', mb: 2 }}>
                        <Button
                            variant={selectedAddCategory === 'personalInfo' ? 'contained' : 'outlined'}
                            onClick={() => setSelectedAddCategory('personalInfo')}
                        >
                            Personal Info
                        </Button>
                        <Button
                            variant={selectedAddCategory === 'workExperience' ? 'contained' : 'outlined'}
                            onClick={() => setSelectedAddCategory('workExperience')}
                        >
                            Work Experience
                        </Button>
                        <Button
                            variant={selectedAddCategory === 'certifications' ? 'contained' : 'outlined'}
                            onClick={() => setSelectedAddCategory('certifications')}
                        >
                            Certifications
                        </Button>
                        <Button
                            variant={selectedAddCategory === 'trainingAndSkills' ? 'contained' : 'outlined'}
                            onClick={() => setSelectedAddCategory('trainingAndSkills')}
                        >
                            Training & Skills
                        </Button>
                        <Button
                            variant={selectedAddCategory === 'emergencyContact' ? 'contained' : 'outlined'}
                            onClick={() => setSelectedAddCategory('emergencyContact')}
                        >
                            Emergency Contact
                        </Button>
                    </Box>
                    {selectedAddCategory === 'personalInfo' && (
                        <Box>
                            <TextField label="Name" name="name" value={newGuardData.personalInfo.name} onChange={(e) => setNewGuardData({ ...newGuardData, personalInfo: { ...newGuardData.personalInfo, name: e.target.value } })} fullWidth required margin="dense" />
                            <TextField label="Email" name="email" value={newGuardData.personalInfo.email} onChange={(e) => setNewGuardData({ ...newGuardData, personalInfo: { ...newGuardData.personalInfo, email: e.target.value } })} fullWidth required margin="dense" />
                            <TextField label="Password" name="password" type="password" value={newGuardData.personalInfo.password} onChange={(e) => setNewGuardData({ ...newGuardData, personalInfo: { ...newGuardData.personalInfo, password: e.target.value } })} fullWidth required margin="dense" />
                            <TextField label="Date of Birth" name="dateOfBirth" type="date" value={newGuardData.personalInfo.dateOfBirth} onChange={(e) => setNewGuardData({ ...newGuardData, personalInfo: { ...newGuardData.personalInfo, dateOfBirth: e.target.value } })} fullWidth required margin="dense" InputLabelProps={{ shrink: true }} />
                            <TextField
                                select
                                label="Gender"
                                name="gender"
                                value={newGuardData.personalInfo.gender}
                                onChange={(e) => setNewGuardData({ ...newGuardData, personalInfo: { ...newGuardData.personalInfo, gender: e.target.value } })}
                                fullWidth required margin="dense"
                                SelectProps={{ native: true }}
                            >
                                <option value=""></option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </TextField>
                            <TextField
                                select
                                label="Type"
                                name="type"
                                value={newGuardData.personalInfo.type}
                                onChange={(e) => setNewGuardData({ ...newGuardData, personalInfo: { ...newGuardData.personalInfo, type: e.target.value } })}
                                fullWidth required margin="dense"
                                SelectProps={{ native: true }}
                            >
                                <option value=""></option>
                                <option value="Admin">Admin</option>
                                <option value="Guard">Guard</option>
                            </TextField>
                            <TextField label="Location" name="location" value={newGuardData.personalInfo.location} onChange={(e) => setNewGuardData({ ...newGuardData, personalInfo: { ...newGuardData.personalInfo, location: e.target.value } })} fullWidth required margin="dense" />
                            <TextField label="Address" name="address" value={newGuardData.personalInfo.address} onChange={(e) => setNewGuardData({ ...newGuardData, personalInfo: { ...newGuardData.personalInfo, address: e.target.value } })} fullWidth margin="dense" />
                            <TextField label="Phone" name="phone" value={newGuardData.personalInfo.phone} onChange={(e) => setNewGuardData({ ...newGuardData, personalInfo: { ...newGuardData.personalInfo, phone: e.target.value } })} fullWidth margin="dense" />
                            <Button variant="outlined" component="label" fullWidth sx={{ mt: 1 }}>
                                Upload Profile Picture
                                <input type="file" hidden accept="image/*" onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setNewGuardFile(e.target.files[0]);
                                    }
                                }} />
                            </Button>
                        </Box>
                    )}
                    {selectedAddCategory === 'workExperience' && (
                        <Box>
                            <TextField label="Role" name="role" value={newGuardData.workExperience[0]?.role || ''} onChange={(e) => {
                                const newExp = [...newGuardData.workExperience];
                                newExp[0] = { ...newExp[0], role: e.target.value };
                                setNewGuardData({ ...newGuardData, workExperience: newExp });
                            }} fullWidth margin="dense" />
                            <TextField label="Company" name="company" value={newGuardData.workExperience[0]?.company || ''} onChange={(e) => {
                                const newExp = [...newGuardData.workExperience];
                                newExp[0] = { ...newExp[0], company: e.target.value };
                                setNewGuardData({ ...newGuardData, workExperience: newExp });
                            }} fullWidth margin="dense" />
                            <TextField label="Start Date" name="startDate" type="date" value={newGuardData.workExperience[0]?.startDate || ''} onChange={(e) => {
                                const newExp = [...newGuardData.workExperience];
                                newExp[0] = { ...newExp[0], startDate: e.target.value };
                                setNewGuardData({ ...newGuardData, workExperience: newExp });
                            }} fullWidth margin="dense" InputLabelProps={{ shrink: true }} />
                            <TextField label="End Date" name="endDate" type="date" value={newGuardData.workExperience[0]?.endDate || ''} onChange={(e) => {
                                const newExp = [...newGuardData.workExperience];
                                newExp[0] = { ...newExp[0], endDate: e.target.value };
                                setNewGuardData({ ...newGuardData, workExperience: newExp });
                            }} fullWidth margin="dense" InputLabelProps={{ shrink: true }} />
                            <TextField label="Description" name="description" value={newGuardData.workExperience[0]?.description || ''} onChange={(e) => {
                                const newExp = [...newGuardData.workExperience];
                                newExp[0] = { ...newExp[0], description: e.target.value };
                                setNewGuardData({ ...newGuardData, workExperience: newExp });
                            }} fullWidth margin="dense" multiline rows={3} />
                            <TextField label="URL" name="url" value={newGuardData.workExperience[0]?.url || ''} onChange={(e) => {
                                const newExp = [...newGuardData.workExperience];
                                newExp[0] = { ...newExp[0], url: e.target.value };
                                setNewGuardData({ ...newGuardData, workExperience: newExp });
                            }} fullWidth margin="dense" />
                        </Box>
                    )}
                    {selectedAddCategory === 'certifications' && (
                        <Box>
                            <TextField label="Title" name="title" value={newGuardData.certifications[0]?.title || ''} onChange={(e) => {
                                const newCert = [...newGuardData.certifications];
                                newCert[0] = { ...newCert[0], title: e.target.value };
                                setNewGuardData({ ...newGuardData, certifications: newCert });
                            }} fullWidth margin="dense" />
                            <TextField label="Issuing Authority" name="issuingAuthority" value={newGuardData.certifications[0]?.issuingAuthority || ''} onChange={(e) => {
                                const newCert = [...newGuardData.certifications];
                                newCert[0] = { ...newCert[0], issuingAuthority: e.target.value };
                                setNewGuardData({ ...newGuardData, certifications: newCert });
                            }} fullWidth margin="dense" />
                            <TextField label="Date Issued" name="dateIssued" type="date" value={newGuardData.certifications[0]?.dateIssued ? newGuardData.certifications[0].dateIssued.split('T')[0] : ''} onChange={(e) => {
                                const newCert = [...newGuardData.certifications];
                                newCert[0] = { ...newCert[0], dateIssued: e.target.value };
                                setNewGuardData({ ...newGuardData, certifications: newCert });
                            }} fullWidth margin="dense" InputLabelProps={{ shrink: true }} />
                            <TextField label="URL" name="url" value={newGuardData.certifications[0]?.url || ''} onChange={(e) => {
                                const newCert = [...newGuardData.certifications];
                                newCert[0] = { ...newCert[0], url: e.target.value };
                                setNewGuardData({ ...newGuardData, certifications: newCert });
                            }} fullWidth margin="dense" />
                        </Box>
                    )}
                    {selectedAddCategory === 'trainingAndSkills' && (
                        <Box>
                            <TextField label="Trainings (comma separated)" name="trainings" value={newGuardData.trainingAndSkills.trainings} onChange={(e) => setNewGuardData({ ...newGuardData, trainingAndSkills: { ...newGuardData.trainingAndSkills, trainings: e.target.value } })} fullWidth margin="dense" />
                            <TextField label="Skills (comma separated)" name="skills" value={newGuardData.trainingAndSkills.skills} onChange={(e) => setNewGuardData({ ...newGuardData, trainingAndSkills: { ...newGuardData.trainingAndSkills, skills: e.target.value } })} fullWidth margin="dense" />
                        </Box>
                    )}
                    {selectedAddCategory === 'emergencyContact' && (
                        <Box>
                            <TextField label="Name" name="name" value={newGuardData.emergencyContact.name} onChange={(e) => setNewGuardData({ ...newGuardData, emergencyContact: { ...newGuardData.emergencyContact, name: e.target.value } })} fullWidth margin="dense" />
                            <TextField label="Relationship" name="relationship" value={newGuardData.emergencyContact.relationship} onChange={(e) => setNewGuardData({ ...newGuardData, emergencyContact: { ...newGuardData.emergencyContact, relationship: e.target.value } })} fullWidth margin="dense" />
                            <TextField label="Phone" name="phone" value={newGuardData.emergencyContact.phone} onChange={(e) => setNewGuardData({ ...newGuardData, emergencyContact: { ...newGuardData.emergencyContact, phone: e.target.value } })} fullWidth margin="dense" />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleAddModalClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={async () => {
                        // Prepare FormData for new guard
                        const data = new FormData();
                        if (newGuardFile) {
                            data.append('profilePicture', newGuardFile);
                        }
                        data.append('personalInfo', JSON.stringify(newGuardData.personalInfo));
                        data.append('workExperience', JSON.stringify(newGuardData.workExperience));
                        data.append('certifications', JSON.stringify(newGuardData.certifications));
                        data.append('trainingAndSkills', JSON.stringify(newGuardData.trainingAndSkills));
                        data.append('emergencyContact', JSON.stringify(newGuardData.emergencyContact));
                        try {
                            await axios.post('https://security-guard.onrender.com/admin/guards', data, {
                                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` }
                            });
                            setSnackbarMessage('Guard added successfully!');
                            setSnackbarSeverity('success');
                            setSnackbarOpen(true);
                            handleAddModalClose();
                            // Optionally, refresh the guard list
                            axios.get('https://security-guard.onrender.com/admin/guards', {
                                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                            }).then((res) => setGuards(res.data));
                        } catch (err) {
                            setSnackbarMessage('Failed to add guard: ' + (err.response?.data?.message || 'An error occurred'));
                            setSnackbarSeverity('error');
                            setSnackbarOpen(true);
                        }
                    }} color="primary">
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal Dialog for Zoomed Profile Image */}
            <Dialog open={Boolean(zoomImage)} onClose={() => setZoomImage(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Profile Picture</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <img
                            src={zoomImage}
                            alt="Zoomed Profile"
                            style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setZoomImage(null)} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete guard {guardToDelete?.personalInfo.name}?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog} color="primary">
                        No
                    </Button>
                    <Button onClick={handleConfirmDelete} color="error">
                        Yes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Background Check Modal */}
            <Dialog open={bgCheckModalOpen} onClose={handleBgCheckModalClose} fullWidth maxWidth="sm">
                <DialogTitle>Update Background Check for {selectedGuard?.personalInfo.name}</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Clearance Level"
                        value={bgCheckData.clearanceLevel}
                        onChange={(e) => setBgCheckData({ ...bgCheckData, clearanceLevel: e.target.value })}
                        fullWidth
                        margin="dense"
                    />
                    <TextField
                        label="Status"
                        value={bgCheckData.status}
                        onChange={(e) => setBgCheckData({ ...bgCheckData, status: e.target.value })}
                        fullWidth
                        margin="dense"
                    />
                    <TextField
                        label="Last Updated"
                        type="date"
                        value={bgCheckData.lastUpdated}
                        onChange={(e) => setBgCheckData({ ...bgCheckData, lastUpdated: e.target.value })}
                        fullWidth
                        margin="dense"
                        InputLabelProps={{ shrink: true }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleBgCheckModalClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleBgCheckSubmit} color="primary">
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>

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

export default AdminDashboard;
