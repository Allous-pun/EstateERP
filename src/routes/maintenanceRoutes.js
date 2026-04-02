const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin, isFacilityManager, isTechnician, isTenant } = require('../middleware/roleMiddleware');
const maintenanceController = require('../controllers/maintenanceController');

router.use(verifyToken);

// Public routes (authenticated users)
router.get('/tickets', maintenanceController.getAllTickets);
router.get('/tickets/:id', maintenanceController.getTicketById);
router.get('/unit/:unitId/tickets', maintenanceController.getUnitTickets);
router.get('/dashboard/stats', isAdmin || isFacilityManager, maintenanceController.getDashboardStats);

// Technician specific
router.get('/technician/tickets', isTechnician, maintenanceController.getTechnicianTickets);

// Create ticket (Tenant, Admin)
router.post('/tickets', isTenant || isAdmin, maintenanceController.createTicket);

// Admin/Facility Manager only
router.put('/tickets/:id/assign', isAdmin || isFacilityManager, maintenanceController.assignTicket);
router.post('/tickets/:id/materials', isAdmin || isFacilityManager || isTechnician, maintenanceController.addMaterials);

// Technician/Admin
router.put('/tickets/:id/status', isTechnician || isAdmin, maintenanceController.updateStatus);
router.post('/tickets/:id/complete', isTechnician || isAdmin, maintenanceController.completeTicket);

module.exports = router;