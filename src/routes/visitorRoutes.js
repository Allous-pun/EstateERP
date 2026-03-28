// src/routes/visitorRoutes.js
const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin, isFacilityManager, isSecurityGuard } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(verifyToken);

// Security Guard specific routes (all guards can access)
router.post('/entry', isSecurityGuard, visitorController.logEntry);
router.put('/:id/exit', isSecurityGuard, visitorController.logExit);
router.get('/active', isSecurityGuard, visitorController.getActiveVisitors);
router.get('/today', isSecurityGuard, visitorController.getTodayVisitors);
router.get('/dashboard/stats', isSecurityGuard, visitorController.getDashboardStats);

// Admin and Facility Manager can also view history
router.get('/history', isAdmin, visitorController.getVisitorHistory);
router.get('/property/:propertyId', isAdmin, visitorController.getVisitorsByProperty);
router.get('/:id', isAdmin, visitorController.getVisitorById);

module.exports = router;