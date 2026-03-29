const express = require('express');
const cors = require('cors');

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const unitRoutes = require('./routes/unitRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const tenancyRoutes = require('./routes/tenancyRoutes');
const financialReportRoutes = require('./routes/financialReportRoutes');
const visitorRoutes = require('./routes/visitorRoutes');
const blacklistRoutes = require('./routes/blacklistRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/tenancies', tenancyRoutes);
app.use('/api/financial-reports', financialReportRoutes);   
app.use('/api/visitors', visitorRoutes);
app.use('/api/blacklist', blacklistRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'API is healthy' });
});

module.exports = app;