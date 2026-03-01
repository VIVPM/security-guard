// src/App.js
import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import Navbar from './components/Navbar';
import ProfilePage from './components/ProfilePage';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import AdminDashboard from './Admin/AdminDashboard';
import RegisterPage from './components/RegisterPage';
import AddPlacePage from './Admin/AddPlacePage';
import GuardDashboard from './Guard/GuardDashboard';
import Contact from './components/Contact';
import ResetPasswordPage from './components/ResetPasswordPage';
import AdminIncidentDashboard from './Admin/AdminIncidentDashboard';
import IncidentDashboard from './Guard/IncidentDashboard';

import NotificationsPage from './components/NotificationsPage';
import Report from './Admin/Report';
import AttendanceDashboard from './Guard/AttendanceDashboard';
import AdminAttendance from './Admin/AdminAttendance';
import 'leaflet/dist/leaflet.css';

function App() {
  return (

    <AuthProvider>
      <Router>

        <Navbar />
        <Switch>
          <Route exact path="/" component={LandingPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/guard-profile" component={ProfilePage} />
          <Route path="/admin-dashboard" component={AdminDashboard} />
          <Route path="/add-place" component={AddPlacePage} />
          <Route path="/register" component={RegisterPage} />
          <Route path="/guard-dashboard" component={GuardDashboard} />
          <Route path="/contact" component={Contact} />
          <Route path="/reset-password/:token" component={ResetPasswordPage} />
          <Route path="/incident-dashboard" component={IncidentDashboard} />
          <Route path="/admin-incident-dashboard" component={AdminIncidentDashboard} />
          <Route path="/notification" component={NotificationsPage} />
          <Route path="/report" component={Report} />
          <Route path="/attendance-dashboard" component={AttendanceDashboard} />
          <Route path="/admin-attendance" component={AdminAttendance} />
          {/* Add other routes as needed */}
        </Switch>
      </Router>
    </AuthProvider>

  );
}

export default App;
