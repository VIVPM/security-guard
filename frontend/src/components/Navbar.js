// import React, { useContext, useState, useRef, useEffect } from 'react';
// import {
//     AppBar,
//     Toolbar,
//     Typography,
//     Button,
//     Snackbar,
//     Alert,
//     Badge,
//     IconButton,
//     Drawer,
//     List,
//     ListItemButton,
//     ListItemText,
//     Box,
//     useMediaQuery
// } from '@mui/material';
// import MenuIcon from '@mui/icons-material/Menu';
// import { Link, useHistory } from 'react-router-dom';
// import axios from 'axios';
// import { AuthContext } from '../components/AuthContext';
// import apiList from './apiList';

// const AUTO_LOGOUT_TIME = 3600000; // 1 hour in milliseconds

// const Navbar = () => {
//     const history = useHistory();
//     const { auth, logout } = useContext(AuthContext);
//     const userType = auth.user?.type;

//     // Snackbar state for showing logout message
//     const [snackbarOpen, setSnackbarOpen] = useState(false);
//     const [snackbarMessage, setSnackbarMessage] = useState('');
//     const [snackbarSeverity, setSnackbarSeverity] = useState('success');

//     // State for unread notifications count
//     const [notificationCount, setNotificationCount] = useState(0);

//     // Ref to hold timer ID
//     const logoutTimerRef = useRef(null);

//     // Mobile Drawer state
//     const [mobileOpen, setMobileOpen] = useState(false);

//     // Use max-width instead of max-device-width to detect mobile viewports (solves landscape issue)
//     const isMobile = useMediaQuery('(max-width:600px)');

//     // Function to clear and restart the auto logout timer
//     const resetLogoutTimer = () => {
//         if (logoutTimerRef.current) {
//             clearTimeout(logoutTimerRef.current);
//         }
//         logoutTimerRef.current = setTimeout(() => {
//             handleLogout('Your session has expired due to inactivity.');
//         }, AUTO_LOGOUT_TIME);
//     };

//     // Attach event listeners to reset the timer on user activity
//     useEffect(() => {
//         if (auth.token) {
//             resetLogoutTimer();
//             const events = ['mousemove', 'keydown', 'scroll', 'click'];
//             events.forEach((event) => window.addEventListener(event, resetLogoutTimer));
//             return () => {
//                 events.forEach((event) => window.removeEventListener(event, resetLogoutTimer));
//                 if (logoutTimerRef.current) {
//                     clearTimeout(logoutTimerRef.current);
//                 }
//             };
//         }
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [auth.token]);

//     // Fetch unread notifications count (every 30 seconds)
//     useEffect(() => {
//         if (auth.token) {
//             const fetchUnreadCount = () => {
//                 axios
//                     .get(apiList.notification, {
//                         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
//                     })
//                     .then((res) => {
//                         const count = res.data.filter((notif) => !notif.read).length;
//                         setNotificationCount(count);
//                     })
//                     .catch((err) => console.error('Error fetching notifications count:', err));
//             };
//             fetchUnreadCount();
//             const intervalId = setInterval(fetchUnreadCount, 30000); // Update every 30 seconds
//             return () => clearInterval(intervalId);
//         }
//     }, [auth.token]);

//     const handleLogout = (message) => {
//         sessionStorage.removeItem('locationPermissionShown');
//         logout();
//         setSnackbarMessage(message || 'User logged out successfully!');
//         setSnackbarSeverity('success');
//         setSnackbarOpen(true);
//         setTimeout(() => {
//             history.push('/login');
//         }, 1500);
//     };

//     const handleSnackbarClose = (event, reason) => {
//         if (reason === 'clickaway') return;
//         setSnackbarOpen(false);
//     };

//     // Toggle mobile drawer
//     const handleDrawerToggle = () => {
//         setMobileOpen((prev) => !prev);
//     };

//     // Define the navigation items for each user type.
//     const navItemsGuard = [
//         { label: 'Attendance', path: '/attendance-dashboard' },
//         { label: 'Notifications', path: '/notification', badge: notificationCount },
//         { label: 'Report Incidents', path: '/incident-dashboard' },
//         { label: 'Dashboard', path: '/guard-dashboard' },
//         { label: 'Profile', path: '/guard-profile' },
//     ];

//     const navItemsAdmin = [
//         { label: 'Attendance', path: '/admin-attendance' },
//         { label: 'Report', path: '/report' },
//         { label: 'Notifications', path: '/notification', badge: notificationCount },
//         { label: 'Incident Dashboard', path: '/admin-incident-dashboard' },
//         { label: 'Add Place', path: '/add-place' },
//         { label: 'Admin Dashboard', path: '/admin-dashboard' },
//         { label: 'Profile', path: '/guard-profile' },
//     ];

//     const navItems = userType === 'Guard' ? navItemsGuard : navItemsAdmin;

//     const drawer = (
//         <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
//             <Typography variant="h6" sx={{ my: 2 }}>
//                 Security Guard Management System
//             </Typography>
//             <List>
//                 {navItems.map((item, index) => (
//                     <ListItemButton key={index} component={Link} to={item.path}>
//                         <ListItemText primary={item.label} />
//                         {item.badge > 0 && <Badge badgeContent={item.badge} color="error" />}
//                     </ListItemButton>
//                 ))}
//                 <ListItemButton onClick={() => handleLogout()}>
//                     <ListItemText primary="Logout" />
//                 </ListItemButton>
//             </List>
//         </Box>
//     );

//     return (
//         <>
//             <AppBar position="static">
//                 <Toolbar>
//                     <Typography
//                         variant="h6"
//                         sx={{ flexGrow: 1 }}
//                         color="inherit"
//                         component={Link}
//                         to="/"
//                         style={{ textDecoration: 'none', color: 'inherit' }}
//                     >
//                         Security Guard Management System
//                     </Typography>
//                     {auth.token ? (
//                         <>
//                             {isMobile ? (
//                                 <IconButton color="inherit" onClick={handleDrawerToggle}>
//                                     <MenuIcon />
//                                 </IconButton>
//                             ) : (
//                                 <>
//                                     {navItems.map((item, index) => (
//                                         <Button key={index} color="inherit" component={Link} to={item.path} sx={{ ml: 1 }}>
//                                             {item.badge ? (
//                                                 <Badge badgeContent={item.badge} color="error">
//                                                     {item.label}
//                                                 </Badge>
//                                             ) : (
//                                                 item.label
//                                             )}
//                                         </Button>
//                                     ))}
//                                     <Button color="inherit" onClick={() => handleLogout()}>
//                                         Logout
//                                     </Button>
//                                 </>
//                             )}
//                         </>
//                     ) : (
//                         <>
//                             <Button color="inherit" component={Link} to="/login">
//                                 Login
//                             </Button>
//                             <Button color="inherit" component={Link} to="/register">
//                                 Register
//                             </Button>
//                         </>
//                     )}
//                 </Toolbar>
//             </AppBar>

//             <nav>
//                 <Drawer
//                     variant="temporary"
//                     open={mobileOpen}
//                     onClose={handleDrawerToggle}
//                     ModalProps={{
//                         keepMounted: true, // Better open performance on mobile.
//                     }}
//                     sx={{
//                         display: { xs: 'block', sm: 'none' },
//                         '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
//                     }}
//                 >
//                     {drawer}
//                 </Drawer>
//             </nav>

//             <Snackbar
//                 open={snackbarOpen}
//                 autoHideDuration={4000}
//                 onClose={handleSnackbarClose}
//                 anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
//                 sx={{ top: '75% !important', transform: 'translateY(-50%)' }}
//             >
//                 <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
//                     {snackbarMessage}
//                 </Alert>
//             </Snackbar>
//         </>
//     );
// };

// export default Navbar;


import React, { useContext, useState, useRef, useEffect } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Snackbar,
    Alert,
    Badge,
    IconButton,
    Drawer,
    List,
    ListItemButton,
    ListItemText,
    Box,
    useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useHistory } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../components/AuthContext';
import apiList from './apiList';

const AUTO_LOGOUT_TIME = 3600000; // 1 hour in milliseconds

const Navbar = () => {
    const history = useHistory();
    const { auth, logout } = useContext(AuthContext);
    const userType = auth.user?.type;

    // Snackbar state for showing logout message
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    // State for unread notifications count
    const [notificationCount, setNotificationCount] = useState(0);

    // Ref to hold timer ID
    const logoutTimerRef = useRef(null);

    // Mobile Drawer state
    const [mobileOpen, setMobileOpen] = useState(false);

    // Updated media query to detect mobile devices in both orientations
    const isMobile = useMediaQuery('(max-width:600px) or (max-height:600px)');

    // Function to clear and restart the auto logout timer
    const resetLogoutTimer = () => {
        if (logoutTimerRef.current) {
            clearTimeout(logoutTimerRef.current);
        }
        logoutTimerRef.current = setTimeout(() => {
            handleLogout('Your session has expired due to inactivity.');
        }, AUTO_LOGOUT_TIME);
    };

    // Attach event listeners to reset the timer on user activity
    useEffect(() => {
        if (auth.token) {
            resetLogoutTimer();
            const events = ['mousemove', 'keydown', 'scroll', 'click'];
            events.forEach((event) => window.addEventListener(event, resetLogoutTimer));
            return () => {
                events.forEach((event) => window.removeEventListener(event, resetLogoutTimer));
                if (logoutTimerRef.current) {
                    clearTimeout(logoutTimerRef.current);
                }
            };
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth.token]);

    // Fetch unread notifications count (every 30 seconds)
    useEffect(() => {
        if (auth.token) {
            const fetchUnreadCount = () => {
                axios
                    .get(apiList.notification, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    })
                    .then((res) => {
                        const count = res.data.filter((notif) => !notif.read).length;
                        setNotificationCount(count);
                    })
                    .catch((err) => console.error('Error fetching notifications count:', err));
            };
            fetchUnreadCount();
            const intervalId = setInterval(fetchUnreadCount, 30000); // Update every 30 seconds
            return () => clearInterval(intervalId);
        }
    }, [auth.token]);

    const handleLogout = (message) => {
        sessionStorage.removeItem('locationPermissionShown');
        logout();
        setSnackbarMessage(message || 'User logged out successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setTimeout(() => {
            history.push('/login');
        }, 1500);
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbarOpen(false);
    };

    // Toggle mobile drawer
    const handleDrawerToggle = () => {
        setMobileOpen((prev) => !prev);
    };

    // Define the navigation items for each user type
    const navItemsGuard = [
        { label: 'Attendance', path: '/attendance-dashboard' },
        { label: 'Notifications', path: '/notification', badge: notificationCount },
        { label: 'Report Incidents', path: '/incident-dashboard' },
        { label: 'Dashboard', path: '/guard-dashboard' },
        { label: 'Profile', path: '/guard-profile' },
    ];

    const navItemsAdmin = [
        { label: 'Attendance', path: '/admin-attendance' },
        { label: 'Report', path: '/report' },
        { label: 'Notifications', path: '/notification', badge: notificationCount },
        { label: 'Incident Dashboard', path: '/admin-incident-dashboard' },
        { label: 'Add Place', path: '/add-place' },
        { label: 'Admin Dashboard', path: '/admin-dashboard' },
        { label: 'Profile', path: '/guard-profile' },
    ];

    const navItems = userType === 'Guard' ? navItemsGuard : navItemsAdmin;

    const drawer = (
        <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ my: 2 }}>
                Security Guard Management System
            </Typography>
            <List>
                {navItems.map((item, index) => (
                    <ListItemButton key={index} component={Link} to={item.path}>
                        <ListItemText primary={item.label} />
                        {item.badge > 0 && <Badge badgeContent={item.badge} color="error" />}
                    </ListItemButton>
                ))}
                <ListItemButton onClick={() => handleLogout()}>
                    <ListItemText primary="Logout" />
                </ListItemButton>
            </List>
        </Box>
    );

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography
                        variant="h6"
                        sx={{ flexGrow: 1 }}
                        color="inherit"
                        component={Link}
                        to="/"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        Security Guard Management System
                    </Typography>
                    {auth.token ? (
                        <>
                            {isMobile ? (
                                <IconButton color="inherit" onClick={handleDrawerToggle}>
                                    <MenuIcon />
                                </IconButton>
                            ) : (
                                <>
                                    {navItems.map((item, index) => (
                                        <Button key={index} color="inherit" component={Link} to={item.path} sx={{ ml: 1 }}>
                                            {item.badge ? (
                                                <Badge badgeContent={item.badge} color="error">
                                                    {item.label}
                                                </Badge>
                                            ) : (
                                                item.label
                                            )}
                                        </Button>
                                    ))}
                                    <Button color="inherit" onClick={() => handleLogout()}>
                                        Logout
                                    </Button>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            <Button color="inherit" component={Link} to="/login">
                                Login
                            </Button>
                            <Button color="inherit" component={Link} to="/register">
                                Register
                            </Button>
                        </>
                    )}
                </Toolbar>
            </AppBar>

            <nav>
                <Drawer
                    variant="temporary"
                    anchor="right"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    sx={{
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
                    }}
                >
                    {drawer}
                </Drawer>
            </nav>

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
        </>
    );
};

export default Navbar;