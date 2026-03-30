// src/routes/blacklistRoutes.js
const express = require('express');
const router = express.Router();
const BlacklistController = require('../controllers/blacklistController');
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin, isSecurityGuard } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(verifyToken);

// Admin only routes
router.post('/blacklist', isAdmin, BlacklistController.addToBlacklist);
router.delete('/blacklist/:id', isAdmin, BlacklistController.removeFromBlacklist);
router.put('/blacklist/:id', isAdmin, BlacklistController.updateBlacklist);

// Security and Admin routes
router.get('/blacklist', isSecurityGuard, BlacklistController.getBlacklist);
router.get('/blacklist/stats', isSecurityGuard, BlacklistController.getStats);
router.get('/check-visitor', isSecurityGuard, BlacklistController.checkVisitor);

module.exports = router;