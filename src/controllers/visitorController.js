// src/controllers/visitorController.js
const { Op } = require('sequelize');
const { VisitorLog, Property, Unit, User } = require('../models');

// @desc    Log visitor entry
// @route   POST /api/visitors/entry
// @access  Private (Security Guard only)
exports.logEntry = async (req, res) => {
    try {
        const {
            visitor_name,
            visitor_phone,
            visitor_id_number,
            purpose,
            purpose_description,
            visited_tenant_name,
            visited_unit_number,
            visited_property_id,
            vehicle_plate,
            vehicle_make,
            notes
        } = req.body;

        // Validation
        if (!visitor_name || !visitor_phone || !purpose) {
            return res.status(400).json({
                success: false,
                message: 'Visitor name, phone, and purpose are required'
            });
        }

        // Create visitor log
        const visitorLog = await VisitorLog.create({
            visitor_name,
            visitor_phone,
            visitor_id_number,
            purpose,
            purpose_description,
            visited_tenant_name,
            visited_unit_number,
            visited_property_id: visited_property_id || null,
            vehicle_plate,
            vehicle_make,
            notes,
            entry_time: new Date(),
            logged_by: req.user.id,
            status: 'active'
        });

        // Fetch property details if property_id provided
        let propertyDetails = null;
        if (visited_property_id) {
            propertyDetails = await Property.findByPk(visited_property_id, {
                attributes: ['id', 'name', 'location']
            });
        }

        res.status(201).json({
            success: true,
            message: 'Visitor entry logged successfully',
            data: {
                ...visitorLog.toJSON(),
                property: propertyDetails
            }
        });
    } catch (error) {
        console.error('Log entry error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to log visitor entry'
        });
    }
};

// @desc    Log visitor exit
// @route   PUT /api/visitors/:id/exit
// @access  Private (Security Guard only)
exports.logExit = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;

        const visitorLog = await VisitorLog.findByPk(id);

        if (!visitorLog) {
            return res.status(404).json({
                success: false,
                message: 'Visitor log not found'
            });
        }

        if (visitorLog.status === 'exited') {
            return res.status(400).json({
                success: false,
                message: 'Visitor already exited'
            });
        }

        // Update exit time
        await visitorLog.update({
            exit_time: new Date(),
            status: 'exited',
            notes: notes ? `${visitorLog.notes || ''}\nExit notes: ${notes}`.trim() : visitorLog.notes
        });

        res.json({
            success: true,
            message: 'Visitor exit logged successfully',
            data: visitorLog
        });
    } catch (error) {
        console.error('Log exit error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to log visitor exit'
        });
    }
};

// @desc    Get active visitors (currently on property)
// @route   GET /api/visitors/active
// @access  Private (Security Guard, Admin)
exports.getActiveVisitors = async (req, res) => {
    try {
        const { property_id } = req.query;
        
        const where = {
            status: 'active',
            exit_time: null
        };
        
        if (property_id) {
            where.visited_property_id = property_id;
        }
        
        const visitors = await VisitorLog.findAll({
            where,
            include: [
                {
                    model: Property,
                    as: 'property',
                    attributes: ['id', 'name', 'location']
                },
                {
                    model: User,
                    as: 'guard',
                    attributes: ['id', 'first_name', 'last_name', 'email'],
                    foreignKey: 'logged_by'
                }
            ],
            order: [['entry_time', 'DESC']]
        });
        
        res.json({
            success: true,
            count: visitors.length,
            data: visitors
        });
    } catch (error) {
        console.error('Get active visitors error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get active visitors'
        });
    }
};

// @desc    Get today's visitors
// @route   GET /api/visitors/today
// @access  Private (Security Guard, Admin)
exports.getTodayVisitors = async (req, res) => {
    try {
        const { property_id } = req.query;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const where = {
            entry_time: {
                [Op.gte]: today,
                [Op.lt]: tomorrow
            }
        };
        
        if (property_id) {
            where.visited_property_id = property_id;
        }
        
        const visitors = await VisitorLog.findAll({
            where,
            include: [
                {
                    model: Property,
                    as: 'property',
                    attributes: ['id', 'name', 'location']
                },
                {
                    model: User,
                    as: 'guard',
                    attributes: ['id', 'first_name', 'last_name', 'email'],
                    foreignKey: 'logged_by'
                }
            ],
            order: [['entry_time', 'DESC']]
        });
        
        const activeCount = visitors.filter(v => v.status === 'active').length;
        const exitedCount = visitors.filter(v => v.status === 'exited').length;
        
        res.json({
            success: true,
            summary: {
                total: visitors.length,
                active: activeCount,
                exited: exitedCount
            },
            data: visitors
        });
    } catch (error) {
        console.error('Get today visitors error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get today\'s visitors'
        });
    }
};

// @desc    Get visitor history
// @route   GET /api/visitors/history
// @access  Private (Security Guard, Admin)
exports.getVisitorHistory = async (req, res) => {
    try {
        const { 
            start_date, 
            end_date, 
            property_id, 
            visitor_name,
            page = 1,
            limit = 20
        } = req.query;
        
        const where = {};
        
        // Date range filter
        if (start_date && end_date) {
            where.entry_time = {
                [Op.between]: [new Date(start_date), new Date(end_date)]
            };
        }
        
        // Property filter
        if (property_id) {
            where.visited_property_id = property_id;
        }
        
        // Visitor name search
        if (visitor_name) {
            where.visitor_name = { [Op.like]: `%${visitor_name}%` };
        }
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        const { count, rows } = await VisitorLog.findAndCountAll({
            where,
            include: [
                {
                    model: Property,
                    as: 'property',
                    attributes: ['id', 'name', 'location']
                },
                {
                    model: User,
                    as: 'guard',
                    attributes: ['id', 'first_name', 'last_name'],
                    foreignKey: 'logged_by'
                }
            ],
            order: [['entry_time', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });
        
        res.json({
            success: true,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            data: rows
        });
    } catch (error) {
        console.error('Get visitor history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get visitor history'
        });
    }
};

// @desc    Get visitor by ID
// @route   GET /api/visitors/:id
// @access  Private (Security Guard, Admin)
exports.getVisitorById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const visitor = await VisitorLog.findByPk(id, {
            include: [
                {
                    model: Property,
                    as: 'property',
                    attributes: ['id', 'name', 'location']
                },
                {
                    model: User,
                    as: 'guard',
                    attributes: ['id', 'first_name', 'last_name', 'email'],
                    foreignKey: 'logged_by'
                }
            ]
        });
        
        if (!visitor) {
            return res.status(404).json({
                success: false,
                message: 'Visitor log not found'
            });
        }
        
        res.json({
            success: true,
            data: visitor
        });
    } catch (error) {
        console.error('Get visitor by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get visitor details'
        });
    }
};

// @desc    Get visitors by property
// @route   GET /api/visitors/property/:propertyId
// @access  Private (Security Guard, Admin)
exports.getVisitorsByProperty = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { status, date } = req.query;
        
        const where = {
            visited_property_id: propertyId
        };
        
        if (status) {
            where.status = status;
        }
        
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            where.entry_time = {
                [Op.between]: [startDate, endDate]
            };
        }
        
        const visitors = await VisitorLog.findAll({
            where,
            include: [
                {
                    model: User,
                    as: 'guard',
                    attributes: ['id', 'first_name', 'last_name'],
                    foreignKey: 'logged_by'
                }
            ],
            order: [['entry_time', 'DESC']]
        });
        
        res.json({
            success: true,
            count: visitors.length,
            data: visitors
        });
    } catch (error) {
        console.error('Get visitors by property error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get visitors for property'
        });
    }
};

// @desc    Get dashboard statistics for security
// @route   GET /api/visitors/dashboard/stats
// @access  Private (Security Guard, Admin)
exports.getDashboardStats = async (req, res) => {
    try {
        const { sequelize } = require('../models');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Today's stats
        const todayVisitors = await VisitorLog.findAll({
            where: {
                entry_time: {
                    [Op.gte]: today,
                    [Op.lt]: tomorrow
                }
            }
        });
        
        const todayActive = todayVisitors.filter(v => v.status === 'active').length;
        const todayExited = todayVisitors.filter(v => v.status === 'exited').length;
        
        // Active visitors currently
        const activeVisitors = await VisitorLog.count({
            where: {
                status: 'active',
                exit_time: null
            }
        });
        
        // Last 7 days visitors - fix the query
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const weeklyVisitors = await VisitorLog.findAll({
            where: {
                entry_time: {
                    [Op.gte]: sevenDaysAgo
                }
            },
            attributes: [
                [sequelize.fn('DATE', sequelize.col('entry_time')), 'date'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: [sequelize.fn('DATE', sequelize.col('entry_time'))],
            order: [[sequelize.fn('DATE', sequelize.col('entry_time')), 'ASC']],
            raw: true
        });
        
        res.json({
            success: true,
            data: {
                today: {
                    total: todayVisitors.length,
                    active: todayActive,
                    exited: todayExited
                },
                currently_active: activeVisitors,
                weekly_trend: weeklyVisitors,
                total_this_month: 0
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get dashboard statistics',
            error: error.message
        });
    }
};