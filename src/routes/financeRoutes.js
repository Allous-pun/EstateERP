// src/routes/financeRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { isFinanceOfficer } = require('../middleware/roleMiddleware');
const financialReportController = require('../controllers/financialReportController');

router.use(verifyToken);

router.get('/dashboard/stats', isFinanceOfficer, financialReportController.getDashboardStats);
router.get('/dashboard/revenue', isFinanceOfficer, financialReportController.getRevenueData);
router.get('/dashboard/payments', isFinanceOfficer, financialReportController.getRecentPayments);

module.exports = router;