// src/controllers/maintenanceController.js
const { MaintenanceTicket, Unit, Property, User, StockLog, Inventory } = require('../models');
const { sequelize } = require('../config/database');  // ADD THIS LINE
const { Op } = require('sequelize');

// Generate ticket number
const generateTicketNumber = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `MT-${year}${month}-${random}`;
};

// @desc    Get all tickets
// @route   GET /api/maintenance/tickets
// @access  Private
exports.getAllTickets = async (req, res) => {
    try {
        const { status, priority, unit_id, property_id, assigned_to } = req.query;
        
        let where = {};
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (unit_id) where.unit_id = unit_id;
        if (property_id) where.property_id = property_id;
        if (assigned_to) where.assigned_to = assigned_to;
        
        const tickets = await MaintenanceTicket.findAll({
            where,
            include: [
                {
                    model: User,
                    as: 'reporter',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
                },
                {
                    model: User,
                    as: 'technician',
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
                    attributes: ['id', 'name', 'location']
                }
            ],
            order: [['created_at', 'DESC']]
        });
        
        res.json({
            success: true,
            count: tickets.length,
            data: tickets
        });
    } catch (error) {
        console.error('Get all tickets error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get ticket by ID
// @route   GET /api/maintenance/tickets/:id
// @access  Private
exports.getTicketById = async (req, res) => {
    try {
        const ticket = await MaintenanceTicket.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'reporter',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
                },
                {
                    model: User,
                    as: 'technician',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
                },
                {
                    model: Unit,
                    as: 'unit',
                    include: [{ model: Property, as: 'property' }]
                },
                {
                    model: StockLog,
                    as: 'stock_logs',
                    include: [{ model: Inventory, as: 'inventory' }]
                }
            ]
        });
        
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }
        
        res.json({
            success: true,
            data: ticket
        });
    } catch (error) {
        console.error('Get ticket error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create new ticket
// @route   POST /api/maintenance/tickets
// @access  Private (Tenant, Admin)
exports.createTicket = async (req, res) => {
    try {
        const {
            title,
            description,
            priority,
            category,
            unit_id,
            property_id,
            scheduled_date,
            before_photos
        } = req.body;
        
        const ticket = await MaintenanceTicket.create({
            ticket_number: generateTicketNumber(),
            title,
            description,
            priority: priority || 'medium',
            category: category || 'other',
            status: 'pending',
            reported_by: req.user.id,
            unit_id,
            property_id,
            scheduled_date,
            before_photos: before_photos || [],
            is_billed: false
        });
        
        res.status(201).json({
            success: true,
            message: 'Maintenance ticket created successfully',
            data: ticket
        });
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Assign ticket to technician
// @route   PUT /api/maintenance/tickets/:id/assign
// @access  Private/Admin, Facility Manager
exports.assignTicket = async (req, res) => {
    try {
        const ticket = await MaintenanceTicket.findByPk(req.params.id);
        
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }
        
        const { assigned_to, scheduled_date } = req.body;
        
        // Check if technician exists and has technician role
        const technician = await User.findByPk(assigned_to);
        if (!technician) {
            return res.status(404).json({ success: false, message: 'Technician not found' });
        }
        
        await ticket.update({
            assigned_to,
            scheduled_date: scheduled_date || ticket.scheduled_date,
            status: 'assigned'
        });
        
        res.json({
            success: true,
            message: 'Ticket assigned successfully',
            data: ticket
        });
    } catch (error) {
        console.error('Assign ticket error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update ticket status
// @route   PUT /api/maintenance/tickets/:id/status
// @access  Private/Technician, Admin
exports.updateStatus = async (req, res) => {
    try {
        const ticket = await MaintenanceTicket.findByPk(req.params.id);
        
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }
        
        const { status, notes, resolution_notes, after_photos } = req.body;
        
        const updateData = { status };
        if (notes) updateData.notes = notes;
        if (resolution_notes) updateData.resolution_notes = resolution_notes;
        if (after_photos) updateData.after_photos = after_photos;
        
        if (status === 'completed') {
            updateData.completed_date = new Date();
        }
        
        await ticket.update(updateData);
        
        res.json({
            success: true,
            message: 'Ticket status updated',
            data: ticket
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Add materials to ticket and update inventory
// @route   POST /api/maintenance/tickets/:id/materials
// @access  Private/Technician, Admin
exports.addMaterials = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const ticket = await MaintenanceTicket.findByPk(req.params.id, { transaction });
        
        if (!ticket) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }
        
        const { materials } = req.body; // Array of { inventory_id, quantity }
        
        let materialsUsed = ticket.materials_used || [];
        let totalCost = parseFloat(ticket.actual_cost) || 0;
        
        for (const item of materials) {
            const inventory = await Inventory.findByPk(item.inventory_id, { transaction });
            
            if (!inventory) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: `Inventory item ${item.inventory_id} not found` });
            }
            
            if (inventory.current_stock < item.quantity) {
                await transaction.rollback();
                return res.status(400).json({ 
                    success: false, 
                    message: `Insufficient stock for ${inventory.name}. Available: ${inventory.current_stock}` 
                });
            }
            
            const quantityBefore = inventory.current_stock;
            const quantityAfter = parseFloat(inventory.current_stock) - parseFloat(item.quantity);
            const itemCost = parseFloat(inventory.unit_cost) * parseFloat(item.quantity);
            totalCost += itemCost;
            
            // Update inventory
            await inventory.update({
                current_stock: quantityAfter
            }, { transaction });
            
            // Create stock log
            await StockLog.create({
                inventory_id: item.inventory_id,
                ticket_id: ticket.id,
                transaction_type: 'usage',
                quantity: item.quantity,
                quantity_before: quantityBefore,
                quantity_after: quantityAfter,
                unit_cost: inventory.unit_cost,
                reason: `Used for maintenance ticket ${ticket.ticket_number}`,
                performed_by: req.user.id
            }, { transaction });
            
            // Add to materials used
            materialsUsed.push({
                inventory_id: item.inventory_id,
                name: inventory.name,
                quantity: item.quantity,
                unit_cost: inventory.unit_cost,
                total_cost: itemCost
            });
        }
        
        // Update ticket
        await ticket.update({
            materials_used: materialsUsed,
            actual_cost: totalCost,
            status: ticket.status === 'assigned' ? 'in_progress' : ticket.status
        }, { transaction });
        
        await transaction.commit();
        
        res.json({
            success: true,
            message: 'Materials added successfully',
            data: {
                ticket,
                total_cost: totalCost,
                materials_used: materialsUsed
            }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Add materials error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Complete ticket and generate invoice
// @route   POST /api/maintenance/tickets/:id/complete
// @access  Private/Technician, Admin, Facility Manager
exports.completeTicket = async (req, res) => {
    const transaction = await sequelize.transaction();  // Now sequelize is defined
    
    try {
        const ticket = await MaintenanceTicket.findByPk(req.params.id, {
            include: [
                { model: Unit, as: 'unit' },
                { model: Property, as: 'property' }
            ],
            transaction
        });
        
        if (!ticket) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }
        
        const { resolution_notes, after_photos, actual_cost, materials_used } = req.body;
        
        const updateData = {
            status: 'completed',
            completed_date: new Date(),
            resolution_notes: resolution_notes || ticket.resolution_notes,
            after_photos: after_photos || ticket.after_photos
        };
        
        if (actual_cost) updateData.actual_cost = actual_cost;
        if (materials_used) updateData.materials_used = materials_used;
        
        await ticket.update(updateData, { transaction });
        
        // Auto-billing integration - create invoice for maintenance costs
        if (ticket.actual_cost > 0 && !ticket.is_billed) {
            const { Invoice } = require('../models');
            const invoiceNumber = `INV-MT-${ticket.id}-${Date.now()}`;
            
            const invoice = await Invoice.create({
                invoice_number: invoiceNumber,
                tenant_id: null,
                unit_id: ticket.unit_id,
                property_id: ticket.property_id,
                amount: ticket.actual_cost,
                balance: ticket.actual_cost,
                due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                billing_period: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
                status: 'unpaid',
                notes: `Maintenance charges for ticket ${ticket.ticket_number}`
            }, { transaction });
            
            await ticket.update({ is_billed: true, invoice_id: invoice.id }, { transaction });
        }
        
        await transaction.commit();
        
        res.json({
            success: true,
            message: 'Ticket completed successfully',
            data: ticket
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Complete ticket error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get technician tickets
// @route   GET /api/maintenance/technician/tickets
// @access  Private/Technician
exports.getTechnicianTickets = async (req, res) => {
    try {
        const tickets = await MaintenanceTicket.findAll({
            where: {
                assigned_to: req.user.id,
                status: { [Op.ne]: 'completed' }
            },
            include: [
                {
                    model: Unit,
                    as: 'unit',
                    attributes: ['id', 'unit_number', 'building']
                },
                {
                    model: Property,
                    as: 'property',
                    attributes: ['id', 'name', 'location']
                },
                {
                    model: User,
                    as: 'reporter',
                    attributes: ['id', 'first_name', 'last_name', 'phone']
                }
            ],
            order: [['priority', 'DESC'], ['created_at', 'ASC']]
        });
        
        res.json({
            success: true,
            count: tickets.length,
            data: tickets
        });
    } catch (error) {
        console.error('Get technician tickets error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get tickets by unit
// @route   GET /api/maintenance/unit/:unitId/tickets
// @access  Private
exports.getUnitTickets = async (req, res) => {
    try {
        const { unitId } = req.params;
        
        const tickets = await MaintenanceTicket.findAll({
            where: { unit_id: unitId },
            include: [
                {
                    model: User,
                    as: 'technician',
                    attributes: ['id', 'first_name', 'last_name']
                }
            ],
            order: [['created_at', 'DESC']]
        });
        
        res.json({
            success: true,
            count: tickets.length,
            data: tickets
        });
    } catch (error) {
        console.error('Get unit tickets error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get maintenance dashboard stats
// @route   GET /api/maintenance/dashboard/stats
// @access  Private/Admin, Facility Manager
exports.getDashboardStats = async (req, res) => {
    try {
        const totalTickets = await MaintenanceTicket.count();
        const pendingTickets = await MaintenanceTicket.count({ where: { status: 'pending' } });
        const inProgressTickets = await MaintenanceTicket.count({ where: { status: 'in_progress' } });
        const completedTickets = await MaintenanceTicket.count({ where: { status: 'completed' } });
        const urgentTickets = await MaintenanceTicket.count({ where: { priority: 'urgent', status: { [Op.ne]: 'completed' } } });
        
        const totalCost = await MaintenanceTicket.sum('actual_cost');
        
        res.json({
            success: true,
            data: {
                total_tickets: totalTickets,
                pending: pendingTickets,
                in_progress: inProgressTickets,
                completed: completedTickets,
                urgent: urgentTickets,
                total_cost: totalCost || 0
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};