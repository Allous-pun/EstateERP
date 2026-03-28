const { Tenancy, User, Unit, Property } = require('../models');
const { Op } = require('sequelize');
const path = require('path');

// @desc    Get all tenancies
// @route   GET /api/tenancies
// @access  Private
exports.getAllTenancies = async (req, res) => {
    try {
        const { status, property_id, tenant_id, unit_id } = req.query;
        
        let where = {};
        if (status) where.status = status;
        if (property_id) where.property_id = property_id;
        if (tenant_id) where.tenant_id = tenant_id;
        if (unit_id) where.unit_id = unit_id;
        
        const tenancies = await Tenancy.findAll({
            where,
            include: [
                {
                    model: User,
                    as: 'tenant',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
                },
                {
                    model: Unit,
                    as: 'unit',
                    attributes: ['id', 'unit_number', 'building', 'rent_price']
                },
                {
                    model: Property,
                    as: 'property',
                    attributes: ['id', 'name', 'location']
                }
            ],
            order: [['created_at', 'DESC']]
        });
        
        res.json({
            success: true,
            count: tenancies.length,
            data: tenancies
        });
    } catch (error) {
        console.error('Get all tenancies error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get tenancy by ID
// @route   GET /api/tenancies/:id
// @access  Private
exports.getTenancyById = async (req, res) => {
    try {
        const tenancy = await Tenancy.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'tenant',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 
                                 'occupation', 'employer_name', 'emergency_contact_name',
                                 'emergency_contact_phone', 'id_document_url']
                },
                {
                    model: Unit,
                    as: 'unit',
                    include: [
                        {
                            model: Property,
                            as: 'property',
                            attributes: ['id', 'name', 'location']
                        }
                    ]
                }
            ]
        });
        
        if (!tenancy) {
            return res.status(404).json({
                success: false,
                message: 'Tenancy not found'
            });
        }
        
        // Calculate days remaining
        const today = new Date();
        const endDate = new Date(tenancy.end_date);
        const daysRemaining = endDate > today ? 
            Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : 0;
        
        const tenancyData = tenancy.get({ plain: true });
        tenancyData.days_remaining = daysRemaining;
        tenancyData.is_expiring_soon = daysRemaining <= 30 && daysRemaining > 0;
        
        res.json({
            success: true,
            data: tenancyData
        });
    } catch (error) {
        console.error('Get tenancy by ID error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Create new tenancy (Move-in)
// @route   POST /api/tenancies
// @access  Private/Admin
exports.createTenancy = async (req, res) => {
    try {
        const {
            tenant_id,
            unit_id,
            start_date,
            end_date,
            rent_amount,
            deposit_amount,
            payment_cycle,
            payment_due_day,
            lease_terms,
            move_in_notes,
            auto_renew
        } = req.body;
        
        // Check if tenant exists
        const tenant = await User.findByPk(tenant_id);
        if (!tenant) {
            return res.status(404).json({
                success: false,
                message: 'Tenant not found'
            });
        }
        
        // Check if unit exists and is vacant
        const unit = await Unit.findByPk(unit_id, {
            include: [{ model: Property, as: 'property' }]
        });
        
        if (!unit) {
            return res.status(404).json({
                success: false,
                message: 'Unit not found'
            });
        }
        
        if (unit.status !== 'vacant') {
            return res.status(400).json({
                success: false,
                message: `Unit is currently ${unit.status}. Cannot create tenancy.`
            });
        }
        
        // Check if tenant already has active tenancy
        const existingTenancy = await Tenancy.findOne({
            where: {
                tenant_id,
                status: 'active'
            }
        });
        
        if (existingTenancy) {
            return res.status(400).json({
                success: false,
                message: 'Tenant already has an active tenancy'
            });
        }
        
        // Create tenancy
        const tenancy = await Tenancy.create({
            tenant_id,
            unit_id,
            property_id: unit.property_id,
            start_date,
            end_date,
            rent_amount: rent_amount || unit.rent_price,
            deposit_amount: deposit_amount || 0,
            payment_cycle: payment_cycle || 'monthly',
            payment_due_day: payment_due_day || 1,
            lease_terms,
            move_in_notes,
            auto_renew: auto_renew || false,
            status: 'active'
        });
        
        // Update unit status to occupied
        await unit.update({
            status: 'occupied',
            current_tenant_id: tenant_id
        });
        
        res.status(201).json({
            success: true,
            message: 'Tenancy created successfully. Tenant moved in.',
            data: tenancy
        });
        
    } catch (error) {
        console.error('Create tenancy error:', error);
        
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors.map(e => ({ field: e.path, message: e.message }))
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update tenancy
// @route   PUT /api/tenancies/:id
// @access  Private/Admin
exports.updateTenancy = async (req, res) => {
    try {
        const tenancy = await Tenancy.findByPk(req.params.id);
        
        if (!tenancy) {
            return res.status(404).json({
                success: false,
                message: 'Tenancy not found'
            });
        }
        
        const {
            end_date,
            rent_amount,
            deposit_paid,
            payment_cycle,
            payment_due_day,
            lease_terms,
            auto_renew
        } = req.body;
        
        await tenancy.update({
            end_date: end_date || tenancy.end_date,
            rent_amount: rent_amount || tenancy.rent_amount,
            deposit_paid: deposit_paid !== undefined ? deposit_paid : tenancy.deposit_paid,
            payment_cycle: payment_cycle || tenancy.payment_cycle,
            payment_due_day: payment_due_day || tenancy.payment_due_day,
            lease_terms: lease_terms !== undefined ? lease_terms : tenancy.lease_terms,
            auto_renew: auto_renew !== undefined ? auto_renew : tenancy.auto_renew
        });
        
        res.json({
            success: true,
            message: 'Tenancy updated successfully',
            data: tenancy
        });
    } catch (error) {
        console.error('Update tenancy error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Move-out (Terminate tenancy)
// @route   POST /api/tenancies/:id/move-out
// @access  Private/Admin
exports.moveOut = async (req, res) => {
    try {
        const tenancy = await Tenancy.findByPk(req.params.id, {
            include: [
                {
                    model: Unit,
                    as: 'unit'
                }
            ]
        });
        
        if (!tenancy) {
            return res.status(404).json({
                success: false,
                message: 'Tenancy not found'
            });
        }
        
        if (tenancy.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: `Cannot move out. Tenancy is already ${tenancy.status}.`
            });
        }
        
        const {
            actual_move_out_date,
            move_out_notes,
            deposit_refunded,
            termination_reason
        } = req.body;
        
        const moveOutDate = actual_move_out_date || new Date().toISOString().split('T')[0];
        
        // Update tenancy
        await tenancy.update({
            status: 'terminated',
            actual_move_out_date: moveOutDate,
            move_out_notes,
            deposit_refunded: deposit_refunded || false,
            terminated_at: new Date(),
            termination_reason,
            terminated_by: req.user?.email || 'system'
        });
        
        // Update unit status back to vacant
        if (tenancy.unit) {
            await tenancy.unit.update({
                status: 'vacant',
                current_tenant_id: null
            });
        }
        
        res.json({
            success: true,
            message: 'Tenant moved out successfully',
            data: {
                tenancy_id: tenancy.id,
                unit_id: tenancy.unit_id,
                move_out_date: moveOutDate,
                deposit_refunded: tenancy.deposit_refunded
            }
        });
        
    } catch (error) {
        console.error('Move-out error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Upload lease agreement
// @route   POST /api/tenancies/:id/upload-lease
// @access  Private/Admin
exports.uploadLeaseAgreement = async (req, res) => {
    try {
        const tenancy = await Tenancy.findByPk(req.params.id);
        
        if (!tenancy) {
            return res.status(404).json({
                success: false,
                message: 'Tenancy not found'
            });
        }
        
        // In a real implementation, you would handle file upload here
        // For now, we'll just update the URL from request body
        
        const { document_url, filename, lease_terms } = req.body;
        
        await tenancy.update({
            lease_agreement_url: document_url,
            lease_agreement_filename: filename,
            lease_agreement_uploaded_at: new Date(),
            lease_terms: lease_terms || tenancy.lease_terms
        });
        
        res.json({
            success: true,
            message: 'Lease agreement uploaded successfully',
            data: tenancy
        });
        
    } catch (error) {
        console.error('Upload lease agreement error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get expiring tenancies (within next X days)
// @route   GET /api/tenancies/expiring
// @access  Private/Admin
exports.getExpiringTenancies = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const today = new Date();
        const expiryDate = new Date();
        expiryDate.setDate(today.getDate() + parseInt(days));
        
        const tenancies = await Tenancy.findAll({
            where: {
                status: 'active',
                end_date: {
                    [Op.between]: [today.toISOString().split('T')[0], expiryDate.toISOString().split('T')[0]]
                }
            },
            include: [
                {
                    model: User,
                    as: 'tenant',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
                },
                {
                    model: Unit,
                    as: 'unit',
                    attributes: ['id', 'unit_number', 'building']
                },
                {
                    model: Property,
                    as: 'property',
                    attributes: ['id', 'name']
                }
            ],
            order: [['end_date', 'ASC']]
        });
        
        res.json({
            success: true,
            count: tenancies.length,
            data: tenancies
        });
        
    } catch (error) {
        console.error('Get expiring tenancies error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get active tenancies for a tenant
// @route   GET /api/tenancies/my-tenancies
// @access  Private/Tenant
exports.getMyTenancies = async (req, res) => {
    try {
        const tenancies = await Tenancy.findAll({
            where: {
                tenant_id: req.user.id
            },
            include: [
                {
                    model: Unit,
                    as: 'unit',
                    include: [
                        {
                            model: Property,
                            as: 'property',
                            attributes: ['id', 'name', 'location']
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']]
        });
        
        // Calculate status for each tenancy
        const tenanciesWithStatus = tenancies.map(tenancy => {
            const data = tenancy.get({ plain: true });
            const today = new Date();
            const endDate = new Date(data.end_date);
            
            if (data.status === 'active' && endDate < today) {
                data.status = 'expired';
            }
            
            return data;
        });
        
        res.json({
            success: true,
            count: tenanciesWithStatus.length,
            data: tenanciesWithStatus
        });
        
    } catch (error) {
        console.error('Get my tenancies error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Auto-check expired tenancies (for cron job)
// @route   POST /api/tenancies/check-expired
// @access  Private/Admin (Internal)
exports.checkExpiredTenancies = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Find expired but still active tenancies
        const expiredTenancies = await Tenancy.findAll({
            where: {
                status: 'active',
                end_date: {
                    [Op.lt]: today
                }
            },
            include: [
                {
                    model: Unit,
                    as: 'unit'
                }
            ]
        });
        
        const results = [];
        
        for (const tenancy of expiredTenancies) {
            // Update tenancy status
            await tenancy.update({
                status: 'expired'
            });
            
            // If no auto-renew, mark unit as vacant
            if (!tenancy.auto_renew && tenancy.unit) {
                await tenancy.unit.update({
                    status: 'vacant',
                    current_tenant_id: null
                });
            }
            
            results.push({
                tenancy_id: tenancy.id,
                unit_id: tenancy.unit_id,
                tenant_id: tenancy.tenant_id,
                status: 'expired'
            });
        }
        
        res.json({
            success: true,
            message: `${results.length} tenancies expired and updated`,
            data: results
        });
        
    } catch (error) {
        console.error('Check expired tenancies error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error'
        });
    }
};