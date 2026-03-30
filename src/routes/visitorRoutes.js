// src/routes/visitorRoutes.js
const express = require('express');
const router = express.Router();
const VisitorController = require('../controllers/visitorController');
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin, isFacilityManager, isSecurityGuard } = require('../middleware/roleMiddleware');

// ============================================
// PUBLIC ROUTES (No auth needed for QR validation)
// ============================================
router.post('/validate-qr/:qr_token', VisitorController.validateQR);
router.post('/checkout/:visitor_id', VisitorController.checkout);

// ============================================
// QR CODE & BLACKLIST ROUTES (Protected)
// ============================================
router.post('/visitors', 
    verifyToken, 
    isSecurityGuard, 
    VisitorController.createVisitor
);

router.put('/visitors/:visitor_id/regenerate-qr', 
    verifyToken, 
    isAdmin, 
    VisitorController.regenerateQR
);

router.get('/visitors/logs', 
    verifyToken, 
    isSecurityGuard, 
    VisitorController.getVisitorLogs
);

router.get('/visitors/:id', 
    verifyToken, 
    VisitorController.getVisitorById
);

// ============================================
// ENTRY/EXIT LOGGING ROUTES (Security Guard)
// ============================================
router.post('/entry', verifyToken, isSecurityGuard, VisitorController.logEntry);
router.put('/:id/exit', verifyToken, isSecurityGuard, VisitorController.logExit);
router.get('/active', verifyToken, isSecurityGuard, VisitorController.getActiveVisitors);
router.get('/today', verifyToken, isSecurityGuard, VisitorController.getTodayVisitors);
router.get('/dashboard/stats', verifyToken, isSecurityGuard, VisitorController.getDashboardStats);

// ============================================
// ADMIN ROUTES (View history and property filters)
// ============================================
router.get('/history', verifyToken, isAdmin, VisitorController.getVisitorHistory);
router.get('/property/:propertyId', verifyToken, isAdmin, VisitorController.getVisitorsByProperty);
router.get('/:id', verifyToken, isAdmin, VisitorController.getVisitorById);

module.exports = router;