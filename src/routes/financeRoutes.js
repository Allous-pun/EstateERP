// src/routes/financeRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { isFinanceOfficer, isAdmin, hasRole } = require('../middleware/roleMiddleware');
const financialReportController = require('../controllers/financialReportController');

// All routes require authentication
router.use(verifyToken);

// Finance Dashboard endpoints - accessible by Admin and Finance Officer
router.get('/dashboard/stats', hasRole(['super_admin', 'admin', 'finance_officer']), financialReportController.getDashboardStats);
router.get('/dashboard/revenue', hasRole(['super_admin', 'admin', 'finance_officer']), financialReportController.getRevenueData);
router.get('/dashboard/payments', hasRole(['super_admin', 'admin', 'finance_officer']), financialReportController.getRecentPayments);

module.exports = router;