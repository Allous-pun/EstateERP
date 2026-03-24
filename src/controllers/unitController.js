const { Unit, Property } = require('../models');

// @desc    Get all units
// @route   GET /api/units
// @access  Private
exports.getAllUnits = async (req, res) => {
    try {
        const { property_id, status, building } = req.query;
        
        let where = {};
        if (property_id) where.property_id = property_id;
        if (status) where.status = status;
        if (building) where.building = building;
        
        const units = await Unit.findAll({
            where,
            include: [
                {
                    model: Property,
                    as: 'property',
                    attributes: ['id', 'name', 'location']
                }
            ],
            order: [['property_id', 'ASC'], ['unit_number', 'ASC']]
        });
        
        res.json({
            success: true,
            count: units.length,
            data: units
        });
    } catch (error) {
        console.error('Get all units error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get unit by ID
// @route   GET /api/units/:id
// @access  Private
exports.getUnitById = async (req, res) => {
    try {
        const unit = await Unit.findByPk(req.params.id, {
            include: [
                {
                    model: Property,
                    as: 'property',
                    attributes: ['id', 'name', 'location', 'description']
                }
            ]
        });
        
        if (!unit) {
            return res.status(404).json({
                success: false,
                message: 'Unit not found'
            });
        }
        
        res.json({
            success: true,
            data: unit
        });
    } catch (error) {
        console.error('Get unit by ID error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Create new unit
// @route   POST /api/units
// @access  Private/Admin
exports.createUnit = async (req, res) => {
    try {
        const {
            unit_number,
            building,
            floor,
            bedroom_count,
            bathroom_count,
            size_sqm,
            rent_price,
            status,
            property_id,
            description,
            features,
            is_active
        } = req.body;
        
        // Check if property exists
        const property = await Property.findByPk(property_id);
        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }
        
        // Check if unit number already exists in this property
        const existingUnit = await Unit.findOne({
            where: {
                unit_number,
                property_id
            }
        });
        
        if (existingUnit) {
            return res.status(400).json({
                success: false,
                message: 'Unit number already exists in this property'
            });
        }
        
        const unit = await Unit.create({
            unit_number,
            building,
            floor,
            bedroom_count,
            bathroom_count,
            size_sqm,
            rent_price,
            status: status || 'vacant',
            property_id,
            description,
            features: features || [],
            is_active: is_active !== undefined ? is_active : true
        });
        
        res.status(201).json({
            success: true,
            message: 'Unit created successfully',
            data: unit
        });
    } catch (error) {
        console.error('Create unit error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update unit
// @route   PUT /api/units/:id
// @access  Private/Admin
exports.updateUnit = async (req, res) => {
    try {
        const unit = await Unit.findByPk(req.params.id);
        
        if (!unit) {
            return res.status(404).json({
                success: false,
                message: 'Unit not found'
            });
        }
        
        const {
            unit_number,
            building,
            floor,
            bedroom_count,
            bathroom_count,
            size_sqm,
            rent_price,
            status,
            description,
            features,
            is_active,
            current_tenant_id
        } = req.body;
        
        // Check if updating unit number would cause duplicate
        if (unit_number && unit_number !== unit.unit_number) {
            const existingUnit = await Unit.findOne({
                where: {
                    unit_number,
                    property_id: unit.property_id
                }
            });
            
            if (existingUnit) {
                return res.status(400).json({
                    success: false,
                    message: 'Unit number already exists in this property'
                });
            }
        }
        
        await unit.update({
            unit_number: unit_number || unit.unit_number,
            building: building || unit.building,
            floor: floor !== undefined ? floor : unit.floor,
            bedroom_count: bedroom_count !== undefined ? bedroom_count : unit.bedroom_count,
            bathroom_count: bathroom_count !== undefined ? bathroom_count : unit.bathroom_count,
            size_sqm: size_sqm !== undefined ? size_sqm : unit.size_sqm,
            rent_price: rent_price !== undefined ? rent_price : unit.rent_price,
            status: status || unit.status,
            description: description !== undefined ? description : unit.description,
            features: features !== undefined ? features : unit.features,
            is_active: is_active !== undefined ? is_active : unit.is_active,
            current_tenant_id: current_tenant_id !== undefined ? current_tenant_id : unit.current_tenant_id
        });
        
        res.json({
            success: true,
            message: 'Unit updated successfully',
            data: unit
        });
    } catch (error) {
        console.error('Update unit error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Delete unit
// @route   DELETE /api/units/:id
// @access  Private/Admin
exports.deleteUnit = async (req, res) => {
    try {
        const unit = await Unit.findByPk(req.params.id);
        
        if (!unit) {
            return res.status(404).json({
                success: false,
                message: 'Unit not found'
            });
        }
        
        // Check if unit has active tenancy
        if (unit.status === 'occupied') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete occupied unit. Please move out tenant first.'
            });
        }
        
        await unit.destroy();
        
        res.json({
            success: true,
            message: 'Unit deleted successfully'
        });
    } catch (error) {
        console.error('Delete unit error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get units by property
// @route   GET /api/properties/:propertyId/units
// @access  Private
exports.getUnitsByProperty = async (req, res) => {
    try {
        const { propertyId } = req.params;
        
        const property = await Property.findByPk(propertyId);
        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }
        
        const units = await Unit.findAll({
            where: { property_id: propertyId },
            order: [['unit_number', 'ASC']]
        });
        
        res.json({
            success: true,
            count: units.length,
            data: units
        });
    } catch (error) {
        console.error('Get units by property error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error'
        });
    }
};