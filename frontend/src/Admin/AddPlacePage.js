/* eslint-disable jsx-a11y/iframe-has-title */
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
    FormControlLabel,
    InputLabel,
    Radio,
    Select,
    MenuItem,
    Pagination,
    CircularProgress,
} from '@mui/material';
import axios from 'axios';
// Import react-leaflet components and Leaflet CSS
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// (Optional) Fix default icon issues in Leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const AddPlacePage = () => {
    // State for the create form
    const [formData, setFormData] = useState({
        date: '',
        startTime: '',
        endTime: '',
        guard: '',
        placeName: '',
        address: '',
        status: 'Scheduled',
    });
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [guards, setGuards] = useState([]);
    const [places, setPlaces] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [loading, setLoading] = useState(false);
    // const [placesLoading, setPlacesLoading] = useState(false);

    // Pagination state: show six places per page
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const displayedPlaces = places.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // State to control the Create Place dialog
    const [createModalOpen, setCreateModalOpen] = useState(false);

    // State for search and filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        fromDate: '',
        toDate: '',
        fromTime: '',
        toTime: '',
    });
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [tempFilters, setTempFilters] = useState({ ...filters });

    // Modals for More Info, Update, and Delete Confirmation
    const [moreInfoModalOpen, setMoreInfoModalOpen] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [updateModalOpen, setUpdateModalOpen] = useState(false);
    const [updateData, setUpdateData] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [placeToDelete, setPlaceToDelete] = useState(null);

    // New state for file upload in Update modal
    const [updateFile, setUpdateFile] = useState(null);
    const [updateFileName, setUpdateFileName] = useState('');

    // New states for tracking location
    const [trackDialogOpen, setTrackDialogOpen] = useState(false);
    const [trackLat, setTrackLat] = useState(null);
    const [trackLng, setTrackLng] = useState(null);
    const [trackAddress, setTrackAddress] = useState('');

    // New state for "No Coordinates" dialog
    const [noCoordinatesDialogOpen, setNoCoordinatesDialogOpen] = useState(false);
    const [noCoordinatesGuardName, setNoCoordinatesGuardName] = useState('');

    // --- Helper Functions ---
    // Fetch guards with accepted background check status
    const fetchGuards = () => {
        axios
            .get('http://localhost:5000/admin/guards/accepted', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            })
            .then((res) => setGuards(res.data))
            .catch((err) => console.error('Error fetching guards:', err));
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
        return params.toString() ? `?${params.toString()}` : '';
    };

    // Fetch places using search query and filters
    const fetchPlaces = async () => {
        try {
            setLoading(true);
            const queryString = buildQueryString();
            const res = await axios.get(`http://localhost:5000/apiPlaces/places${queryString}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setPlaces(res.data);
            setCurrentPage(1);
        } catch (err) {
            console.error('Error fetching places:', err);
        } finally {
            setLoading(false);
        }
    };

    // Format time to IST
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

    const formatDateIST = (date) => {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date(date));
    };

    // --- Lifecycle Hooks ---
    useEffect(() => {
        const fetchData = async () => {
            await Promise.all([fetchGuards(), fetchPlaces()]);
        };
        fetchData();
        // You can include filters if needed:
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    // --- Handlers for Create Form ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setFileName(e.target.files[0].name);
            console.log(fileName);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        data.append('date', formData.date);
        data.append('startTime', formData.startTime);
        data.append('endTime', formData.endTime);
        data.append('guard', formData.guard);
        data.append('placeName', formData.placeName);
        data.append('address', formData.address);
        data.append('status', formData.status);
        if (file) {
            data.append('placePhoto', file);
        }
        try {
            await axios.post('http://localhost:5000/apiPlaces/places', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setSnackbar({ open: true, message: 'Place created successfully!', severity: 'success' });
            // Reset form data
            setFormData({ date: '', startTime: '', endTime: '', guard: '', placeName: '', address: '', status: 'Scheduled' });
            setFile(null);
            setFileName('');
            fetchPlaces();
            setCreateModalOpen(false);
        } catch (error) {
            setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to create place', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // --- More Info, Update, and Delete Handlers ---
    const handleMoreInfo = (place) => {
        setSelectedPlace(place);
        setMoreInfoModalOpen(true);
    };

    const handleUpdate = (place) => {
        setSelectedPlace(place);
        setUpdateData({
            date: new Date(place.date).toISOString().split('T')[0],
            startTime: place.startTime,
            endTime: place.endTime,
            guard: place.guard?._id || '',
            placeName: place.placeName,
            address: place.address,
            status: place.status,
        });
        setUpdateFile(null);
        setUpdateFileName('');
        setUpdateModalOpen(true);
    };

    const handleUpdateChange = (e) => {
        const { name, value } = e.target;
        setUpdateData((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpdateFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setUpdateFile(e.target.files[0]);
            setUpdateFileName(e.target.files[0].name);
        }
    };

    const handleUpdateSubmit = async () => {
        try {
            const data = new FormData();
            data.append('date', updateData.date);
            data.append('startTime', updateData.startTime);
            data.append('endTime', updateData.endTime);
            data.append('guard', updateData.guard);
            data.append('placeName', updateData.placeName);
            data.append('address', updateData.address);
            data.append('status', updateData.status);
            if (updateFile) {
                data.append('placePhoto', updateFile);
            }
            await axios.put(`http://localhost:5000/apiPlaces/places/${selectedPlace._id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setSnackbar({ open: true, message: 'Place updated successfully!', severity: 'success' });
            setUpdateModalOpen(false);
            fetchPlaces();
        } catch (error) {
            setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to update place', severity: 'error' });
        }
    };

    const handleDelete = (place) => {
        setPlaceToDelete(place);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`http://localhost:5000/apiPlaces/places/${placeToDelete._id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setSnackbar({ open: true, message: 'Place deleted successfully!', severity: 'success' });
            fetchPlaces();
        } catch (error) {
            setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to delete place', severity: 'error' });
        } finally {
            setDeleteDialogOpen(false);
            setPlaceToDelete(null);
        }
    };

    // --- Track Person Handler using Leaflet ---
    const handleTrack = async (guardId, guardName) => {
        try {
            const response = await axios.get(`http://localhost:5000/apiAttendance/admin?guardId=${guardId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            const attendanceDocs = response.data;
            if (!attendanceDocs || attendanceDocs.length === 0) {
                setNoCoordinatesGuardName(guardName);
                setNoCoordinatesDialogOpen(true);
                return;
            }
            const attendanceDoc = attendanceDocs[0];
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            const todayRecord = attendanceDoc.records.find(record => {
                const recordDate = new Date(record.date);
                return recordDate >= todayStart && recordDate <= todayEnd;
            });
            if (
                !todayRecord ||
                !todayRecord.checkInLocation ||
                !todayRecord.checkInLocation.latitude ||
                !todayRecord.checkInLocation.longitude
            ) {
                setNoCoordinatesGuardName(guardName);
                setNoCoordinatesDialogOpen(true);
                return;
            }
            const { latitude, longitude } = todayRecord.checkInLocation;
            setTrackLat(latitude);
            setTrackLng(longitude);
            const responseGeo = await fetch(
                `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=126f39af6bd64b4db7a9119610149894`
            );
            const dataGeo = await responseGeo.json();
            if (dataGeo.features && dataGeo.features.length > 0) {
                setTrackAddress(dataGeo.features[0].properties.formatted);
            } else {
                setTrackAddress('Location not found');
            }
            setTrackDialogOpen(true);
        } catch (error) {
            console.error('Error tracking guard: ', error);
            setNoCoordinatesGuardName(guardName);
            setNoCoordinatesDialogOpen(true);
        }
    };

    // --- Filter Dialog Handlers ---
    const openFilterDialog = () => {
        setTempFilters({ ...filters });
        setFilterDialogOpen(true);
    };

    const applyFilter = () => {
        setFilters({ ...tempFilters });
        setFilterDialogOpen(false);
    };

    // --- Snackbar Handler ---
    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar((prev) => ({ ...prev, open: false }));
    };

    // Available guards filtering: only show guards not assigned on formData.date
    const availableGuards = formData.date
        ? guards.filter((guard) => {
            return !places.some((p) => {
                const placeDate = formatDateIST(p.date);
                return p.guard?._id === guard._id && placeDate === formData.date;
            });
        })
        : guards;

    if (loading) {
        return (
            <Container sx={{ mt: 4, textAlign: 'center' }}>
                <CircularProgress />
                <Typography variant="h6">Loading all places...</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            {/* Header row: Create Place button on left; Search and Filter on right */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Button variant="contained" color="primary" onClick={() => setCreateModalOpen(true)}>
                    Create Place
                </Button>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button variant="contained" color="secondary" onClick={openFilterDialog}>
                        Filter
                    </Button>
                    <TextField
                        label="Search Places"
                        variant="outlined"
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ width: 250 }}
                    />
                    <Button variant="contained" color="primary" onClick={fetchPlaces}>
                        Search
                    </Button>
                </Box>
            </Box>

            {/* Filter Dialog */}
            <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Filter Places</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1">Status</Typography>
                        <FormControl component="fieldset" fullWidth>
                            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                <FormControlLabel
                                    control={
                                        <Radio
                                            checked={tempFilters.status === ''}
                                            onChange={() => setTempFilters((prev) => ({ ...prev, status: '' }))}
                                        />
                                    }
                                    label="All"
                                />
                                <FormControlLabel
                                    control={
                                        <Radio
                                            checked={tempFilters.status === 'Scheduled'}
                                            onChange={() => setTempFilters((prev) => ({ ...prev, status: 'Scheduled' }))}
                                        />
                                    }
                                    label="Scheduled"
                                />
                                <FormControlLabel
                                    control={
                                        <Radio
                                            checked={tempFilters.status === 'In Progress'}
                                            onChange={() => setTempFilters((prev) => ({ ...prev, status: 'In Progress' }))}
                                        />
                                    }
                                    label="In Progress"
                                />
                                <FormControlLabel
                                    control={
                                        <Radio
                                            checked={tempFilters.status === 'Completed'}
                                            onChange={() => setTempFilters((prev) => ({ ...prev, status: 'Completed' }))}
                                        />
                                    }
                                    label="Completed"
                                />
                            </Box>
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
                        onClick={() =>
                            setTempFilters({ status: '', fromDate: '', toDate: '', fromTime: '', toTime: '' })
                        }
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

            {/* Create Place Dialog */}
            <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>Create New Place</DialogTitle>
                <DialogContent dividers>
                    <Box component="form" onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Date"
                                    name="date"
                                    type="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    label="Start Time"
                                    name="startTime"
                                    type="time"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    label="End Time"
                                    name="endTime"
                                    type="time"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Place Name"
                                    name="placeName"
                                    value={formData.placeName}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required>
                                    <InputLabel id="guard-select-label">Assign Guard</InputLabel>
                                    <Select
                                        labelId="guard-select-label"
                                        name="guard"
                                        value={formData.guard}
                                        label="Assign Guard"
                                        onChange={handleChange}
                                    >
                                        {availableGuards.map((guard) => (
                                            <MenuItem key={guard._id} value={guard._id}>
                                                {guard.personalInfo.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Button variant="outlined" component="label" fullWidth>
                                    Upload Place Photo
                                    <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                                </Button>
                                {file && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        {file.name}
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
                    <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Place'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Display Created Places as Cards */}
                <Grid container spacing={2}>
                    {places.length === 0 ? (
                        <Grid item xs={12}>
                            <Typography variant="h6" align="center">
                                No places assigned
                            </Typography>
                        </Grid>
                    ) : (
                        displayedPlaces.map((place) => (
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
                                        <Typography variant="h6">Place: {place.placeName}</Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Assigned Guard: {place.guard?.personalInfo?.name || 'N/A'}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Status: {place.status || 'N/A'}
                                        </Typography>
                                    </CardContent>
                                    <CardActions sx={{ gap: 0.5 }}>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            color="primary"
                                            onClick={() => handleMoreInfo(place)}
                                        >
                                            More Info
                                        </Button>
                                        {place.status !== 'Completed' && (
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="secondary"
                                                onClick={() => handleUpdate(place)}
                                            >
                                                Update Details
                                            </Button>
                                        )}
                                        <Button
                                            size="small"
                                            variant="contained"
                                            color="error"
                                            onClick={() => handleDelete(place)}
                                        >
                                            Delete Place
                                        </Button>
                                        {place.status !== 'Completed' && (
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="info"
                                                onClick={() =>
                                                    handleTrack(place.guard?._id, place.guard?.personalInfo?.name)
                                                }
                                            >
                                                Track Person
                                            </Button>
                                        )}
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))
                    )}
                </Grid>

            {/* Pagination: Always show at the bottom center */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination
                    count={Math.max(Math.ceil(places.length / itemsPerPage), 1)}
                    page={currentPage}
                    onChange={(e, value) => setCurrentPage(value)}
                    color="primary"
                />
            </Box>

            {/* Track Person Dialog using Leaflet */}
            <Dialog open={trackDialogOpen} onClose={() => setTrackDialogOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>Guard Location</DialogTitle>
                <DialogContent>
                    {trackLat && trackLng ? (
                        <Box>
                            <MapContainer center={[trackLat, trackLng]} zoom={15} style={{ height: '400px', width: '100%' }}>
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Marker position={[trackLat, trackLng]}>
                                    <Popup>{trackAddress || 'Guard Location'}</Popup>
                                </Marker>
                            </MapContainer>
                            <Typography variant="body1" sx={{ mt: 2 }}>
                                Address: {trackAddress}
                            </Typography>
                        </Box>
                    ) : (
                        <Typography>Loading location...</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTrackDialogOpen(false)} variant="contained" color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* New Dialog: No Coordinates */}
            <Dialog open={noCoordinatesDialogOpen} onClose={() => setNoCoordinatesDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Location Not Available</DialogTitle>
                <DialogContent>
                    <Typography>Guard {noCoordinatesGuardName} has not logged in yet.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNoCoordinatesDialogOpen(false)} variant="contained" color="primary">
                        Close
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
                                {formatTimeToIST(selectedPlace.date, selectedPlace.startTime)} -{' '}
                                {formatTimeToIST(selectedPlace.date, selectedPlace.endTime)}
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
                                <strong>Created By: </strong>
                                {selectedPlace.admin?.personalInfo?.name || 'N/A'}
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

            {/* Update Modal */}
            <Dialog open={updateModalOpen} onClose={() => setUpdateModalOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>Update Place Details</DialogTitle>
                <DialogContent dividers>
                    {updateData && (
                        <Box component="form" sx={{ mt: 2 }}>
                            <TextField
                                label="Date"
                                name="date"
                                type="date"
                                value={updateData.date}
                                onChange={handleUpdateChange}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                label="Start Time"
                                name="startTime"
                                type="time"
                                value={updateData.startTime}
                                onChange={handleUpdateChange}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                label="End Time"
                                name="endTime"
                                type="time"
                                value={updateData.endTime}
                                onChange={handleUpdateChange}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                label="Place Name"
                                name="placeName"
                                value={updateData.placeName}
                                onChange={handleUpdateChange}
                                fullWidth
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                label="Address"
                                name="address"
                                value={updateData.address}
                                onChange={handleUpdateChange}
                                fullWidth
                                sx={{ mb: 2 }}
                            />
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel id="update-guard-label">Assign Guard</InputLabel>
                                <Select
                                    labelId="update-guard-label"
                                    name="guard"
                                    value={updateData.guard}
                                    label="Assign Guard"
                                    onChange={handleUpdateChange}
                                >
                                    {guards.map((guard) => (
                                        <MenuItem key={guard._id} value={guard._id}>
                                            {guard.personalInfo.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                label="Status"
                                name="status"
                                value={updateData.status}
                                onChange={handleUpdateChange}
                                fullWidth
                                sx={{ mb: 2 }}
                            />
                            {/* File upload for new place photo */}
                            <Box sx={{ mb: 2 }}>
                                <Button variant="outlined" component="label" fullWidth>
                                    Upload New Place Photo
                                    <input type="file" hidden accept="image/*" onChange={handleUpdateFileChange} />
                                </Button>
                                {updateFile && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        {updateFileName}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUpdateModalOpen(false)} variant="contained" color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleUpdateSubmit} variant="contained" color="primary">
                        Update
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent dividers>
                    <Typography>
                        Are you sure you want to delete the place "{placeToDelete?.placeName}"?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} variant="contained" color="primary">
                        Cancel
                    </Button>
                    <Button onClick={confirmDelete} variant="contained" color="error">
                        Delete
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

export default AddPlacePage;
