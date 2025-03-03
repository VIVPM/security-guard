// src/pages/AdminIncidentDashboard.jsx
import React, { useEffect, useState } from 'react';
import {
    Container,
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    CardMedia,
    MenuItem,
    TextField,
    Snackbar,
    Alert,
    Pagination,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete'; // Import Autocomplete
import axios from 'axios';
import apiList from '../components/apiList';

const AdminIncidentDashboard = () => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [updateStatus, setUpdateStatus] = useState('');
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);

    // For search & filter
    const [searchQuery, setSearchQuery] = useState('');
    const [autocompleteOpen, setAutocompleteOpen] = useState(false);

    const [filters, setFilters] = useState({
        status: '',
        fromDate: '',
        toDate: '',
        fromTime: '',
        toTime: '',
    });
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [tempFilters, setTempFilters] = useState({ ...filters });

    const [moreInfoDialogOpen, setMoreInfoDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Pagination state: show six incidents per page
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const displayedIncidents = incidents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Generate Autocomplete suggestions from multiple fields.
    // This collects unique suggestions from location, address, description, and guard name.
    const suggestions = [
        ...new Set(
            incidents.flatMap((incident) => {
                const guardName = incident.guard?.personalInfo?.name;
                return [incident.location, incident.address, incident.description, guardName];
            }).filter(Boolean)
        )
    ];

    // Helper functions for formatting
    const formatDateToIST = (dateStr) => {
        const options = { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Date(dateStr).toLocaleDateString('en-IN', options);
    };

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

    // Fetch incidents from the admin route with query parameters
    const fetchIncidents = async () => {
        setLoading(true);
        try {
            const qs = buildQueryString();
            const response = await axios.get(`${apiList.getIncidents}${qs}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setIncidents(response.data);
            // Reset to first page on new fetch
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

    // Open status update dialog
    const handleOpenStatusDialog = (incident) => {
        setSelectedIncident(incident);
        setUpdateStatus(incident.status);
        setStatusDialogOpen(true);
    };

    // Update incident status
    const handleUpdateStatus = async () => {
        try {
            await axios.put(
                `${apiList.putIncidents}/${selectedIncident._id}`,
                { status: updateStatus },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            setSnackbar({ open: true, message: 'Status updated successfully', severity: 'success' });
            setStatusDialogOpen(false);
            fetchIncidents();
        } catch (error) {
            console.error('Error updating status:', error);
            setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
        }
    };

    // Open More Info dialog
    const handleOpenMoreInfo = (incident) => {
        setSelectedIncident(incident);
        setMoreInfoDialogOpen(true);
    };

    // New function: handleFindRoute, redirect to Google Maps directions using incident address
    const handleFindRoute = (incident) => {
        if (incident.address) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(incident.address)}`;
            window.open(url, '_blank');
        } else {
            setSnackbar({ open: true, message: 'No address provided for this incident.', severity: 'error' });
        }
    };

    const handleSnackbarClose = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            {/* Header with Filter button and Autocomplete search bar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Incident Dashboard</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button variant="contained" color="secondary" onClick={() => setFilterDialogOpen(true)}>
                        Filter
                    </Button>
                    {/* Autocomplete search bar that shows suggestions on focus and as you type */}
                    <Autocomplete
                        freeSolo
                        open={autocompleteOpen}
                        options={suggestions}
                        value={searchQuery}
                        onInputChange={(event, newInputValue) => {
                            setSearchQuery(newInputValue);
                            setAutocompleteOpen(newInputValue.trim().length > 0);
                        }}
                        onChange={(event, newValue) => {
                            if (newValue) {
                                setSearchQuery(newValue);
                            }
                            setAutocompleteOpen(false);
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Search Incidents"
                                variant="outlined"
                                size="small"
                                sx={{ width: 250 }}
                            />
                        )}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            setAutocompleteOpen(false); // Hide suggestions on search
                            fetchIncidents();
                        }}
                    >
                        Search
                    </Button>
                </Box>
            </Box>

            {loading ? (
                <Typography>Loading...</Typography>
            ) : incidents.length === 0 ? (
                <Typography>No incidents reported</Typography>
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
                                    <CardActions>
                                        <Button variant="contained" color="primary" onClick={() => handleOpenMoreInfo(incident)}>
                                            More Info
                                        </Button>
                                        {incident.status !== "Resolved" && (
                                            <Button variant="contained" color="secondary" onClick={() => handleOpenStatusDialog(incident)}>
                                                Update Status
                                            </Button>
                                        )}
                                        <Button variant="contained" color="primary" onClick={() => handleFindRoute(incident)}>
                                            Find Route
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                    {/* Pagination: Always show at the bottom center */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Pagination
                            count={Math.max(Math.ceil(incidents.length / itemsPerPage), 1)}
                            page={currentPage}
                            onChange={(e, value) => setCurrentPage(value)}
                            color="primary"
                        />
                    </Box>
                </>
            )}

            {/* More Info Dialog */}
            <Dialog open={moreInfoDialogOpen} onClose={() => setMoreInfoDialogOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>Incident Details for {selectedIncident?.location}</DialogTitle>
                <DialogContent dividers>
                    {selectedIncident && (
                        <Box>
                            <Typography>
                                <strong>Incident Date:</strong>{' '}
                                {new Date(selectedIncident.incidentDate).toLocaleDateString('en-IN', {
                                    timeZone: 'Asia/Kolkata',
                                })}
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
                    <Button onClick={() => setMoreInfoDialogOpen(false)} variant="contained" color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Status Update Dialog */}
            <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Update Incident Status</DialogTitle>
                <DialogContent>
                    {selectedIncident && (
                        <Box>
                            <Typography>
                                Update status for incident at <strong>{selectedIncident.location}</strong>
                            </Typography>
                            <FormControl fullWidth sx={{ mt: 2 }}>
                                <InputLabel id="incident-status-label">Status</InputLabel>
                                <Select
                                    labelId="incident-status-label"
                                    value={updateStatus}
                                    label="Status"
                                    onChange={(e) => setUpdateStatus(e.target.value)}
                                >
                                    {/* <MenuItem value="Reported">Reported</MenuItem> */}
                                    <MenuItem value="Investigating">Investigating</MenuItem>
                                    <MenuItem value="Resolved">Resolved</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStatusDialogOpen(false)} variant="contained" color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleUpdateStatus} variant="contained" color="secondary">
                        Update
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
                    <Button onClick={() => { setFilters({ ...tempFilters }); setFilterDialogOpen(false); }} variant="contained" color="primary">
                        Apply
                    </Button>
                </DialogActions>
            </Dialog>

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

export default AdminIncidentDashboard;
