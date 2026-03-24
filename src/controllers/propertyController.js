const { Property, Unit } = require('../models');

// @desc    Get all properties
// @route   GET /api/properties
// @access  Private
exports.getAllProperties = async (req, res) => {
    try {
        const { search, location } = req.query;
        
        let where = {};
        
        // Search by name or location
        if (search) {
            where = {
                [Op.or]: [
                    { name: { [Op.like]: `%${search}%` } },
                    { location: { [Op.like]: `%${search}%` } }
                ]
            };
        }
        
        // Filter by location
        if (location) {
            where.location = { [Op.like]: `%${location}%` };
        }
        
        const properties = await Property.findAll({
            where,
            include: [
                {
                    model: Unit,
                    as: 'units',
                    attributes: ['id', 'unit_number', 'status', 'rent_price']
                }
            ],
            order: [['created_at', 'DESC']]
        });
        
        // Add unit count to each property
        const propertiesWithStats = properties.map(property => {
            const plainProperty = property.get({ plain: true });
            plainProperty.total_units = plainProperty.units ? plainProperty.units.length : 0;
            plainProperty.occupied_units = plainProperty.units ? 
                plainProperty.units.filter(unit => unit.status === 'occupied').length : 0;
            plainProperty.vacant_units = plainProperty.units ? 
                plainProperty.units.filter(unit => unit.status === 'vacant').length : 0;
            return plainProperty;
        });
        
        res.json({
            success: true,
            count: properties.length,
            data: propertiesWithStats
        });
    } catch (error) {
        console.error('Get all properties error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get property by ID
// @route   GET /api/properties/:id
// @access  Private
exports.getPropertyById = async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id, {
            include: [
                {
                    model: Unit,
                    as: 'units',
                    attributes: ['id', 'unit_number', 'building', 'floor', 'bedroom_count', 
                                 'bathroom_count', 'size_sqm', 'rent_price', 'status', 'is_active'],
                    include: [
                        {
                            model: User,
                            as: 'tenant',
                            attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
                        }
                    ]
                }
            ]
        });
        
        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }
        
        // Calculate property statistics
        const propertyData = property.get({ plain: true });
        const units = propertyData.units || [];
        
        propertyData.statistics = {
            total_units: units.length,
            occupied_units: units.filter(u => u.status === 'occupied').length,
            vacant_units: units.filter(u => u.status === 'vacant').length,
            maintenance_units: units.filter(u => u.status === 'maintenance').length,
            reserved_units: units.filter(u => u.status === 'reserved').length,
            total_monthly_rent: units.reduce((sum, u) => sum + parseFloat(u.rent_price || 0), 0),
            average_rent: units.length > 0 ? 
                units.reduce((sum, u) => sum + parseFloat(u.rent_price || 0), 0) / units.length : 0
        };
        
        res.json({
            success: true,
            data: propertyData
        });
    } catch (error) {
        console.error('Get property by ID error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Create new property
// @route   POST /api/properties
// @access  Private/Admin or Super Admin
exports.createProperty = async (req, res) => {
    try {
        const { name, location, description } = req.body;
        
        // Check if property with same name already exists
        const existingProperty = await Property.findOne({
            where: { name }
        });
        
        if (existingProperty) {
            return res.status(400).json({
                success: false,
                message: 'Property with this name already exists'
            });
        }
        
        const property = await Property.create({
            name,
            location,
            description,
            created_by: req.user.id // Assuming req.user contains the authenticated user
        });
        
        res.status(201).json({
            success: true,
            message: 'Property created successfully',
            data: property
        });
    } catch (error) {
        console.error('Create property error:', error);
        
        // Handle validation errors
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

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private/Admin or Super Admin
exports.updateProperty = async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id);
        
        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }
        
        const { name, location, description } = req.body;
        
        // Check if updating name would cause duplicate
        if (name && name !== property.name) {
            const existingProperty = await Property.findOne({
                where: { name }
            });
            
            if (existingProperty) {
                return res.status(400).json({
                    success: false,
                    message: 'Property with this name already exists'
                });
            }
        }
        
        await property.update({
            name: name || property.name,
            location: location || property.location,
            description: description !== undefined ? description : property.description
        });
        
        res.json({
            success: true,
            message: 'Property updated successfully',
            data: property
        });
    } catch (error) {
        console.error('Update property error:', error);
        
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

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private/Admin or Super Admin
exports.deleteProperty = async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id, {
            include: [
                {
                    model: Unit,
                    as: 'units',
                    attributes: ['id', 'status']
                }
            ]
        });
        
        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }
        
        // Check if property has occupied units
        const occupiedUnits = property.units?.filter(unit => unit.status === 'occupied');
        
        if (occupiedUnits && occupiedUnits.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete property with ${occupiedUnits.length} occupied unit(s). Please vacate all units first.`
            });
        }
        
        // Optional: Soft delete or hard delete
        // This is hard delete - if you want soft delete, add deleted_at column
        await property.destroy();
        
        res.json({
            success: true,
            message: 'Property deleted successfully',
            data: {
                id: property.id,
                name: property.name,
                units_deleted: property.units?.length || 0
            }
        });
    } catch (error) {
        console.error('Delete property error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get property statistics
// @route   GET /api/properties/:id/stats
// @access  Private
exports.getPropertyStats = async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id, {
            include: [
                {
                    model: Unit,
                    as: 'units',
                    attributes: ['status', 'rent_price', 'bedroom_count', 'size_sqm']
                }
            ]
        });
        
        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }
        
        const units = property.units || [];
        
        const stats = {
            total_units: units.length,
            occupancy_rate: units.length > 0 ? 
                (units.filter(u => u.status === 'occupied').length / units.length * 100).toFixed(2) : 0,
            unit_composition: {
                studio: units.filter(u => u.bedroom_count === 0).length,
                one_bedroom: units.filter(u => u.bedroom_count === 1).length,
                two_bedroom: units.filter(u => u.bedroom_count === 2).length,
                three_bedroom: units.filter(u => u.bedroom_count === 3).length,
                four_plus_bedroom: units.filter(u => u.bedroom_count >= 4).length
            },
            revenue: {
                total_monthly: units.reduce((sum, u) => sum + parseFloat(u.rent_price || 0), 0),
                occupied_monthly: units
                    .filter(u => u.status === 'occupied')
                    .reduce((sum, u) => sum + parseFloat(u.rent_price || 0), 0),
                vacant_monthly: units
                    .filter(u => u.status === 'vacant')
                    .reduce((sum, u) => sum + parseFloat(u.rent_price || 0), 0)
            },
            size_stats: {
                total_sqm: units.reduce((sum, u) => sum + parseFloat(u.size_sqm || 0), 0),
                average_sqm: units.length > 0 ? 
                    units.reduce((sum, u) => sum + parseFloat(u.size_sqm || 0), 0) / units.length : 0
            }
        };
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get property stats error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get properties with filters
// @route   GET /api/properties/filter
// @access  Private
exports.filterProperties = async (req, res) => {
    try {
        const { min_units, max_units, location, has_vacant_units } = req.query;
        
        let where = {};
        
        if (location) {
            where.location = { [Op.like]: `%${location}%` };
        }
        
        const properties = await Property.findAll({
            where,
            include: [
                {
                    model: Unit,
                    as: 'units',
                    attributes: ['id', 'status']
                }
            ]
        });
        
        // Apply filters after fetching (for aggregate conditions)
        let filteredProperties = properties;
        
        if (min_units || max_units) {
            filteredProperties = filteredProperties.filter(prop => {
                const unitCount = prop.units?.length || 0;
                if (min_units && unitCount < parseInt(min_units)) return false;
                if (max_units && unitCount > parseInt(max_units)) return false;
                return true;
            });
        }
        
        if (has_vacant_units === 'true') {
            filteredProperties = filteredProperties.filter(prop => {
                return prop.units?.some(unit => unit.status === 'vacant');
            });
        }
        
        res.json({
            success: true,
            count: filteredProperties.length,
            data: filteredProperties
        });
    } catch (error) {
        console.error('Filter properties error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error'
        });
    }
};