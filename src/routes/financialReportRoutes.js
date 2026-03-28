// src/routes/financialReportRoutes.js
const express = require('express');
const router = express.Router();
const financialReportController = require('../controllers/financialReportController');
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin, isFacilityManager, isTenant } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(verifyToken);

// Financial dashboard - Admin/Facility Manager only
router.get(
    '/dashboard',
    isAdmin,
    financialReportController.getFinancialDashboard
);

// Revenue vs debt summary - Admin/Facility Manager only
router.get(
    '/revenue-vs-debt',
    isAdmin,
    financialReportController.getRevenueVsDebt
);

// Payment history - Admin/Facility Manager only
router.get(
    '/payment-history',
    isAdmin,
    financialReportController.getPaymentHistory
);

// Tenant financial summary - Tenants can view their own, Admin can view any
router.get(
    '/tenant-summary/:tenantId',
    (req, res, next) => {
        if (req.user.role === 'tenant' && req.user.id !== parseInt(req.params.tenantId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own financial summary.'
            });
        }
        next();
    },
    financialReportController.getTenantFinancialSummary
);

// Export financial report - Admin/Facility Manager only
router.get(
    '/export',
    isAdmin,
    financialReportController.exportFinancialReport
);

module.exports = router;