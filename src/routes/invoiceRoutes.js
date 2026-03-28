// src/routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');
const invoiceController = require('../controllers/invoiceController');

// All routes require authentication
router.use(verifyToken);

// Admin-only routes
router.post('/generate', checkRole(['super_admin', 'admin', 'finance_officer']), invoiceController.generateInvoices);
router.post('/apply-penalties', checkRole(['super_admin', 'admin', 'finance_officer']), invoiceController.applyPenalties);
router.get('/', checkRole(['super_admin', 'admin', 'finance_officer']), invoiceController.getAllInvoices);

// Invoice specific routes
router.get('/tenant/:tenantId', invoiceController.getTenantInvoices);
router.get('/property/:propertyId/summary', invoiceController.getPropertySummary);
router.get('/:id', invoiceController.getInvoice);
router.post('/:id/payments', invoiceController.recordPayment);

module.exports = router;