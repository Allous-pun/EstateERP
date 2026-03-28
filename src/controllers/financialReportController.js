// src/controllers/financialReportController.js
const { Invoice, Payment, Tenancy, Unit, Property, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// @desc    Get revenue vs debt summary
// @route   GET /api/financial-reports/revenue-vs-debt
// @access  Private/Admin
exports.getRevenueVsDebt = async (req, res) => {
    try {
        const { start_date, end_date, property_id } = req.query;
        
        let whereClause = {};
        if (start_date) whereClause.invoice_date = { [Op.gte]: start_date };
        if (end_date) whereClause.invoice_date = { ...whereClause.invoice_date, [Op.lte]: end_date };
        if (property_id) whereClause.property_id = property_id;
        
        // Get all invoices with payments
        const invoices = await Invoice.findAll({
            where: whereClause,
            include: [
                {
                    model: Property,
                    as: 'property',
                    attributes: ['id', 'name']
                },
                {
                    model: Unit,
                    as: 'unit',
                    attributes: ['id', 'unit_number']
                },
                {
                    model: User,
                    as: 'tenant',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                }
            ]
        });
        
        // Calculate revenue (total paid)
        const revenue = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.amount_paid || 0), 0);
        
        // Calculate total debt (outstanding balance)
        const totalDebt = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.balance_due || 0), 0);
        
        // Calculate by status
        const byStatus = {
            paid: invoices.filter(i => i.payment_status === 'paid').reduce((sum, i) => sum + parseFloat(i.total_amount || 0), 0),
            partially_paid: invoices.filter(i => i.payment_status === 'partially_paid').reduce((sum, i) => sum + parseFloat(i.balance_due || 0), 0),
            pending: invoices.filter(i => i.payment_status === 'pending').reduce((sum, i) => sum + parseFloat(i.total_amount || 0), 0),
            overdue: invoices.filter(i => i.payment_status === 'overdue').reduce((sum, i) => sum + parseFloat(i.total_amount || 0), 0)
        };
        
        // Calculate by property
        const byProperty = {};
        invoices.forEach(invoice => {
            const propertyName = invoice.property?.name || 'Unknown';
            if (!byProperty[propertyName]) {
                byProperty[propertyName] = {
                    total_invoiced: 0,
                    total_paid: 0,
                    total_debt: 0,
                    invoice_count: 0
                };
            }
            byProperty[propertyName].total_invoiced += parseFloat(invoice.total_amount || 0);
            byProperty[propertyName].total_paid += parseFloat(invoice.amount_paid || 0);
            byProperty[propertyName].total_debt += parseFloat(invoice.balance_due || 0);
            byProperty[propertyName].invoice_count++;
        });
        
        // Calculate collection rate
        const collectionRate = revenue > 0 ? (revenue / (revenue + totalDebt)) * 100 : 0;
        
        res.json({
            success: true,
            data: {
                summary: {
                    total_revenue: revenue,
                    total_debt: totalDebt,
                    total_invoiced: revenue + totalDebt,
                    collection_rate: parseFloat(collectionRate.toFixed(2)),
                    invoice_count: invoices.length
                },
                by_status: byStatus,
                by_property: byProperty,
                period: {
                    start_date: start_date || 'All time',
                    end_date: end_date || 'Current'
                }
            }
        });
        
    } catch (error) {
        console.error('Get revenue vs debt error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get payment history
// @route   GET /api/financial-reports/payment-history
// @access  Private/Admin
exports.getPaymentHistory = async (req, res) => {
    try {
        const { start_date, end_date, tenant_id, property_id, payment_method } = req.query;
        
        let whereClause = {};
        if (start_date) whereClause.payment_date = { [Op.gte]: start_date };
        if (end_date) whereClause.payment_date = { ...whereClause.payment_date, [Op.lte]: end_date };
        if (payment_method) whereClause.payment_method = payment_method;
        
        const payments = await Payment.findAll({
            where: whereClause,
            include: [
                {
                    model: Invoice,
                    as: 'invoice',
                    include: [
                        {
                            model: Tenant,
                            as: 'tenant',
                            attributes: ['id', 'first_name', 'last_name', 'email']
                        },
                        {
                            model: Property,
                            as: 'property',
                            attributes: ['id', 'name']
                        },
                        {
                            model: Unit,
                            as: 'unit',
                            attributes: ['id', 'unit_number']
                        }
                    ]
                }
            ],
            order: [['payment_date', 'DESC']]
        });
        
        // Filter by tenant or property if specified
        let filteredPayments = payments;
        if (tenant_id) {
            filteredPayments = payments.filter(p => p.invoice?.tenant_id == tenant_id);
        }
        if (property_id) {
            filteredPayments = payments.filter(p => p.invoice?.property_id == property_id);
        }
        
        // Calculate summary
        const total_payments = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const payment_methods = {};
        filteredPayments.forEach(p => {
            const method = p.payment_method;
            if (!payment_methods[method]) {
                payment_methods[method] = {
                    count: 0,
                    amount: 0
                };
            }
            payment_methods[method].count++;
            payment_methods[method].amount += parseFloat(p.amount || 0);
        });
        
        // Monthly breakdown
        const monthlyBreakdown = {};
        filteredPayments.forEach(p => {
            const month = p.payment_date.substring(0, 7); // YYYY-MM
            if (!monthlyBreakdown[month]) {
                monthlyBreakdown[month] = {
                    count: 0,
                    amount: 0,
                    payments: []
                };
            }
            monthlyBreakdown[month].count++;
            monthlyBreakdown[month].amount += parseFloat(p.amount || 0);
            monthlyBreakdown[month].payments.push({
                id: p.id,
                payment_date: p.payment_date,
                amount: p.amount,
                payment_method: p.payment_method,
                reference_number: p.reference_number,
                invoice_number: p.invoice?.invoice_number
            });
        });
        
        res.json({
            success: true,
            data: {
                summary: {
                    total_payments,
                    total_transactions: filteredPayments.length,
                    average_payment: filteredPayments.length > 0 ? total_payments / filteredPayments.length : 0,
                    payment_methods
                },
                monthly_breakdown: monthlyBreakdown,
                payments: filteredPayments.map(p => ({
                    id: p.id,
                    payment_date: p.payment_date,
                    amount: p.amount,
                    payment_method: p.payment_method,
                    reference_number: p.reference_number,
                    notes: p.notes,
                    invoice: {
                        invoice_number: p.invoice?.invoice_number,
                        invoice_date: p.invoice?.invoice_date,
                        due_date: p.invoice?.due_date,
                        period_start: p.invoice?.period_start,
                        period_end: p.invoice?.period_end
                    },
                    tenant: {
                        id: p.invoice?.tenant?.id,
                        name: p.invoice?.tenant ? `${p.invoice.tenant.first_name} ${p.invoice.tenant.last_name}` : 'Unknown',
                        email: p.invoice?.tenant?.email
                    },
                    property: {
                        id: p.invoice?.property?.id,
                        name: p.invoice?.property?.name
                    },
                    unit: {
                        id: p.invoice?.unit?.id,
                        number: p.invoice?.unit?.unit_number
                    }
                })),
                filters: {
                    start_date: start_date || 'All',
                    end_date: end_date || 'All',
                    tenant_id: tenant_id || 'All',
                    property_id: property_id || 'All',
                    payment_method: payment_method || 'All'
                }
            }
        });
        
    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get tenant financial summary
// @route   GET /api/financial-reports/tenant-summary/:tenantId
// @access  Private/Admin/Tenant
exports.getTenantFinancialSummary = async (req, res) => {
    try {
        const { tenantId } = req.params;
        
        // Check if user has access
        if (req.user.role === 'tenant' && req.user.id !== parseInt(tenantId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own financial summary.'
            });
        }
        
        // Get all invoices for tenant
        const invoices = await Invoice.findAll({
            where: { tenant_id: tenantId },
            include: [
                {
                    model: Property,
                    as: 'property',
                    attributes: ['id', 'name']
                },
                {
                    model: Unit,
                    as: 'unit',
                    attributes: ['id', 'unit_number', 'building']
                }
            ],
            order: [['invoice_date', 'DESC']]
        });
        
        // Get all payments for tenant
        const payments = await Payment.findAll({
            include: [
                {
                    model: Invoice,
                    as: 'invoice',
                    where: { tenant_id: tenantId },
                    required: true
                }
            ],
            order: [['payment_date', 'DESC']]
        });
        
        // Calculate summary
        const total_invoiced = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
        const total_paid = payments.reduce((sum, pay) => sum + parseFloat(pay.amount || 0), 0);
        const outstanding_balance = total_invoiced - total_paid;
        
        // Get overdue invoices
        const today = new Date().toISOString().split('T')[0];
        const overdue_invoices = invoices.filter(inv => 
            inv.payment_status === 'overdue' || 
            (inv.due_date < today && inv.payment_status !== 'paid')
        );
        
        const overdue_amount = overdue_invoices.reduce((sum, inv) => sum + parseFloat(inv.balance_due || 0), 0);
        
        // Payment history by month
        const payment_history = {};
        payments.forEach(p => {
            const month = p.payment_date.substring(0, 7);
            if (!payment_history[month]) {
                payment_history[month] = {
                    total_paid: 0,
                    payments: []
                };
            }
            payment_history[month].total_paid += parseFloat(p.amount || 0);
            payment_history[month].payments.push({
                date: p.payment_date,
                amount: p.amount,
                method: p.payment_method,
                reference: p.reference_number,
                invoice: p.invoice?.invoice_number
            });
        });
        
        // Invoice history
        const invoice_history = invoices.map(inv => ({
            id: inv.id,
            invoice_number: inv.invoice_number,
            invoice_date: inv.invoice_date,
            due_date: inv.due_date,
            period_start: inv.period_start,
            period_end: inv.period_end,
            rent_amount: inv.rent_amount,
            additional_charges: inv.additional_charges,
            penalty_amount: inv.penalty_amount,
            total_amount: inv.total_amount,
            amount_paid: inv.amount_paid,
            balance_due: inv.balance_due,
            payment_status: inv.payment_status,
            property: inv.property?.name,
            unit: inv.unit?.unit_number
        }));
        
        res.json({
            success: true,
            data: {
                summary: {
                    total_invoiced,
                    total_paid,
                    outstanding_balance,
                    overdue_amount,
                    invoice_count: invoices.length,
                    payment_count: payments.length,
                    payment_performance: total_invoiced > 0 ? (total_paid / total_invoiced) * 100 : 0
                },
                payment_history,
                invoice_history,
                tenant: {
                    id: tenantId,
                    name: `${req.user?.first_name} ${req.user?.last_name}`,
                    email: req.user?.email
                }
            }
        });
        
    } catch (error) {
        console.error('Get tenant financial summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get financial dashboard metrics
// @route   GET /api/financial-reports/dashboard
// @access  Private/Admin
exports.getFinancialDashboard = async (req, res) => {
    try {
        const { year = new Date().getFullYear() } = req.query;
        
        // Get monthly revenue for the year
        const monthlyRevenue = [];
        for (let month = 1; month <= 12; month++) {
            const monthStr = `${year}-${String(month).padStart(2, '0')}`;
            const payments = await Payment.findAll({
                where: {
                    payment_date: {
                        [Op.between]: [`${monthStr}-01`, `${monthStr}-31`]
                    }
                },
                include: [{ model: Invoice, as: 'invoice' }]
            });
            
            const total = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            monthlyRevenue.push({
                month: monthStr,
                revenue: total,
                count: payments.length
            });
        }
        
        // Get top paying tenants
        const topTenants = await Invoice.findAll({
            attributes: [
                'tenant_id',
                [sequelize.fn('SUM', sequelize.col('amount_paid')), 'total_paid']
            ],
            group: ['tenant_id'],
            order: [[sequelize.literal('total_paid'), 'DESC']],
            limit: 5,
            include: [
                {
                    model: User,
                    as: 'tenant',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                }
            ]
        });
        
        // Get outstanding balances by property
        const propertyBalances = await Invoice.findAll({
            attributes: [
                'property_id',
                [sequelize.fn('SUM', sequelize.col('balance_due')), 'total_balance']
            ],
            where: {
                payment_status: {
                    [Op.ne]: 'paid'
                }
            },
            group: ['property_id'],
            include: [
                {
                    model: Property,
                    as: 'property',
                    attributes: ['id', 'name']
                }
            ]
        });
        
        // Calculate collection rate trends
        const monthlyCollectionRates = [];
        for (let month = 1; month <= 12; month++) {
            const monthStr = `${year}-${String(month).padStart(2, '0')}`;
            const invoices = await Invoice.findAll({
                where: {
                    invoice_date: {
                        [Op.between]: [`${monthStr}-01`, `${monthStr}-31`]
                    }
                }
            });
            
            const totalInvoiced = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
            const totalPaid = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount_paid || 0), 0);
            
            monthlyCollectionRates.push({
                month: monthStr,
                rate: totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0,
                invoiced: totalInvoiced,
                collected: totalPaid
            });
        }
        
        res.json({
            success: true,
            data: {
                year,
                monthly_revenue: monthlyRevenue,
                top_tenants: topTenants.map(t => ({
                    tenant_id: t.tenant_id,
                    name: t.tenant ? `${t.tenant.first_name} ${t.tenant.last_name}` : 'Unknown',
                    total_paid: parseFloat(t.dataValues.total_paid || 0)
                })),
                property_balances: propertyBalances.map(pb => ({
                    property_id: pb.property_id,
                    property_name: pb.property?.name || 'Unknown',
                    outstanding_balance: parseFloat(pb.dataValues.total_balance || 0)
                })),
                collection_rate_trends: monthlyCollectionRates
            }
        });
        
    } catch (error) {
        console.error('Get financial dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Export financial report as CSV
// @route   GET /api/financial-reports/export
// @access  Private/Admin
exports.exportFinancialReport = async (req, res) => {
    try {
        const { start_date, end_date, report_type = 'payments' } = req.query;
        
        if (report_type === 'payments') {
            const payments = await Payment.findAll({
                where: {
                    payment_date: {
                        [Op.between]: [start_date || '2000-01-01', end_date || new Date().toISOString().split('T')[0]]
                    }
                },
                include: [
                    {
                        model: Invoice,
                        as: 'invoice',
                        include: [
                            { model: User, as: 'tenant', attributes: ['first_name', 'last_name'] },
                            { model: Property, as: 'property', attributes: ['name'] },
                            { model: Unit, as: 'unit', attributes: ['unit_number'] }
                        ]
                    }
                ]
            });
            
            // Generate CSV
            const csvHeaders = ['Payment ID', 'Date', 'Amount', 'Method', 'Reference', 'Invoice #', 'Tenant', 'Property', 'Unit', 'Notes'];
            const csvRows = payments.map(p => [
                p.id,
                p.payment_date,
                p.amount,
                p.payment_method,
                p.reference_number || '',
                p.invoice?.invoice_number || '',
                p.invoice?.tenant ? `${p.invoice.tenant.first_name} ${p.invoice.tenant.last_name}` : '',
                p.invoice?.property?.name || '',
                p.invoice?.unit?.unit_number || '',
                p.notes || ''
            ]);
            
            const csvContent = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=financial_report_${new Date().toISOString().split('T')[0]}.csv`);
            res.send(csvContent);
            
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid report type'
            });
        }
        
    } catch (error) {
        console.error('Export financial report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};