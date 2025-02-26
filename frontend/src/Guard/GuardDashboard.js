// src/pages/GuardDashboard.jsx
import React, { useEffect, useState } from 'react';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Card,
    CardMedia,
    CardContent,
    CardActions,
    Snackbar,
    Alert,
    FormControl,
    FormControlLabel,
    Radio,
    RadioGroup,
    Pagination, // <-- import Pagination from MUI
    // IconButton,
} from '@mui/material';
// import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

const GuardDashboard = () => {
    const [places, setPlaces] = useState([]);
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
    const [loading, setLoading] = useState(false);
    const [moreInfoModalOpen, setMoreInfoModalOpen] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Use sessionStorage so that the dialog shows once per login session
    // At the top of your component:
    // const [locationPermissionDialogOpen, setLocationPermissionDialogOpen] = useState(() => {
    //     // Show the dialog if the flag is not set in sessionStorage
    //     return !sessionStorage.getItem('locationPermissionShown');
    // });


    // When the dialog is shown for the first time, mark it as shown in sessionStorage
    // useEffect(() => {
    //     if (locationPermissionDialogOpen) {
    //         sessionStorage.setItem('locationPermissionShown', 'true');
    //     }
    // }, [locationPermissionDialogOpen]);


    // Helper function to format date in IST (Indian format)
    const formatDateToIST = (dateStr) => {
        const options = { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Date(dateStr).toLocaleDateString('en-IN', options);
    };

    // Helper function to format time in IST
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

    // Fetch places assigned to the guard using search and filters
    const fetchPlaces = async () => {
        setLoading(true);
        try {
            const qs = buildQueryString();
            const response = await axios.get(`https://security-guard.onrender.com/apiProfile/guard${qs}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setPlaces(response.data);
            // Reset to first page whenever new data is fetched.
            setCurrentPage(1);
        } catch (error) {
            console.error('Error fetching places:', error);
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to fetch places',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    // Initially load places when component mounts
    useEffect(() => {
        fetchPlaces();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSearchClick = () => {
        fetchPlaces();
    };

    // --- Filter Dialog Handlers ---
    const openFilterDialog = () => {
        setTempFilters({ ...filters });
        setFilterDialogOpen(true);
    };

    const applyFilter = () => {
        setFilters({ ...tempFilters });
        setFilterDialogOpen(false);
        // fetchPlaces();
    };

    const clearFilter = () => {
        setTempFilters({
            status: '',
            fromDate: '',
            toDate: '',
            fromTime: '',
            toTime: '',
        });
    };

    const handleMoreInfo = (place) => {
        setSelectedPlace(place);
        setMoreInfoModalOpen(true);
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar((prev) => ({ ...prev, open: false }));
    };

    // Calculate the displayed places for the current page.
    const displayedPlaces = places.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Handle page change
    const handlePageChange = (event, value) => {
        setCurrentPage(value);
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            {/* Location Permission Dialog
            <Dialog
                open={locationPermissionDialogOpen}
                onClose={() => setLocationPermissionDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        position: 'absolute',
                        top: 5,
                        margin: 0,
                    },
                }}
            >
                <DialogTitle>
                    Location Permission Required
                    <IconButton
                        aria-label="close"
                        onClick={() => setLocationPermissionDialogOpen(false)}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            // color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body1">
                        Please allow location tracking permission every time you log in, so that your location can be accurately tracked for security purposes.
                    </Typography>
                </DialogContent>
            </Dialog> */}



            {/* Header Row: Dashboard title on left, Filter, Search field/button on right */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Guard Dashboard</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button variant="contained" color="secondary" onClick={openFilterDialog}>
                        Filter
                    </Button>
                    <TextField
                        label="Search Places"
                        variant="outlined"
                        size="small"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        sx={{ width: 250 }}
                    />
                    <Button variant="contained" color="primary" onClick={handleSearchClick}>
                        Search
                    </Button>
                </Box>
            </Box>

            {loading ? (
                <Typography>Loading...</Typography>
            ) : places.length === 0 ? (
                <Typography variant="h6" align="center">
                    No places assigned
                </Typography>
            ) : (
                <>
                    <Grid container spacing={2}>
                        {displayedPlaces.map((place) => (
                            <Grid item xs={12} sm={6} md={4} key={place._id}>
                                <Card>
                                    {place.placePhoto && (
                                        <CardMedia
                                            component="img"
                                            height="140"
                                            image={place.placePhoto}
                                            alt={place.placeName}
                                        />
                                    )}
                                    <CardContent>
                                        <Typography variant="h6">{place.placeName}</Typography>
                                        <Typography variant="body2">
                                            Date: {formatDateToIST(place.date)}
                                        </Typography>
                                        <Typography variant="body2">
                                            Time: {formatTimeToIST(place.date, place.startTime)} - {formatTimeToIST(place.date, place.endTime)}
                                        </Typography>
                                        <Typography variant="body2">
                                            Status: {place.status}
                                        </Typography>
                                    </CardContent>
                                    <CardActions>
                                        <Button variant="contained" color="primary" size="small" onClick={() => handleMoreInfo(place)}>
                                            More Info
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                    {/* Pagination: Always show pagination */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Pagination
                            count={Math.max(Math.ceil(places.length / itemsPerPage), 1)}
                            page={currentPage}
                            onChange={handlePageChange}
                            color="primary"
                        />
                    </Box>
                </>
            )}

            {/* Filter Dialog */}
            <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Filter Places</DialogTitle>
                <DialogContent dividers>
                    {/* Status Filter */}
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1">Status</Typography>
                        <FormControl component="fieldset" fullWidth>
                            <RadioGroup
                                row
                                value={tempFilters.status}
                                onChange={(e) => setTempFilters((prev) => ({ ...prev, status: e.target.value }))}
                            >
                                <FormControlLabel value="" control={<Radio />} label="All" />
                                <FormControlLabel value="Scheduled" control={<Radio />} label="Scheduled" />
                                <FormControlLabel value="Completed" control={<Radio />} label="Completed" />
                            </RadioGroup>
                        </FormControl>
                    </Box>
                    {/* Date Filters */}
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
                    {/* Time Filters */}
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
                    <Button onClick={clearFilter} variant="contained" color="secondary">
                        Clear
                    </Button>
                    <Button onClick={applyFilter} variant="contained" color="primary">
                        Apply
                    </Button>
                </DialogActions>
            </Dialog>

            {/* More Info Modal */}
            <Dialog open={moreInfoModalOpen} onClose={() => setMoreInfoModalOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>Place Details for {selectedPlace?.placeName}</DialogTitle>
                <DialogContent dividers>
                    {selectedPlace && (
                        <Box>
                            <Typography>
                                <strong>Date:</strong>{' '}
                                {new Date(selectedPlace.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                            </Typography>
                            <Typography>
                                <strong>Time:</strong>{' '}
                                {formatTimeToIST(selectedPlace.date, selectedPlace.startTime)} - {formatTimeToIST(selectedPlace.date, selectedPlace.endTime)}
                            </Typography>
                            <Typography>
                                <strong>Place Name:</strong> {selectedPlace.placeName}
                            </Typography>
                            <Typography>
                                <strong>Address:</strong> {selectedPlace.address}
                            </Typography>
                            <Typography>
                                <strong>Status:</strong> {selectedPlace.status}
                            </Typography>
                            <Typography>
                                <strong>Assigned Guard:</strong> {selectedPlace.guard?.personalInfo?.name}
                            </Typography>
                            <Typography>
                                <strong>Assigned By:</strong> {selectedPlace.admin?.personalInfo?.name}
                            </Typography>
                            {selectedPlace.placePhoto && (
                                <Box sx={{ mt: 2 }}>
                                    <img src={selectedPlace.placePhoto} alt={selectedPlace.placeName} style={{ width: '100%' }} />
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

export default GuardDashboard;
