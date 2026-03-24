const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unitController');
const { verifyToken } = require('../middleware/authMiddleware');
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
    validateUnit,
    handleValidationErrors,
    unitController.createUnit
);

router.put(
    '/:id',
    validateUnit,
    handleValidationErrors,
    unitController.updateUnit
);

router.delete('/:id', unitController.deleteUnit);

module.exports = router;