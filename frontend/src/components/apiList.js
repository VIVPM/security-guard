// export const server = "http://localhost:5000";
export const server = "https://security-guard-jsj0.onrender.com";
const apiList = {
    login: `${server}/apiAuth/login`,
    signup: `${server}/apiAuth/register`,
    forgotPassword:`${server}/apiAuth/forgot-password`,
    resetPassword: `${server}/apiAuth/reset-password`,
    getProfile:`${server}/apiProfile/profile`,
    putProfile: `${server}/apiProfile/profile`,
    assignedPlaces: `${server}/apiProfile/guard`,
    postGuards: `${server}/admin/guards`,
    singleGuard: `${server}/admin/guard`,
    getGuards: `${server}/admin/guards`,
    getIncidents: `${server}/admin/incidents`,
    putIncidents: `${server}/admin/incidents/status`,
    deleteGuard: `${server}/admin/guard`,
    backgroundCheck: `${server}/admin/guards/background-check`,
    guardsAccepted: `${server}/admin/guards/accepted`,
    getPlaces: `${server}/apiPlaces/places`,
    postPlaces: `${server}/apiPlaces/places`,
    deletePlaces: `${server}/apiPlaces/places`,
    putPlaces: `${server}/apiPlaces/places`,
    getGuardIncidents: `${server}/apiIncidents/incidents`,
    postIncidents: `${server}/apiIncidents/incidents`,
    putGuardIncidents: `${server}/apiIncidents/incidents`,
    deleteIncidents: `${server}/apiIncidents/incidents`,
    notification: `${server}/apiNotifications`,
    readNotification: `${server}/apiNotifications/read`,
    guardReport: `${server}/apiReports/guard`,
    allGuards: `${server}/apiReports/all`,
    clockIn: `${server}/apiAttendance/clock-in`,
    clockOut: `${server}/apiAttendance/clock-out`,
    dateAttendanceGuards: `${server}/apiAttendance/guard`,
    trackGuard: `${server}/apiAttendance/admin`,
    specificAttendanceDateGuards: `${server}/apiAttendance/date`,
    sendEmailGuards: `${server}/apiAttendance/send-email`
};

export default apiList;