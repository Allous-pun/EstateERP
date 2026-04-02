// src/routes/financialReportRoutes.js
const express = require('express');
const router = express.Router();
const financialReportController = require('../controllers/financialReportController');
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin, isFinanceOfficer } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(verifyToken);

// Financial reports (Admin & Finance Officer only)
router.get('/revenue-vs-debt', isFinanceOfficer, financialReportController.getRevenueVsDebt);
router.get('/payment-history', isFinanceOfficer, financialReportController.getPaymentHistory);
router.get('/dashboard', isFinanceOfficer, financialReportController.getFinancialDashboard);
router.get('/export', isFinanceOfficer, financialReportController.exportFinancialReport);

// Tenant financial summary (Tenant can view their own)
router.get('/tenant-summary/:tenantId', financialReportController.getTenantFinancialSummary);

module.exports = router;