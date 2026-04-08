const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin, isFacilityManager, isTechnician, isTenant, hasRole } = require('../middleware/roleMiddleware');
const maintenanceController = require('../controllers/maintenanceController');

router.use(verifyToken);

// ============================================
// Routes accessible by multiple roles
// ============================================

// Get all tickets (Admin, Facility Manager)
router.get('/tickets', hasRole(['super_admin', 'admin', 'facility_manager']), maintenanceController.getAllTickets);

// Get ticket by ID (all authenticated users)
router.get('/tickets/:id', maintenanceController.getTicketById);

// Get tickets by unit (Tenant, Admin, Facility Manager)
router.get('/unit/:unitId/tickets', hasRole(['super_admin', 'admin', 'facility_manager', 'tenant']), maintenanceController.getUnitTickets);

// Get dashboard stats (Admin, Facility Manager)
router.get('/dashboard/stats', hasRole(['super_admin', 'admin', 'facility_manager']), maintenanceController.getDashboardStats);

// Technician specific - get their assigned tickets
router.get('/technician/tickets', isTechnician, maintenanceController.getTechnicianTickets);

// Create ticket (Tenant, Admin, Facility Manager)
router.post('/tickets', hasRole(['super_admin', 'admin', 'facility_manager', 'tenant']), maintenanceController.createTicket);

// Assign ticket to technician (Admin, Facility Manager) - FIXED
router.put('/tickets/:id/assign', hasRole(['super_admin', 'admin', 'facility_manager']), maintenanceController.assignTicket);

// Add materials to ticket (Admin, Facility Manager, Technician)
router.post('/tickets/:id/materials', hasRole(['super_admin', 'admin', 'facility_manager', 'technician']), maintenanceController.addMaterials);

// Update ticket status (Technician, Admin, Facility Manager)
router.put('/tickets/:id/status', hasRole(['super_admin', 'admin', 'facility_manager', 'technician']), maintenanceController.updateStatus);

// Complete ticket (Technician, Admin, Facility Manager)
router.post('/tickets/:id/complete', hasRole(['super_admin', 'admin', 'facility_manager', 'technician']), maintenanceController.completeTicket);

module.exports = router;