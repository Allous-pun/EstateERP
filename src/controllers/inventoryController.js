const { Inventory, StockLog } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private
exports.getAllItems = async (req, res) => {
    try {
        const { category, search, low_stock } = req.query;
        
        let where = {};
        if (category) where.category = category;
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { item_code: { [Op.like]: `%${search}%` } }
            ];
        }
        if (low_stock === 'true') {
            where.current_stock = { [Op.lte]: sequelize.col('reorder_level') };
        }
        
        const items = await Inventory.findAll({
            where,
            order: [['name', 'ASC']]
        });
        
        res.json({
            success: true,
            count: items.length,
            data: items
        });
    } catch (error) {
        console.error('Get inventory error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get inventory item by ID
// @route   GET /api/inventory/:id
// @access  Private
exports.getItemById = async (req, res) => {
    try {
        const item = await Inventory.findByPk(req.params.id, {
            include: [
                {
                    model: StockLog,
                    as: 'stock_logs',
                    limit: 10,
                    order: [['created_at', 'DESC']]
                }
            ]
        });
        
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        
        res.json({
            success: true,
            data: item
        });
    } catch (error) {
        console.error('Get item error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create inventory item
// @route   POST /api/inventory
// @access  Private/Admin, Facility Manager
exports.createItem = async (req, res) => {
    try {
        const {
            item_code,
            name,
            category,
            description,
            unit,
            current_stock,
            minimum_stock,
            reorder_level,
            unit_cost,
            selling_price,
            supplier,
            supplier_contact,
            location,
            expiry_date
        } = req.body;
        
        const existingItem = await Inventory.findOne({ where: { item_code } });
        if (existingItem) {
            return res.status(400).json({ success: false, message: 'Item code already exists' });
        }
        
        const item = await Inventory.create({
            item_code,
            name,
            category,
            description,
            unit,
            current_stock: current_stock || 0,
            minimum_stock: minimum_stock || 0,
            reorder_level: reorder_level || 0,
            unit_cost: unit_cost || 0,
            selling_price: selling_price || 0,
            supplier,
            supplier_contact,
            location,
            expiry_date,
            last_restocked: current_stock > 0 ? new Date() : null
        });
        
        res.status(201).json({
            success: true,
            message: 'Inventory item created',
            data: item
        });
    } catch (error) {
        console.error('Create item error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private/Admin, Facility Manager
exports.updateItem = async (req, res) => {
    try {
        const item = await Inventory.findByPk(req.params.id);
        
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        
        await item.update(req.body);
        
        res.json({
            success: true,
            message: 'Inventory item updated',
            data: item
        });
    } catch (error) {
        console.error('Update item error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Restock inventory
// @route   POST /api/inventory/:id/restock
// @access  Private/Admin, Facility Manager
exports.restock = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const item = await Inventory.findByPk(req.params.id, { transaction });
        
        if (!item) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        
        const { quantity, unit_cost, reference_number, notes } = req.body;
        
        const quantityBefore = item.current_stock;
        const quantityAfter = parseFloat(quantityBefore) + parseFloat(quantity);
        const cost = parseFloat(unit_cost) || parseFloat(item.unit_cost);
        
        await item.update({
            current_stock: quantityAfter,
            unit_cost: cost,
            last_restocked: new Date()
        }, { transaction });
        
        await StockLog.create({
            inventory_id: item.id,
            transaction_type: 'restock',
            quantity: quantity,
            quantity_before: quantityBefore,
            quantity_after: quantityAfter,
            unit_cost: cost,
            reference_number,
            reason: notes || 'Regular restock',
            performed_by: req.user.id
        }, { transaction });
        
        await transaction.commit();
        
        res.json({
            success: true,
            message: 'Inventory restocked successfully',
            data: item
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Restock error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get low stock items
// @route   GET /api/inventory/low-stock
// @access  Private/Admin, Facility Manager
exports.getLowStock = async (req, res) => {
    try {
        const items = await Inventory.findAll({
            where: {
                current_stock: { [Op.lte]: sequelize.col('reorder_level') }
            },
            order: [[sequelize.literal('current_stock / reorder_level'), 'ASC']]
        });
        
        res.json({
            success: true,
            count: items.length,
            data: items
        });
    } catch (error) {
        console.error('Get low stock error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get stock logs
// @route   GET /api/inventory/:id/logs
// @access  Private/Admin, Facility Manager
exports.getStockLogs = async (req, res) => {
    try {
        const logs = await StockLog.findAll({
            where: { inventory_id: req.params.id },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'first_name', 'last_name']
                }
            ],
            order: [['created_at', 'DESC']],
            limit: 50
        });
        
        res.json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (error) {
        console.error('Get stock logs error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};