// src/controllers/invoiceController.js
const invoiceService = require('../services/invoiceService');

// @desc    Generate monthly invoices
// @route   POST /api/invoices/generate
// @access  Private/Admin
exports.generateInvoices = async (req, res) => {
    try {
        const { targetDate } = req.body || {};
        const date = targetDate ? new Date(targetDate) : new Date();
        
        const invoices = await invoiceService.generateMonthlyInvoices(date);
        
        res.json({
            success: true,
            message: `${invoices.length} invoices generated`,
            count: invoices.length,
            data: invoices
        });
    } catch (error) {
        console.error('Generate invoices error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate invoices',
            error: error.message
        });
    }
};

// @desc    Apply penalties to overdue invoices
// @route   POST /api/invoices/apply-penalties
// @access  Private/Admin
exports.applyPenalties = async (req, res) => {
    try {
        const updatedInvoices = await invoiceService.applyPenalties();
        
        res.json({
            success: true,
            message: `Penalties applied to ${updatedInvoices.length} invoices`,
            count: updatedInvoices.length,
            data: updatedInvoices
        });
    } catch (error) {
        console.error('Apply penalties error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to apply penalties'
        });
    }
};

// @desc    Record payment
// @route   POST /api/invoices/:id/payments
// @access  Private
exports.recordPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, payment_method, reference_number, notes } = req.body;
        
        const payment = await invoiceService.recordPayment({
            invoice_id: id,
            amount,
            payment_method,
            reference_number,
            notes,
            recorded_by: req.user.id
        });
        
        res.json({
            success: true,
            message: 'Payment recorded successfully',
            data: payment
        });
    } catch (error) {
        console.error('Record payment error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to record payment'
        });
    }
};

// @desc    Get invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoice = async (req, res) => {
    try {
        const invoice = await invoiceService.getInvoiceWithDetails(req.params.id);
        
        res.json({
            success: true,
            data: invoice
        });
    } catch (error) {
        console.error('Get invoice error:', error);
        res.status(404).json({
            success: false,
            message: error.message || 'Invoice not found'
        });
    }
};

// @desc    Get tenant invoices
// @route   GET /api/invoices/tenant/:tenantId
// @access  Private
exports.getTenantInvoices = async (req, res) => {
    try {
        const invoices = await invoiceService.getTenantInvoices(req.params.tenantId);
        
        res.json({
            success: true,
            count: invoices.length,
            data: invoices
        });
    } catch (error) {
        console.error('Get tenant invoices error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get tenant invoices'
        });
    }
};

// @desc    Get property invoice summary
// @route   GET /api/invoices/property/:propertyId/summary
// @access  Private
exports.getPropertySummary = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { yearMonth } = req.query;
        
        const summary = await invoiceService.getPropertyInvoiceSummary(propertyId, yearMonth);
        
        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Get property summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get property summary'
        });
    }
};

// @desc    Get all invoices (with filters)
// @route   GET /api/invoices
// @access  Private/Admin
exports.getAllInvoices = async (req, res) => {
    try {
        const { status, property_id, tenant_id, start_date, end_date } = req.query;
        
        const invoices = await invoiceService.getAllInvoices({
            status,
            property_id,
            tenant_id,
            start_date,
            end_date
        });
        
        res.json({
            success: true,
            count: invoices.length,
            data: invoices
        });
    } catch (error) {
        console.error('Get all invoices error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get invoices'
        });
    }
};