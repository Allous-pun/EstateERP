const express = require('express');
const router = express.Router();
const tenancyController = require('../controllers/tenancyController');
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin, isFacilityManager, isTenant } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(verifyToken);

// Tenant specific routes
router.get('/my-tenancies', isTenant, tenancyController.getMyTenancies);

// Admin/Facility Manager routes
router.get('/expiring', isAdmin, tenancyController.getExpiringTenancies);
router.post('/check-expired', isAdmin, tenancyController.checkExpiredTenancies);

// CRUD operations
router.get('/', isAdmin, tenancyController.getAllTenancies);
router.get('/:id', isAdmin, tenancyController.getTenancyById);
router.post('/', isAdmin, tenancyController.createTenancy);
router.put('/:id', isAdmin, tenancyController.updateTenancy);
router.post('/:id/move-out', isAdmin, tenancyController.moveOut);
router.post('/:id/upload-lease', isAdmin, tenancyController.uploadLeaseAgreement);

module.exports = router;