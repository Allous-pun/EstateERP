const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin, isFacilityManager, isTechnician } = require('../middleware/roleMiddleware');
const inventoryController = require('../controllers/inventoryController');

router.use(verifyToken);

// Public routes (authenticated users)
router.get('/', inventoryController.getAllItems);
router.get('/low-stock', isAdmin || isFacilityManager, inventoryController.getLowStock);
router.get('/:id', inventoryController.getItemById);
router.get('/:id/logs', isAdmin || isFacilityManager, inventoryController.getStockLogs);

// Admin/Facility Manager only
router.post('/', isAdmin || isFacilityManager, inventoryController.createItem);
router.put('/:id', isAdmin || isFacilityManager, inventoryController.updateItem);
router.post('/:id/restock', isAdmin || isFacilityManager, inventoryController.restock);

module.exports = router;