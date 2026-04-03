// src/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin, isFinanceOfficer, isFacilityManager, isTechnician, isSecurityGuard, isTenant } = require('../middleware/roleMiddleware');
const dashboardController = require('../controllers/dashboardController');

// All dashboard routes require authentication
router.use(verifyToken);

// Role-specific dashboard endpoints
router.get('/admin', isAdmin, dashboardController.getAdminDashboard);
router.get('/finance', isFinanceOfficer, dashboardController.getFinanceDashboard);
router.get('/facility', isFacilityManager, dashboardController.getFacilityDashboard);
router.get('/technician', isTechnician, dashboardController.getTechnicianDashboard);
router.get('/security', isSecurityGuard, dashboardController.getSecurityDashboard);
router.get('/tenant', isTenant, dashboardController.getTenantDashboard);

module.exports = router;