// src/services/invoiceService.js
const { Op } = require('sequelize');
const { Invoice, Payment, InvoiceSettings, Unit, Property, User, Tenancy } = require('../models');

class InvoiceService {
    /**
     * Get active tenancies from Phase 3 Tenancy model
     */
    async getActiveTenancies() {
        const activeTenancies = await Tenancy.findAll({
            where: {
                status: 'active',
                [Op.or]: [
                    { end_date: null },
                    { end_date: { [Op.gt]: new Date() } }
                ]
            },
            include: [
                {
                    model: Unit,
                    as: 'unit',
                    include: ['property']
                },
                {
                    model: User,
                    as: 'tenant',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
                }
            ]
        });
        
        return activeTenancies.map(tenancy => ({
            id: tenancy.id,
            unit_id: tenancy.unit_id,
            tenant_id: tenancy.tenant_id,
            property_id: tenancy.property_id,
            start_date: tenancy.start_date,
            end_date: tenancy.end_date,
            rent_amount: parseFloat(tenancy.rent_amount),
            is_active: tenancy.status === 'active',
            payment_due_day: tenancy.payment_due_day || 5,
            unit: tenancy.unit,
            tenant: tenancy.tenant
        }));
    }

    /**
     * Get tenant details
     */
    async getTenantDetails(tenantId) {
        const tenant = await User.findByPk(tenantId, {
            attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
        });
        
        return tenant || {
            id: tenantId,
            first_name: 'Unknown',
            last_name: 'Tenant',
            email: 'unknown@example.com',
            phone: 'N/A'
        };
    }

    /**
     * Generate invoice number
     */
    generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `INV-${year}${month}-${random}`;
    }

    /**
     * Get invoice settings
     */
    async getInvoiceSettings(propertyId, tenantId) {
        let settings = await InvoiceSettings.findOne({
            where: {
                tenant_id: tenantId,
                setting_type: 'tenant'
            }
        });

        if (!settings) {
            settings = await InvoiceSettings.findOne({
                where: {
                    property_id: propertyId,
                    setting_type: 'property'
                }
            });
        }

        if (!settings) {
            return {
                billing_day: 1,
                due_day: 5,
                penalty_rate: 5.00,
                penalty_type: 'percentage',
                grace_period_days: 3
            };
        }

        return settings;
    }

    /**
     * Calculate due date
     */
    calculateDueDate(invoiceDate, tenancyDueDay) {
        const dueDate = new Date(invoiceDate);
        const dueDay = tenancyDueDay || 5;
        dueDate.setDate(dueDay);
        
        if (dueDate.getDate() < invoiceDate.getDate()) {
            dueDate.setMonth(dueDate.getMonth() + 1);
        }
        
        return dueDate;
    }

    /**
     * Generate monthly invoices for all active tenancies
     */
    async generateMonthlyInvoices(targetDate = new Date()) {
        const invoices = [];
        const activeTenancies = await this.getActiveTenancies();
        
        for (const tenancy of activeTenancies) {
            try {
                const periodStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
                const periodEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
                
                const existingInvoice = await Invoice.findOne({
                    where: {
                        tenancy_id: tenancy.id,
                        period_start: periodStart,
                        period_end: periodEnd
                    }
                });
                
                if (existingInvoice) {
                    continue;
                }
                
                const settings = await this.getInvoiceSettings(tenancy.property_id, tenancy.tenant_id);
                const invoiceNumber = this.generateInvoiceNumber();
                const invoiceDate = new Date(targetDate);
                invoiceDate.setDate(settings.billing_day);
                
                const dueDate = this.calculateDueDate(invoiceDate, tenancy.payment_due_day);
                
                const invoice = await Invoice.create({
                    invoice_number: invoiceNumber,
                    tenancy_id: tenancy.id,
                    unit_id: tenancy.unit_id,
                    tenant_id: tenancy.tenant_id,
                    property_id: tenancy.property_id,
                    invoice_date: invoiceDate,
                    due_date: dueDate,
                    period_start: periodStart,
                    period_end: periodEnd,
                    rent_amount: tenancy.rent_amount,
                    additional_charges: 0,
                    penalty_amount: 0,
                    total_amount: tenancy.rent_amount,
                    amount_paid: 0,
                    balance_due: tenancy.rent_amount,
                    payment_status: 'pending',
                    penalty_applied: false,
                    penalty_days_late: 0
                });
                
                invoices.push(invoice);
                console.log(`Generated invoice ${invoiceNumber} for tenancy ${tenancy.id}`);
                
            } catch (error) {
                console.error(`Error generating invoice for tenancy ${tenancy.id}:`, error);
            }
        }
        
        return invoices;
    }

    /**
     * Apply penalties for overdue invoices
     */
    async applyPenalties() {
        const today = new Date();
        const overdueInvoices = await Invoice.findAll({
            where: {
                due_date: { [Op.lt]: today },
                payment_status: {
                    [Op.in]: ['pending', 'partially_paid']
                },
                penalty_applied: false
            },
            include: ['tenancy']
        });
        
        const updatedInvoices = [];
        
        for (const invoice of overdueInvoices) {
            try {
                const settings = await this.getInvoiceSettings(invoice.property_id, invoice.tenant_id);
                const daysLate = Math.floor((today - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24));
                
                if (daysLate > settings.grace_period_days) {
                    let penaltyAmount = 0;
                    
                    if (settings.penalty_type === 'percentage') {
                        penaltyAmount = (parseFloat(invoice.balance_due) * parseFloat(settings.penalty_rate)) / 100;
                    } else {
                        penaltyAmount = parseFloat(settings.penalty_rate);
                    }
                    
                    await invoice.update({
                        penalty_amount: penaltyAmount,
                        total_amount: parseFloat(invoice.total_amount) + penaltyAmount,
                        balance_due: parseFloat(invoice.balance_due) + penaltyAmount,
                        penalty_applied: true,
                        penalty_applied_date: today,
                        penalty_days_late: daysLate,
                        payment_status: 'overdue'
                    });
                    
                    updatedInvoices.push(invoice);
                    console.log(`Applied penalty to invoice ${invoice.invoice_number}`);
                }
            } catch (error) {
                console.error(`Error applying penalty to invoice ${invoice.id}:`, error);
            }
        }
        
        return updatedInvoices;
    }

    /**
     * Record payment
     */
    async recordPayment(paymentData) {
        const { invoice_id, amount, payment_method, reference_number, notes, recorded_by } = paymentData;
        
        const invoice = await Invoice.findByPk(invoice_id);
        if (!invoice) {
            throw new Error('Invoice not found');
        }
        
        const payment = await Payment.create({
            invoice_id,
            payment_date: new Date(),
            amount,
            payment_method,
            reference_number,
            notes,
            recorded_by
        });
        
        const newAmountPaid = parseFloat(invoice.amount_paid) + parseFloat(amount);
        const newBalanceDue = parseFloat(invoice.total_amount) - newAmountPaid;
        
        let paymentStatus = invoice.payment_status;
        if (newBalanceDue <= 0) {
            paymentStatus = 'paid';
        } else if (newAmountPaid > 0) {
            paymentStatus = 'partially_paid';
        }
        
        await invoice.update({
            amount_paid: newAmountPaid,
            balance_due: newBalanceDue,
            payment_status: paymentStatus,
            last_payment_date: new Date(),
            last_payment_amount: amount
        });
        
        return payment;
    }

    /**
     * Get invoice with details
     */
    async getInvoiceWithDetails(invoiceId) {
        const invoice = await Invoice.findByPk(invoiceId, {
            include: [
                {
                    model: Payment,
                    as: 'payments',
                    order: [['payment_date', 'DESC']]
                },
                {
                    model: Unit,
                    as: 'unit',
                    include: ['property']
                },
                {
                    model: Tenancy,
                    as: 'tenancy',
                    include: ['tenant']
                },
                {
                    model: User,
                    as: 'tenant',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
                },
                {
                    model: Property,
                    as: 'property',
                    attributes: ['id', 'name', 'location']
                }
            ]
        });
        
        if (!invoice) {
            throw new Error('Invoice not found');
        }
        
        return invoice;
    }

    /**
     * Get tenant invoices
     */
    async getTenantInvoices(tenantId) {
        return await Invoice.findAll({
            where: { tenant_id: tenantId },
            include: [
                { 
                    model: Unit, 
                    as: 'unit', 
                    include: ['property'] 
                },
                { 
                    model: Payment, 
                    as: 'payments' 
                },
                { 
                    model: Tenancy, 
                    as: 'tenancy',
                    include: ['tenant']
                },
                {
                    model: User,
                    as: 'tenant',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
                },
                {
                    model: Property,
                    as: 'property',
                    attributes: ['id', 'name', 'location']
                }
            ],
            order: [['invoice_date', 'DESC']]
        });
    }

    /**
     * Get property invoice summary
     */
    async getPropertyInvoiceSummary(propertyId, yearMonth = null) {
        let where = { property_id: propertyId };
        
        if (yearMonth) {
            const [year, month] = yearMonth.split('-');
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            where.invoice_date = {
                [Op.between]: [startDate, endDate]
            };
        }
        
        const invoices = await Invoice.findAll({ where });
        
        const summary = {
            total_invoices: invoices.length,
            total_amount: invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0),
            total_paid: invoices.reduce((sum, inv) => sum + parseFloat(inv.amount_paid), 0),
            total_outstanding: invoices.reduce((sum, inv) => sum + parseFloat(inv.balance_due), 0),
            paid_count: invoices.filter(inv => inv.payment_status === 'paid').length,
            pending_count: invoices.filter(inv => inv.payment_status === 'pending').length,
            overdue_count: invoices.filter(inv => inv.payment_status === 'overdue').length
        };
        
        return summary;
    }

    /**
     * Get all invoices with filters (UPDATED with proper tenant and property associations)
     */
    async getAllInvoices(filters = {}) {
        const where = {};
        if (filters.status) where.payment_status = filters.status;
        if (filters.property_id) where.property_id = filters.property_id;
        if (filters.tenant_id) where.tenant_id = filters.tenant_id;
        if (filters.start_date && filters.end_date) {
            where.invoice_date = {
                [Op.between]: [filters.start_date, filters.end_date]
            };
        }
        
        return await Invoice.findAll({
            where,
            include: [
                { 
                    model: Unit, 
                    as: 'unit', 
                    attributes: ['id', 'unit_number', 'building'],
                    include: [
                        {
                            model: Property,
                            as: 'property',
                            attributes: ['id', 'name', 'location']
                        }
                    ]
                },
                { 
                    model: Payment, 
                    as: 'payments',
                    attributes: ['id', 'amount', 'payment_method', 'payment_date', 'reference_number']
                },
                { 
                    model: Tenancy, 
                    as: 'tenancy',
                    include: [
                        {
                            model: User,
                            as: 'tenant',
                            attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
                        }
                    ]
                },
                {
                    model: User,
                    as: 'tenant',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
                },
                {
                    model: Property,
                    as: 'property',
                    attributes: ['id', 'name', 'location']
                }
            ],
            order: [['invoice_date', 'DESC']]
        });
    }
}

module.exports = new InvoiceService();