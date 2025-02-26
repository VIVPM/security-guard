// src/pages/IncidentDashboard.jsx
import React, { useEffect, useState } from 'react';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    Card,
    CardMedia,
    CardContent,
    CardActions,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Pagination, // <-- Import Pagination from MUI
} from '@mui/material';
import axios from 'axios';

const IncidentDashboard = () => {
    // -------------------------------
    // State Variables
    // -------------------------------
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        fromDate: '',
        toDate: '',
        fromTime: '',
        toTime: '',
    });
    const [tempFilters, setTempFilters] = useState({ ...filters });
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);

    // Modals for Create, More Info, Update, Delete
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [moreInfoModalOpen, setMoreInfoModalOpen] = useState(false);
    const [updateModalOpen, setUpdateModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Currently selected incident for modals
    const [selectedIncident, setSelectedIncident] = useState(null);

    // Form data for creating a new incident
    const [createFormData, setCreateFormData] = useState({
        incidentDate: '',
        incidentTime: '',
        location: '',
        address: '',
        description: '',
        status: 'Reported',
    });
    // For multiple file uploads: one for images and one for videos
    const [createImageFiles, setCreateImageFiles] = useState([]);
    const [createVideoFiles, setCreateVideoFiles] = useState([]);

    // Form data for updating an incident (will be set when opening update modal)
    const [updateFormData, setUpdateFormData] = useState(null);
    const [updateImageFiles, setUpdateImageFiles] = useState([]);
    const [updateVideoFiles, setUpdateVideoFiles] = useState([]);

    // Snackbar state
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // -------------------------------
    // Helper Functions
    // -------------------------------
    // Build query string from searchQuery and filters
    const buildQueryString = () => {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (filters.status) params.append('status', filters.status);
        if (filters.fromDate) params.append('fromDate', filters.fromDate);
        if (filters.toDate) params.append('toDate', filters.toDate);
        if (filters.fromTime) params.append('fromTime', filters.fromTime);
        if (filters.toTime) params.append('toTime', filters.toTime);
        const qs = params.toString();
        return qs ? `?${qs}` : '';
    };

    // Format date in Indian format (dd/mm/yyyy)
    const formatDateToIST = (dateStr) => {
        const options = { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Date(dateStr).toLocaleDateString('en-IN', options);
    };

    // Format time to IST (HH:mm)
    const formatTimeToIST = (dateStr, timeStr) => {
        const dateObj = new Date(dateStr);
        const [hours, minutes] = timeStr.split(':');
        dateObj.setHours(parseInt(hours), parseInt(minutes));
        return dateObj.toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // -------------------------------
    // CRUD Operations
    // -------------------------------
    // Fetch incidents from the backend with search & filters
    const fetchIncidents = async () => {
        setLoading(true);
        try {
            const qs = buildQueryString();
            const response = await axios.get(`https://security-guard.onrender.com/apiIncidents/incidents${qs}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setIncidents(response.data);
            // Reset to first page whenever new data is fetched.
            setCurrentPage(1);
        } catch (error) {
            console.error('Error fetching incidents:', error);
            setSnackbar({ open: true, message: 'Failed to fetch incidents', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIncidents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    // Create a new incident
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        data.append('incidentDate', createFormData.incidentDate);
        data.append('incidentTime', createFormData.incidentTime);
        data.append('location', createFormData.location);
        data.append('address', createFormData.address);
        data.append('description', createFormData.description);
        data.append('status', createFormData.status);

        // Append image files (if any)
        createImageFiles.forEach((file) => data.append('images', file));
        // Append video files (if any)
        createVideoFiles.forEach((file) => data.append('videos', file));

        try {
            await axios.post('https://security-guard.onrender.com/apiIncidents/incidents', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setSnackbar({ open: true, message: 'Incident reported successfully!', severity: 'success' });
            setCreateFormData({
                incidentDate: '',
                incidentTime: '',
                location: '',
                address: '',
                description: '',
                status: 'Reported',
            });
            setCreateImageFiles([]);
            setCreateVideoFiles([]);
            fetchIncidents();
            setCreateModalOpen(false);
        } catch (error) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to report incident',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    // Update an existing incident
    const handleUpdateSubmit = async () => {
        setLoading(true);
        const data = new FormData();
        data.append('incidentDate', updateFormData.incidentDate);
        data.append('incidentTime', updateFormData.incidentTime);
        data.append('location', updateFormData.location);
        data.append('address', updateFormData.address);
        data.append('description', updateFormData.description);
        data.append('status', updateFormData.status);
        // Append new image files (if any)
        updateImageFiles.forEach((file) => data.append('images', file));
        // Append new video files (if any)
        updateVideoFiles.forEach((file) => data.append('videos', file));

        try {
            await axios.put(`https://security-guard.onrender.com/apiIncidents/incidents/${selectedIncident._id}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setSnackbar({ open: true, message: 'Incident updated successfully!', severity: 'success' });
            setUpdateModalOpen(false);
            fetchIncidents();
        } catch (error) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to update incident',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    // Delete an incident
    const handleDeleteIncident = async () => {
        setLoading(true);
        try {
            await axios.delete(`https://security-guard.onrender.com/apiIncidents/incidents/${selectedIncident._id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setSnackbar({ open: true, message: 'Incident deleted successfully!', severity: 'success' });
            fetchIncidents();
            setDeleteDialogOpen(false);
            setSelectedIncident(null);
        } catch (error) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to delete incident',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------
    // Handlers for Modal & Form Changes
    // -------------------------------
    const handleCreateChange = (e) => {
        const { name, value } = e.target;
        setCreateFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpdateChange = (e) => {
        const { name, value } = e.target;
        setUpdateFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCreateImageFileChange = (e) => {
        if (e.target.files) {
            setCreateImageFiles(Array.from(e.target.files));
        }
    };

    const handleCreateVideoFileChange = (e) => {
        if (e.target.files) {
            setCreateVideoFiles(Array.from(e.target.files));
        }
    };

    const handleUpdateImageFileChange = (e) => {
        if (e.target.files) {
            setUpdateImageFiles(Array.from(e.target.files));
        }
    };

    const handleUpdateVideoFileChange = (e) => {
        if (e.target.files) {
            setUpdateVideoFiles(Array.from(e.target.files));
        }
    };

    // When user clicks on "More Info" button
    const handleMoreInfo = (incident) => {
        setSelectedIncident(incident);
        setMoreInfoModalOpen(true);
    };

    // When user clicks on "Update Details" button
    const handleUpdate = (incident) => {
        setSelectedIncident(incident);
        setUpdateFormData({
            incidentDate: new Date(incident.incidentDate).toISOString().split('T')[0],
            incidentTime: incident.incidentTime,
            location: incident.location,
            address: incident.address,
            description: incident.description,
            status: incident.status,
        });
        setUpdateImageFiles([]);
        setUpdateVideoFiles([]);
        setUpdateModalOpen(true);
    };

    // When user clicks on "Delete Incident" button
    const handleDelete = (incident) => {
        setSelectedIncident(incident);
        setDeleteDialogOpen(true);
    };

    // Apply filters (copy tempFilters into filters and let useEffect handle fetch)
    const applyFilter = () => {
        setFilters({ ...tempFilters });
        setFilterDialogOpen(false);
    };

    // Build snackbar close handler
    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar((prev) => ({ ...prev, open: false }));
    };

    // -------------------------------
    // Pagination Logic
    // -------------------------------
    // Compute displayed incidents for current page
    const displayedIncidents = incidents.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (event, value) => {
        setCurrentPage(value);
    };

    // -------------------------------
    // Render Component
    // -------------------------------
    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            {/* Header Row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Button variant="contained" color="primary" onClick={() => setCreateModalOpen(true)}>
                    Create Incident
                </Button>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button variant="contained" color="secondary" onClick={() => setFilterDialogOpen(true)}>
                        Filter
                    </Button>
                    <TextField
                        label="Search Incidents"
                        variant="outlined"
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ width: 250 }}
                    />
                    <Button variant="contained" color="primary" onClick={fetchIncidents}>
                        Search
                    </Button>
                </Box>
            </Box>

            {/* Incident Cards */}
            {loading ? (
                <Typography>Loading...</Typography>
            ) : incidents.length === 0 ? (
                <Typography variant="h6" align="center">
                    No incidents reported
                </Typography>
            ) : (
                <>
                    <Grid container spacing={2}>
                        {displayedIncidents.map((incident) => (
                            <Grid item xs={12} sm={6} md={4} key={incident._id}>
                                <Card>
                                    {incident.images && incident.images.length > 0 && (
                                        <CardMedia
                                            component="img"
                                            height="140"
                                            image={incident.images[0]}
                                            alt="Incident Image"
                                        />
                                    )}
                                    <CardContent>
                                        <Typography variant="h6">Location: {incident.location}</Typography>
                                        <Typography variant="body2">
                                            Date: {formatDateToIST(incident.incidentDate)}
                                        </Typography>
                                        <Typography variant="body2">
                                            Time: {formatTimeToIST(incident.incidentDate, incident.incidentTime)}
                                        </Typography>
                                        <Typography variant="body2">Status: {incident.status}</Typography>
                                        <Typography variant="body2">
                                            Guard: {incident.guard?.personalInfo?.name || 'N/A'}
                                        </Typography>
                                    </CardContent>
                                    <CardActions sx={{ gap: 1 }}>
                                        <Button variant="contained" color="primary" size="small" onClick={() => handleMoreInfo(incident)}>
                                            More Info
                                        </Button>
                                        {incident.status !== 'Resolved' && (
                                            <Button
                                                variant="contained"
                                                color="secondary"
                                                size="small"
                                                onClick={() => handleUpdate(incident)}
                                            >
                                                Update Details
                                            </Button>
                                        )}
                                        <Button variant="contained" color="error" size="small" onClick={() => handleDelete(incident)}>
                                            Delete Incident
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                    {/* Pagination: Always shown at the bottom center */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Pagination
                            count={Math.max(Math.ceil(incidents.length / itemsPerPage), 1)}
                            page={currentPage}
                            onChange={handlePageChange}
                            color="primary"
                        />
                    </Box>
                </>
            )}

            {/* Create Incident Dialog */}
            <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>Create New Incident</DialogTitle>
                <DialogContent dividers>
                    <Box component="form" onSubmit={handleCreateSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Incident Date"
                                    name="incidentDate"
                                    type="date"
                                    value={createFormData.incidentDate}
                                    onChange={handleCreateChange}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Incident Time"
                                    name="incidentTime"
                                    type="time"
                                    value={createFormData.incidentTime}
                                    onChange={handleCreateChange}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Location"
                                    name="location"
                                    value={createFormData.location}
                                    onChange={handleCreateChange}
                                    fullWidth
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Address"
                                    name="address"
                                    value={createFormData.address}
                                    onChange={handleCreateChange}
                                    fullWidth
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Description"
                                    name="description"
                                    value={createFormData.description}
                                    onChange={handleCreateChange}
                                    fullWidth
                                    multiline
                                    rows={3}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required>
                                    <InputLabel id="status-select-label">Status</InputLabel>
                                    <Select
                                        labelId="status-select-label"
                                        name="status"
                                        value={createFormData.status}
                                        label="Status"
                                        onChange={handleCreateChange}
                                        disabled
                                    >
                                        <MenuItem value="Reported">Reported</MenuItem>
                                        <MenuItem value="Investigating">Investigating</MenuItem>
                                        <MenuItem value="Resolved">Resolved</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Button variant="outlined" component="label" fullWidth>
                                    Upload Images
                                    <input
                                        type="file"
                                        hidden
                                        multiple
                                        accept="image/*"
                                        onChange={handleCreateImageFileChange}
                                    />
                                </Button>
                                {createImageFiles.length > 0 && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        {createImageFiles.map((file) => file.name).join(', ')}
                                    </Typography>
                                )}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Button variant="outlined" component="label" fullWidth>
                                    Upload Videos
                                    <input
                                        type="file"
                                        hidden
                                        multiple
                                        accept="video/*"
                                        onChange={handleCreateVideoFileChange}
                                    />
                                </Button>
                                {createVideoFiles.length > 0 && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        {createVideoFiles.map((file) => file.name).join(', ')}
                                    </Typography>
                                )}
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateModalOpen(false)} variant="contained" color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleCreateSubmit} variant="contained" color="primary" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Incident'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Update Incident Dialog */}
            <Dialog open={updateModalOpen} onClose={() => setUpdateModalOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>Update Incident Details</DialogTitle>
                <DialogContent dividers>
                    {updateFormData && (
                        <Box component="form">
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Incident Date"
                                        name="incidentDate"
                                        type="date"
                                        value={updateFormData.incidentDate}
                                        onChange={handleUpdateChange}
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Incident Time"
                                        name="incidentTime"
                                        type="time"
                                        value={updateFormData.incidentTime}
                                        onChange={handleUpdateChange}
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Location"
                                        name="location"
                                        value={updateFormData.location}
                                        onChange={handleUpdateChange}
                                        fullWidth
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Address"
                                        name="address"
                                        value={updateFormData.address}
                                        onChange={handleUpdateChange}
                                        fullWidth
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Description"
                                        name="description"
                                        value={updateFormData.description}
                                        onChange={handleUpdateChange}
                                        fullWidth
                                        multiline
                                        rows={3}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth required>
                                        <InputLabel id="update-status-label">Status</InputLabel>
                                        <Select
                                            labelId="update-status-label"
                                            name="status"
                                            value={updateFormData.status}
                                            label="Status"
                                            onChange={handleUpdateChange}
                                        >
                                            <MenuItem value="Reported">Reported</MenuItem>
                                            <MenuItem value="Investigating">Investigating</MenuItem>
                                            <MenuItem value="Resolved">Resolved</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Button variant="outlined" component="label" fullWidth>
                                        Upload New Images
                                        <input
                                            type="file"
                                            hidden
                                            multiple
                                            accept="image/*"
                                            onChange={handleUpdateImageFileChange}
                                        />
                                    </Button>
                                    {updateImageFiles.length > 0 && (
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            {updateImageFiles.map((file) => file.name).join(', ')}
                                        </Typography>
                                    )}
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Button variant="outlined" component="label" fullWidth>
                                        Upload New Videos
                                        <input
                                            type="file"
                                            hidden
                                            multiple
                                            accept="video/*"
                                            onChange={handleUpdateVideoFileChange}
                                        />
                                    </Button>
                                    {updateVideoFiles.length > 0 && (
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            {updateVideoFiles.map((file) => file.name).join(', ')}
                                        </Typography>
                                    )}
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUpdateModalOpen(false)} variant="contained" color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleUpdateSubmit} variant="contained" color="primary">
                        Update Incident
                    </Button>
                </DialogActions>
            </Dialog>

            {/* More Info Modal */}
            <Dialog open={moreInfoModalOpen} onClose={() => setMoreInfoModalOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>Incident Details for {selectedIncident?.location}</DialogTitle>
                <DialogContent dividers>
                    {selectedIncident && (
                        <Box>
                            <Typography>
                                <strong>Incident Date:</strong>{' '}
                                {new Date(selectedIncident.incidentDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                            </Typography>
                            <Typography>
                                <strong>Incident Time:</strong>{' '}
                                {formatTimeToIST(selectedIncident.incidentDate, selectedIncident.incidentTime)}
                            </Typography>
                            <Typography>
                                <strong>Location:</strong> {selectedIncident.location}
                            </Typography>
                            <Typography>
                                <strong>Address:</strong> {selectedIncident.address}
                            </Typography>
                            <Typography>
                                <strong>Description:</strong> {selectedIncident.description}
                            </Typography>
                            <Typography>
                                <strong>Status:</strong> {selectedIncident.status}
                            </Typography>
                            <Typography>
                                <strong>Guard:</strong> {selectedIncident.guard?.personalInfo?.name || 'N/A'}
                            </Typography>
                            {(selectedIncident.images?.length > 0 || selectedIncident.videos?.length > 0) && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle1">Attachments:</Typography>
                                    {selectedIncident.images?.length > 0 && (
                                        <Box sx={{ mt: 1 }}>
                                            <Typography variant="body2">Images:</Typography>
                                            {selectedIncident.images.map((url, index) => (
                                                <Button
                                                    key={index}
                                                    component="a"
                                                    variant="outlined"
                                                    color="info"
                                                    size="small"
                                                    href={url}
                                                    target="_blank"
                                                    sx={{ mr: 1, mt: 1 }}
                                                >
                                                    Download Image {selectedIncident.images.length > 1 ? index + 1 : ''}
                                                </Button>
                                            ))}
                                        </Box>
                                    )}
                                    {selectedIncident.videos?.length > 0 && (
                                        <Box sx={{ mt: 1 }}>
                                            <Typography variant="body2">Videos:</Typography>
                                            {selectedIncident.videos.map((url, index) => (
                                                <Button
                                                    key={index}
                                                    component="a"
                                                    variant="outlined"
                                                    color="info"
                                                    size="small"
                                                    href={url}
                                                    target="_blank"
                                                    sx={{ mr: 1, mt: 1 }}
                                                >
                                                    Download Video {selectedIncident.videos.length > 1 ? index + 1 : ''}
                                                </Button>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setMoreInfoModalOpen(false)} variant="contained" color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent dividers>
                    <Typography>
                        Are you sure you want to delete the incident at "{selectedIncident?.location}"?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} variant="contained" color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteIncident} variant="contained" color="error">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Filter Dialog */}
            <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Filter Incidents</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ mt: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel id="filter-status-label">Status</InputLabel>
                            <Select
                                labelId="filter-status-label"
                                value={tempFilters.status}
                                label="Status"
                                onChange={(e) => setTempFilters((prev) => ({ ...prev, status: e.target.value }))}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="Reported">Reported</MenuItem>
                                <MenuItem value="Investigating">Investigating</MenuItem>
                                <MenuItem value="Resolved">Resolved</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            label="From Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={tempFilters.fromDate}
                            onChange={(e) => setTempFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
                        />
                    </Box>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            label="To Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={tempFilters.toDate}
                            onChange={(e) => setTempFilters((prev) => ({ ...prev, toDate: e.target.value }))}
                        />
                    </Box>
                    <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                        <TextField
                            label="From Time"
                            type="time"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={tempFilters.fromTime}
                            onChange={(e) => setTempFilters((prev) => ({ ...prev, fromTime: e.target.value }))}
                        />
                        <TextField
                            label="To Time"
                            type="time"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={tempFilters.toTime}
                            onChange={(e) => setTempFilters((prev) => ({ ...prev, toTime: e.target.value }))}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFilterDialogOpen(false)} variant="contained" color="primary">
                        Cancel
                    </Button>
                    <Button
                        onClick={() => setTempFilters({ status: '', fromDate: '', toDate: '', fromTime: '', toTime: '' })}
                        variant="contained"
                        color="secondary"
                    >
                        Clear
                    </Button>
                    <Button onClick={applyFilter} variant="contained" color="primary">
                        Apply
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                sx={{ top: '75% !important', transform: 'translateY(-50%)' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default IncidentDashboard;
