const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { verifyToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(verifyToken);

// Public routes (authenticated users can view)
router.get('/', propertyController.getAllProperties);
router.get('/filter', propertyController.filterProperties);
router.get('/:id', propertyController.getPropertyById);
router.get('/:id/stats', propertyController.getPropertyStats);

// Admin/Facility Manager only routes
router.post(
    '/',
    checkRole(['super_admin', 'admin']),
    propertyController.createProperty
);

router.put(
    '/:id',
    checkRole(['super_admin', 'admin']),
    propertyController.updateProperty
);

router.delete(
    '/:id',
    checkRole(['super_admin']),
    propertyController.deleteProperty
);

module.exports = router;