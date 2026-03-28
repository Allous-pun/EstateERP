const express = require('express');
const cors = require('cors');

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const unitRoutes = require('./routes/unitRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const tenancyRoutes = require('./routes/tenancyRoutes');
const visitorRoutes = require('./routes/visitorRoutes');

// Import financial reports routes
const financialReportRoutes = require('./routes/financialReportRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/tenancies', tenancyRoutes);
app.use('/api/visitors', visitorRoutes);

// Financial Reports Routes
app.use('/api/financial-reports', financialReportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'API is healthy' });
});

// Error handling middleware (optional but recommended)
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Cannot find ${req.originalUrl} on this server`
    });
});

module.exports = app;