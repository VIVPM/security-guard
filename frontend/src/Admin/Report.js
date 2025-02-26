// src/components/Report.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Pie, Bar } from 'react-chartjs-2';
import {
    Container,
    Grid,
    Paper,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from '@mui/material';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement
} from 'chart.js';
// Import the data labels plugin
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Plugin to display "No Data Available" text if a chart has no data
const noDataPlugin = {
    id: 'noData',
    beforeDraw: (chart, args, options) => {
        const { ctx, data, width, height } = chart;
        let hasData = false;
        data.datasets.forEach(dataset => {
            if (
                dataset.data &&
                dataset.data.length > 0 &&
                dataset.data.some(val => val !== 0)
            ) {
                hasData = true;
            }
        });
        if (!hasData) {
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '16px sans-serif';
            ctx.fillStyle = options.color || 'black';
            ctx.fillText(options.text || 'No Data Available', width / 2, height / 2);
            ctx.restore();
        }
    }
};

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    noDataPlugin,
    ChartDataLabels // Register the datalabels plugin
);

// Base pie options (tooltip and datalabels configuration)
const basePieOptions = {
    plugins: {
        tooltip: {
            callbacks: {
                label: function (context) {
                    const label = context.label || '';
                    const value = context.parsed;
                    const dataArr = context.chart.data.datasets[context.datasetIndex].data;
                    const total = dataArr.reduce((acc, curr) => acc + curr, 0);
                    const percentage = total ? ((value / total) * 100).toFixed(2) + '%' : '0%';
                    return `${label}: ${percentage}`;
                }
            }
        },
        datalabels: {
            display: false, // hide on webpage
            color: '#fff',
            formatter: (value, context) => {
                const dataArr = context.chart.data.datasets[context.datasetIndex].data;
                const total = dataArr.reduce((acc, curr) => acc + curr, 0);
                const percentage = total ? ((value / total) * 100).toFixed(2) + '%' : '0%';
                return percentage;
            }
        },
        noData: { text: 'No Data Available', color: '#666' }
    }
};

const placePieOptions = {
    ...basePieOptions,
    plugins: {
        ...basePieOptions.plugins,
        noData: { text: 'Not assigned to places', color: '#666' }
    }
};

const avgHoursOptions = {
    scales: { y: { beginAtZero: true } },
    plugins: {
        noData: { text: 'Not assigned to places', color: '#666' },
        datalabels: {
            display: false,
            color: '#000',
            formatter: (value) => Number(value).toFixed(2)
        }
    }
};

const avgPlacesOptions = {
    scales: { y: { beginAtZero: true } },
    plugins: {
        noData: { text: 'Not assigned to places', color: '#666' },
        datalabels: {
            display: false,
            color: '#000',
            formatter: (value) => Number(value).toFixed(2)
        }
    }
};

const incidentPieOptions = {
    ...basePieOptions,
    plugins: {
        ...basePieOptions.plugins,
        noData: { text: 'Not reported to incidents', color: '#666' }
    }
};

const incidentCountOptions = {
    scales: { y: { beginAtZero: true } },
    plugins: {
        noData: { text: 'Not reported to incidents', color: '#666' },
        datalabels: {
            display: false,
            color: '#000',
            formatter: (value) => Number(value).toFixed(2)
        }
    }
};

const globalIncidentOptions = {
    ...basePieOptions,
    plugins: {
        ...basePieOptions.plugins,
        noData: { text: 'Not reported to incidents', color: '#666' }
    }
};

const Report = () => {
    const [guards, setGuards] = useState([]);
    const [selectedGuard, setSelectedGuard] = useState('');
    const [reportData, setReportData] = useState(null);

    // State for filter dialog (start and end date)
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    // New state for Admin Analytics dialog and its data
    const [adminAnalyticsDialogOpen, setAdminAnalyticsDialogOpen] = useState(false);
    const [adminAnalyticsData, setAdminAnalyticsData] = useState(null);

    // Refs to chart components so we can extract their canvas images later
    const placeChartRef = useRef(null);
    const avgHoursChartRef = useRef(null);
    const avgPlacesChartRef = useRef(null);
    const incidentChartRef = useRef(null);
    const incidentCountChartRef = useRef(null);
    const globalIncidentChartRef = useRef(null);

    // Helper function to set the display value of datalabels on a chart.
    const setDatalabelsDisplay = (chartRef, display) => {
        if (
            chartRef.current &&
            chartRef.current.options &&
            chartRef.current.options.plugins &&
            chartRef.current.options.plugins.datalabels
        ) {
            chartRef.current.options.plugins.datalabels.display = display;
            chartRef.current.update();
        }
    };

    // Fetch guard users on mount
    useEffect(() => {
        const fetchGuards = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/admin/guards', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Filter for guards with backgroundCheck status "Accepted"
                const guardList = response.data.filter(
                    g =>
                        g.personalInfo.type === 'Guard' &&
                        g.backgroundCheck &&
                        g.backgroundCheck.status === 'Accepted'
                );
                setGuards(guardList);
            } catch (error) {
                console.error('Error fetching guards:', error);
            }
        };
        fetchGuards();
    }, []);


    // Fetch analytics for the selected guard (applying date filters if set)
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedGuard) return;
        try {
            const token = localStorage.getItem('token');
            let queryParams = '';
            if (filterStartDate || filterEndDate) {
                const params = new URLSearchParams();
                if (filterStartDate) params.append('startDate', filterStartDate);
                if (filterEndDate) params.append('endDate', filterEndDate);
                queryParams = '?' + params.toString();
            }
            const response = await axios.get(`http://localhost:5000/apiReports/guard/${selectedGuard}${queryParams}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReportData(response.data);
        } catch (error) {
            console.error('Error fetching report data:', error);
        }
    };

    const selectedGuardName =
        guards.find(g => g._id === selectedGuard)?.personalInfo.name || 'Selected Guard';

    // Prepare chart data based on reportData
    const placeStatusData = reportData
        ? {
            labels: reportData.placeStatus.map(item => item._id),
            datasets: [
                {
                    data: reportData.placeStatus.map(item => item.count),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#8BC34A']
                }
            ]
        }
        : { labels: [], datasets: [{ data: [] }] };

    const avgHoursData = reportData
        ? {
            labels: [selectedGuardName, 'Other Guards'],
            datasets: [
                {
                    label: 'Average Hours Assigned',
                    data: [reportData.selectedGuardAvgHours, reportData.otherGuardsAvgHours],
                    backgroundColor: ['#36A2EB', '#FF6384']
                }
            ]
        }
        : { labels: [selectedGuardName, 'Other Guards'], datasets: [{ data: [0, 0] }] };

    const avgPlacesData = reportData
        ? {
            labels: [selectedGuardName, 'Other Guards'],
            datasets: [
                {
                    label: 'Average Number of Places Assigned',
                    data: [reportData.selectedGuardPlaceCount, reportData.otherGuardsAvgPlaceCount],
                    backgroundColor: ['#FFCE56', '#8BC34A']
                }
            ]
        }
        : { labels: [selectedGuardName, 'Other Guards'], datasets: [{ data: [0, 0] }] };

    const incidentStatusData = reportData
        ? {
            labels: reportData.incidentStatus.map(item => item._id),
            datasets: [
                {
                    data: reportData.incidentStatus.map(item => item.count),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
                }
            ]
        }
        : { labels: [], datasets: [{ data: [] }] };

    const incidentCountData = reportData
        ? {
            labels: [selectedGuardName, 'Other Guards'],
            datasets: [
                {
                    label: 'Number of Incidents Reported',
                    data: [reportData.selectedGuardIncidentCount, reportData.otherGuardsAvgIncidentCount],
                    backgroundColor: ['#8BC34A', '#FF6384']
                }
            ]
        }
        : { labels: [selectedGuardName, 'Other Guards'], datasets: [{ data: [0, 0] }] };

    const globalIncidentResolutionData = reportData
        ? {
            labels: ['Resolved', 'Other Incidents'],
            datasets: [
                {
                    data: [reportData.globalIncidentResolution.resolved, reportData.globalIncidentResolution.nonResolved],
                    backgroundColor: ['#36A2EB', '#FFCE56']
                }
            ]
        }
        : { labels: ['Resolved', 'Other Incidents'], datasets: [{ data: [0, 0] }] };

    // Check if all graphs are empty. (Assuming each chart has one dataset)
    const chartsEmpty =
        (placeStatusData.datasets[0].data.length === 0) &&
        (avgHoursData.datasets[0].data.length === 0) &&
        (avgPlacesData.datasets[0].data.length === 0) &&
        (incidentStatusData.datasets[0].data.length === 0) &&
        (incidentCountData.datasets[0].data.length === 0) &&
        (globalIncidentResolutionData.datasets[0].data.length === 0);

    // Helper: extract a chart's canvas image as a base64 PNG string
    const getChartImage = (chartRef) => {
        if (chartRef?.current) {
            const canvas = chartRef.current.canvas;
            return canvas.toDataURL('image/png');
        }
        return '';
    };

    // generateReport: create a hidden iframe with the report content and trigger print
    const generateReport = async () => {
        if (!selectedGuard) return;
        try {
            const token = localStorage.getItem('token');
            const profileRes = await axios.get(
                `http://localhost:5000/admin/guard/${selectedGuard}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const user = profileRes.data;

            const formatDateIST = (date) => {
                return new Date(date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
            };

            // Enable data labels on pie charts
            setDatalabelsDisplay(placeChartRef, true);
            setDatalabelsDisplay(incidentChartRef, true);
            setDatalabelsDisplay(globalIncidentChartRef, true);
            // Enable data labels on bar charts for PDF generation
            setDatalabelsDisplay(avgHoursChartRef, true);
            setDatalabelsDisplay(avgPlacesChartRef, true);
            setDatalabelsDisplay(incidentCountChartRef, true);

            // Allow time for updates to take effect
            await new Promise(resolve => setTimeout(resolve, 100));

            const chartImages = [
                getChartImage(placeChartRef),
                getChartImage(avgHoursChartRef),
                getChartImage(avgPlacesChartRef),
                getChartImage(incidentChartRef),
                getChartImage(incidentCountChartRef),
                getChartImage(globalIncidentChartRef)
            ];

            // Revert changes so that on-screen charts remain without data labels.
            setDatalabelsDisplay(placeChartRef, false);
            setDatalabelsDisplay(incidentChartRef, false);
            setDatalabelsDisplay(globalIncidentChartRef, false);
            setDatalabelsDisplay(avgHoursChartRef, false);
            setDatalabelsDisplay(avgPlacesChartRef, false);
            setDatalabelsDisplay(incidentCountChartRef, false);

            const chartHeadings = [
                "Place Status Distribution",
                "Average Hours Assigned",
                "Average Number of Places Assigned",
                "Incident Status Distribution",
                "Number of Incidents Reported",
                "Global Incident Resolution"
            ];

            const htmlContent = `
      <html>
        <head>
          <title>Guard Report</title>
          <style>
            @media print {
              .page { page-break-after: always; }
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              background: #fff;
              color: #333;
            }
            .report-container {
              width: 210mm;
              margin: 0 auto;
              padding: 10mm;
              box-sizing: border-box;
            }
            .page {
              margin-bottom: 20mm;
            }
            .page h1, .page h2 {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 5px;
            }
            .profile-info {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 20px;
            }
            .profile-info .profile-text {
              flex: 1;
            }
            .profile-info .profile-text p {
              margin: 5px 0;
              line-height: 1.4;
            }
            .profile-info img {
              width: 200px;
              height: 200px;
              object-fit: cover;
              margin-left: 20px;
              border: 1px solid #ccc;
              padding: 3px;
              background: #f9f9f9;
            }
            .additional-info {
              margin-top: 20px;
            }
            .section {
              margin-bottom: 20px;
              border-top: 1px solid #ccc;
              padding-top: 10px;
            }
            .section h3 {
              margin-bottom: 8px;
              color: #444;
              font-size: 16px;
              text-decoration: underline;
            }
            .section p {
              margin: 4px 0;
              font-size: 14px;
            }
            .charts-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              grid-gap: 20px;
            }
            .chart-container {
              text-align: center;
            }
            .chart-container h3 {
              margin-bottom: 10px;
              font-size: 16px;
              color: #333;
            }
            .chart-container img {
              width: 100%;
              height: auto;
              max-height: 66mm;
              border: 1px solid #ccc;
              padding: 5px;
              background: #fff;
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <!-- Page 1: Profile Information -->
            <div class="page profile-page">
              <h1>Profile Information</h1>
              <div class="profile-info">
                <div class="profile-text">
                  <p><strong>Name:</strong> ${user.personalInfo.name}</p>
                  <p><strong>Email:</strong> ${user.personalInfo.email}</p>
                  <p><strong>Phone:</strong> ${user.personalInfo.phone || 'N/A'}</p>
                  <p><strong>Date of Birth:</strong> ${user.personalInfo.dateOfBirth ? formatDateIST(user.personalInfo.dateOfBirth) : 'N/A'}</p>
                  <p><strong>Gender:</strong> ${user.personalInfo.gender || 'N/A'}</p>
                  <p><strong>Location:</strong> ${user.personalInfo.location || 'N/A'}</p>
                  <p><strong>Address:</strong> ${user.personalInfo.address || 'N/A'}</p>
                </div>
                ${user.personalInfo.profilePicture ? `<img src="${user.personalInfo.profilePicture}" alt="Profile Photo" />` : ''}
              </div>
              <div class="additional-info">
                <div class="section">
                  <h3>Work Experience</h3>
                  ${user.workExperience && user.workExperience.length > 0
                    ? user.workExperience
                        .map(exp => `
                            <p><strong>Role:</strong> ${exp.role}</p>
                            <p><strong>Company:</strong> ${exp.company}</p>
                            <p><strong>Duration:</strong> ${exp.startDate ? formatDateIST(exp.startDate) : 'N/A'} - ${exp.endDate ? formatDateIST(exp.endDate) : 'Present'}</p>
                            <p><strong>Description:</strong> ${exp.description || 'N/A'}</p>
                            <br/>
                          `).join('')
                    : '<p>N/A</p>'
                }
                </div>
                <div class="section">
                  <h3>Certifications</h3>
                  ${user.certifications && user.certifications.length > 0
                    ? user.certifications
                        .map(cert => `
                            <p><strong>Title:</strong> ${cert.title}</p>
                            <p><strong>Issuing Authority:</strong> ${cert.issuingAuthority}</p>
                            <p><strong>Date Issued:</strong> ${cert.dateIssued ? formatDateIST(cert.dateIssued) : 'N/A'}</p>
                            <br/>
                          `).join('')
                    : '<p>N/A</p>'
                }
                </div>
                <div class="section">
                  <h3>Trainings & Skills</h3>
                  <p><strong>Trainings:</strong> ${user.trainingAndSkills && user.trainingAndSkills.trainings ? user.trainingAndSkills.trainings.join(', ') : 'N/A'}</p>
                  <p><strong>Skills:</strong> ${user.trainingAndSkills && user.trainingAndSkills.skills ? user.trainingAndSkills.skills.join(', ') : 'N/A'}</p>
                    <br/>
                  </div>
                <div class="section">
                  <h3>Emergency Contact</h3>
                  ${user.emergencyContact
                    ? `
                        <p><strong>Name:</strong> ${user.emergencyContact.name || 'N/A'}</p>
                        <p><strong>Relationship:</strong> ${user.emergencyContact.relationship || 'N/A'}</p>
                        <p><strong>Phone:</strong> ${user.emergencyContact.phone || 'N/A'}</p>
                        <br/>
                      `
                    : '<p>N/A</p>'
                }
                </div>
                <div class="section">
                  <h3>Background Check</h3>
                  ${user.backgroundCheck
                    ? `
                        <p><strong>Clearance Level:</strong> ${user.backgroundCheck.clearanceLevel || 'N/A'}</p>
                        <p><strong>Status:</strong> ${user.backgroundCheck.status || 'N/A'}</p>
                        <p><strong>Last Updated:</strong> ${user.backgroundCheck.lastUpdated ? formatDateIST(user.backgroundCheck.lastUpdated) : 'N/A'}</p>
                      `
                    : '<p>N/A</p>'
                }
                </div>
                <div class="section">
                  <h3>Account Created</h3>
                  <p><strong>Date:</strong> ${user.createdAt ? formatDateIST(user.createdAt) : 'N/A'}</p>
                </div>
              </div>
            </div>
            <!-- Page 2: Analytics Charts -->
            ${!chartsEmpty ? `
            <div class="page charts-page">
              <h2>Analytics</h2>
              <div class="charts-grid">
                ${chartImages.map((img, idx) => `
                  <div class="chart-container">
                    <h3>${chartHeadings[idx]}</h3>
                    <img src="${img}" alt="${chartHeadings[idx]}" />
                  </div>
                `).join('')}
              </div>
            </div>` : ''}
          </div>
        </body>
      </html>
    `;

            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            document.body.appendChild(iframe);

            iframe.contentDocument.open();
            iframe.contentDocument.write(htmlContent);
            iframe.contentDocument.close();

            iframe.onload = () => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 100);
            };
        } catch (error) {
            console.error('Error generating report:', error);
        }
    };

    // Handlers for the Filter dialog
    const openFilterDialog = () => {
        setFilterDialogOpen(true);
    };
    const closeFilterDialog = () => {
        setFilterDialogOpen(false);
    };
    const applyFilter = () => {
        if (selectedGuard) {
            handleSubmit({ preventDefault: () => { } });
        }
        setFilterDialogOpen(false);
    };
    const clearFilter = () => {
        setFilterStartDate('');
        setFilterEndDate('');
        if (selectedGuard) {
            handleSubmit({ preventDefault: () => { } });
        }
    };

    // Handler for Admin Analytics dialog
    const openAdminAnalyticsDialog = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/apiReports/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAdminAnalyticsData(response.data);
            setAdminAnalyticsDialogOpen(true);
        } catch (error) {
            console.error('Error fetching admin analytics:', error);
        }
    };
    const closeAdminAnalyticsDialog = () => {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        setAdminAnalyticsDialogOpen(false);
    };

    // Prepare admin analytics chart data
    const adminIncidentStatusData = adminAnalyticsData
        ? {
            labels: adminAnalyticsData.incidentStatus.map(item => item._id),
            datasets: [
                {
                    data: adminAnalyticsData.incidentStatus.map(item => item.count),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
                }
            ]
        }
        : { labels: [], datasets: [{ data: [] }] };

    const adminPlaceStatusData = adminAnalyticsData
        ? {
            labels: adminAnalyticsData.placeStatus.map(item => item._id),
            datasets: [
                {
                    data: adminAnalyticsData.placeStatus.map(item => item.count),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#8BC34A']
                }
            ]
        }
        : { labels: [], datasets: [{ data: [] }] };

    return (
        <Container sx={{ mt: 4, minHeight: '140vh' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" gutterBottom>
                    Report
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="contained" color="primary" onClick={openFilterDialog}>
                        Filter
                    </Button>
                    <Button variant="contained" color="secondary" onClick={generateReport}>
                        Generate Report
                    </Button>
                </Box>
            </Box>

            <Dialog open={filterDialogOpen} onClose={closeFilterDialog}>
                <DialogTitle>Filter Report</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Start Date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={filterStartDate}
                            onChange={(e) => setFilterStartDate(e.target.value)}
                        />
                        <TextField
                            label="End Date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={filterEndDate}
                            onChange={(e) => setFilterEndDate(e.target.value)}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeFilterDialog} variant="contained" color="primary">
                        Cancel
                    </Button>
                    <Button onClick={clearFilter} variant="contained" color="secondary">
                        Clear
                    </Button>
                    <Button onClick={applyFilter} variant="contained" color="secondary">
                        Apply
                    </Button>
                </DialogActions>
            </Dialog>

            <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel id="guard-select-label">Select Guard</InputLabel>
                    <Select
                        labelId="guard-select-label"
                        id="guardSelect"
                        value={selectedGuard}
                        label="Select Guard"
                        onChange={(e) => setSelectedGuard(e.target.value)}
                    >
                        {guards.map((guard) => (
                            <MenuItem key={guard._id} value={guard._id}>
                                {guard.personalInfo.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button type="submit" variant="contained" color="primary">
                    Submit
                </Button>
                {/* New Admin Analytics button */}
                <Button variant="contained" color="secondary" onClick={openAdminAnalyticsDialog}>
                    Admin Analytics
                </Button>
            </Box>

            {selectedGuard && (
                <>
                    <Typography variant="h5" gutterBottom>
                        Places Analytics
                    </Typography>
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, minHeight: 300 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Place Status Distribution
                                </Typography>
                                <Pie ref={placeChartRef} data={placeStatusData} options={placePieOptions} />
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, minHeight: 300 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Average Hours Assigned
                                </Typography>
                                <Bar ref={avgHoursChartRef} data={avgHoursData} options={avgHoursOptions} />
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, minHeight: 300 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Average Number of Places Assigned
                                </Typography>
                                <Bar ref={avgPlacesChartRef} data={avgPlacesData} options={avgPlacesOptions} />
                            </Paper>
                        </Grid>
                    </Grid>

                    <Typography variant="h5" gutterBottom sx={{ mt: 6 }}>
                        Incidents Analytics
                    </Typography>
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, minHeight: 300 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Incident Status Distribution
                                </Typography>
                                <Pie ref={incidentChartRef} data={incidentStatusData} options={incidentPieOptions} />
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, minHeight: 300 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Number of Incidents Reported
                                </Typography>
                                <Bar ref={incidentCountChartRef} data={incidentCountData} options={incidentCountOptions} />
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, minHeight: 300 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Global Incident Resolution
                                </Typography>
                                <Pie ref={globalIncidentChartRef} data={globalIncidentResolutionData} options={globalIncidentOptions} />
                            </Paper>
                        </Grid>
                    </Grid>
                </>
            )}

            {/* Admin Analytics Dialog */}
            <Dialog open={adminAnalyticsDialogOpen} onClose={closeAdminAnalyticsDialog} maxWidth="md" fullWidth>
                <DialogTitle>Admin Analytics</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" align="center" gutterBottom>
                                Incident Status Distribution
                            </Typography>
                            <Box sx={{ width: '100%', height: 250 }}>
                                <Pie
                                    data={adminIncidentStatusData}
                                    options={{
                                        ...incidentPieOptions,
                                        responsive: true,
                                        maintainAspectRatio: false
                                    }}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" align="center" gutterBottom>
                                Place Status Distribution
                            </Typography>
                            <Box sx={{ width: '100%', height: 250 }}>
                                <Pie
                                    data={adminPlaceStatusData}
                                    options={{
                                        ...placePieOptions,
                                        responsive: true,
                                        maintainAspectRatio: false
                                    }}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions>
                    <Button onClick={closeAdminAnalyticsDialog} variant="contained" color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Report;
