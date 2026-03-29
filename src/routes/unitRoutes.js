const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unitController');
const { verifyToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');
const { validateUnit, handleValidationErrors } = require('../middleware/validationMiddleware');

// All routes require authentication
router.use(verifyToken);

// Public routes (authenticated users can view)
router.get('/', unitController.getAllUnits);
router.get('/:id', unitController.getUnitById);
router.get('/property/:propertyId', unitController.getUnitsByProperty);

// Admin/Facility Manager only routes
router.post(
    '/',
    checkRole(['super_admin', 'admin', 'facility_manager']),
    validateUnit,
    handleValidationErrors,
    unitController.createUnit
);

router.put(
    '/:id',
    checkRole(['super_admin', 'admin', 'facility_manager']),
    validateUnit,
    handleValidationErrors,
    unitController.updateUnit
);

router.delete(
    '/:id', 
    checkRole(['super_admin', 'admin']),
    unitController.deleteUnit
);

module.exports = router;