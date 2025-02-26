// src/pages/LandingPage.js
import React, { useContext } from 'react';
import { Container, Typography, Button, Grid, Paper, Box } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import { useHistory } from 'react-router-dom';
import { AuthContext } from '../components/AuthContext'; // Adjust path if needed

const LandingPage = () => {
    const history = useHistory();
    const { auth } = useContext(AuthContext); // Retrieve auth info

    return (
        // Outer Box that uses flex column and occupies full viewport height
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Main content container that grows to fill available space */}
            <Container maxWidth="lg" sx={{ flexGrow: 1, pt: 8, pb: 4 }}>
                {/* Hero Section */}
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <SecurityIcon sx={{ fontSize: 80, color: 'primary.main' }} />
                    <Typography variant="h3" component="h1" gutterBottom>
                        Welcome to Your Security Command Center
                    </Typography>
                    <Typography variant="h6" component="p" gutterBottom>
                        Streamline guard scheduling, real-time monitoring, and comprehensive reporting—all in one secure platform.
                    </Typography>
                    {/* Only show Get Started button if user is not logged in */}
                    {!auth.token && (
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            sx={{ mt: 4 }}
                            onClick={() => history.push('/login')}
                        >
                            Get Started
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        sx={{ mt: 4, ml: 2 }}
                        onClick={() => history.push('/contact')}
                    >
                        Contact Us
                    </Button>
                </Box>

                {/* Feature Highlights */}
                <Box sx={{ mb: 8 }}>
                    <Grid container spacing={4}>
                        {/* Feature 1 */}
                        <Grid item xs={12} sm={6} md={4}>
                            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                                <Typography variant="h5" component="h2" gutterBottom>
                                    Efficient Scheduling
                                </Typography>
                                <Typography variant="body1">
                                    Organize guard shifts and assignments seamlessly with an intuitive calendar system.
                                </Typography>
                            </Paper>
                        </Grid>
                        {/* Feature 2 */}
                        <Grid item xs={12} sm={6} md={4}>
                            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                                <Typography variant="h5" component="h2" gutterBottom>
                                    Real-Time Monitoring
                                </Typography>
                                <Typography variant="body1">
                                    Get live updates and alerts to ensure your team is always in the know.
                                </Typography>
                            </Paper>
                        </Grid>
                        {/* Feature 3 */}
                        <Grid item xs={12} sm={6} md={4}>
                            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                                <Typography variant="h5" component="h2" gutterBottom>
                                    Comprehensive Reporting
                                </Typography>
                                <Typography variant="body1">
                                    Generate detailed reports and analytics to enhance security operations.
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </Container>

            {/* Footer that spans the full width and remains at the bottom */}
            <Box
                component="footer"
                sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    py: 3,
                    textAlign: 'center',
                    width: '100%',
                }}
            >
                <Typography variant="body1">
                    © {new Date().getFullYear()} Security Guard Management System. All rights reserved.
                </Typography>
            </Box>
        </Box>
    );
};

export default LandingPage;


// // src/pages/LandingPage.js
// import React, { useContext, useEffect, useState } from 'react';
// import { Container, Typography, Button, Grid, Paper, Box, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
// import CloseIcon from '@mui/icons-material/Close';
// import SecurityIcon from '@mui/icons-material/Security';
// import { useHistory } from 'react-router-dom';
// import { AuthContext } from '../components/AuthContext';

// const LandingPage = () => {
//     const history = useHistory();
//     const { auth } = useContext(AuthContext);

//     // State for showing the location permission dialog
//     const [locationPermissionDialogOpen, setLocationPermissionDialogOpen] = useState(false);

//     // When the component mounts or when auth.user changes,
//     // check if the user is a guard and if the dialog was not already shown.
//     useEffect(() => {
//         if (auth.user && auth.user.type === 'Guard' && !sessionStorage.getItem('locationPermissionShownLanding')) {
//             setLocationPermissionDialogOpen(true);
//             sessionStorage.setItem('locationPermissionShownLanding', 'true');
//         }
//     }, [auth.user]);

//     return (
//         <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
//             {/* Location Permission Dialog for Guard Users */}
//             <Dialog
//                 open={locationPermissionDialogOpen}
//                 onClose={() => setLocationPermissionDialogOpen(false)}
//                 maxWidth="sm"
//                 fullWidth
//                 PaperProps={{
//                     sx: {
//                         position: 'absolute',
//                         top: '50px', // Adjust this value to move it down further if needed
//                         margin: 0,
//                     },
//                 }}
//             >
//                 <DialogTitle>
//                     Location Permission Required
//                     <IconButton
//                         aria-label="close"
//                         onClick={() => setLocationPermissionDialogOpen(false)}
//                         sx={{
//                             position: 'absolute',
//                             right: 8,
//                             top: 8,
//                         }}
//                     >
//                         <CloseIcon />
//                     </IconButton>
//                 </DialogTitle>
//                 <DialogContent dividers>
//                     <Typography variant="body1">
//                         Please allow location tracking permission for accurate security monitoring.
//                     </Typography>
//                 </DialogContent>
//             </Dialog>

//             {/* Main Content */}
//             <Container maxWidth="lg" sx={{ flexGrow: 1, pt: 8, pb: 4 }}>
//                 <Box sx={{ textAlign: 'center', mb: 8 }}>
//                     <SecurityIcon sx={{ fontSize: 80, color: 'primary.main' }} />
//                     <Typography variant="h3" component="h1" gutterBottom>
//                         Welcome to Your Security Command Center
//                     </Typography>
//                     <Typography variant="h6" component="p" gutterBottom>
//                         Streamline guard scheduling, real-time monitoring, and comprehensive reporting—all in one secure platform.
//                     </Typography>
//                     {/* Only show Get Started button if user is not logged in */}
//                     {!auth.token && (
//                         <Button
//                             variant="contained"
//                             color="primary"
//                             size="large"
//                             sx={{ mt: 4 }}
//                             onClick={() => history.push('/login')}
//                         >
//                             Get Started
//                         </Button>
//                     )}
//                     <Button
//                         variant="contained"
//                         color="primary"
//                         size="large"
//                         sx={{ mt: 4, ml: 2 }}
//                         onClick={() => history.push('/contact')}
//                     >
//                         Contact Us
//                     </Button>
//                 </Box>

//                 {/* Feature Highlights */}
//                 <Box sx={{ mb: 8 }}>
//                     <Grid container spacing={4}>
//                         <Grid item xs={12} sm={6} md={4}>
//                             <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
//                                 <Typography variant="h5" component="h2" gutterBottom>
//                                     Efficient Scheduling
//                                 </Typography>
//                                 <Typography variant="body1">
//                                     Organize guard shifts and assignments seamlessly with an intuitive calendar system.
//                                 </Typography>
//                             </Paper>
//                         </Grid>
//                         <Grid item xs={12} sm={6} md={4}>
//                             <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
//                                 <Typography variant="h5" component="h2" gutterBottom>
//                                     Real-Time Monitoring
//                                 </Typography>
//                                 <Typography variant="body1">
//                                     Get live updates and alerts to ensure your team is always in the know.
//                                 </Typography>
//                             </Paper>
//                         </Grid>
//                         <Grid item xs={12} sm={6} md={4}>
//                             <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
//                                 <Typography variant="h5" component="h2" gutterBottom>
//                                     Comprehensive Reporting
//                                 </Typography>
//                                 <Typography variant="body1">
//                                     Generate detailed reports and analytics to enhance security operations.
//                                 </Typography>
//                             </Paper>
//                         </Grid>
//                     </Grid>
//                 </Box>
//             </Container>

//             {/* Footer */}
//             <Box
//                 component="footer"
//                 sx={{
//                     bgcolor: 'primary.main',
//                     color: 'white',
//                     py: 3,
//                     textAlign: 'center',
//                     width: '100%',
//                 }}
//             >
//                 <Typography variant="body1">
//                     © {new Date().getFullYear()} Security Guard Management System. All rights reserved.
//                 </Typography>
//             </Box>
//         </Box>
//     );
// };

// export default LandingPage;
