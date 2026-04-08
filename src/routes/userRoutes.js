// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin, hasRole } = require('../middleware/roleMiddleware');

// All routes below are protected and require authentication
router.use(verifyToken);

// ============================================
// Technicians endpoint - accessible by Admin AND Facility Manager
// Using hasRole middleware which supports multiple roles
// ============================================
router.get('/technicians', hasRole(['super_admin', 'admin', 'facility_manager']), userController.getTechnicians);

// ============================================
// Admin only routes (Facility Manager cannot access these)
// ============================================
router.use(isAdmin);

// Admin user management routes
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;