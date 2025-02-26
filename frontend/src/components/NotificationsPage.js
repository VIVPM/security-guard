// src/components/NotificationsPage.js
import React, { useEffect, useState } from 'react';
import {
    Container,
    Typography,
    List,
    ListItem,
    ListItemText,
    Divider,
    Pagination,
    Box,
    ListItemIcon,
} from '@mui/material';
import axios from 'axios';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Slice notifications for the current page
    const displayedNotifications = notifications.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        axios
            .get('http://localhost:5000/apiNotifications', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            })
            .then((res) => {
                setNotifications(res.data);
                if (res.data.length > 0) {
                    // Wait 5 seconds before marking notifications as read
                    setTimeout(() => {
                        axios.put(
                            'http://localhost:5000/apiNotifications/read',
                            {},
                            {
                                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                            }
                        ).catch(err => console.error('Error marking notifications as read:', err));
                    }, 5000);
                }
            })
            .catch((err) => console.error('Error fetching notifications:', err));
    }, []);

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            {/* Heading aligned to top left */}
            <Typography variant="h4" sx={{ textAlign: 'left', mb: 2 }}>
                Notifications
            </Typography>

            {notifications.length === 0 ? (
                <Typography variant="body1" color="textSecondary">
                    No notifications.
                </Typography>
            ) : (
                <>
                    <List>
                        {displayedNotifications.map((notif) => (
                            <React.Fragment key={notif._id}>
                                <ListItem alignItems="center">
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 'auto',
                                            mr: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Typography variant="body2" color="textSecondary">
                                            •
                                        </Typography>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={notif.message}
                                        secondary={new Date(notif.timestamp).toLocaleString()}
                                    />
                                </ListItem>
                                <Divider component="li" />
                            </React.Fragment>
                        ))}
                    </List>
                    {/* Pagination: 10 notifications per page */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Pagination
                            count={Math.ceil(notifications.length / itemsPerPage)}
                            page={currentPage}
                            onChange={(e, value) => setCurrentPage(value)}
                            color="primary"
                        />
                    </Box>
                </>
            )}
        </Container>
    );
};

export default NotificationsPage;
