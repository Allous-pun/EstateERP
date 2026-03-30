// src/controllers/visitorController.js
const { Op } = require('sequelize');
const { VisitorLog, Property, Unit, User, Visitor } = require('../models');
const QRService = require('../services/qrService');
const BlacklistService = require('../services/blacklistService');
const db = require('../config/db');

class VisitorController {
    // ============================================
    // PAUL'S QR CODE & BLACKLIST METHODS
    // ============================================

    // Create visitor with QR code
    static async createVisitor(req, res) {
        try {
            const { full_name, phone, id_number, purpose, property_id, unit_id } = req.body;
            
            if (!full_name || !phone) {
                return res.status(400).json({ error: 'Full name and phone are required' });
            }

            // Check if visitor is blacklisted
            const blacklistCheck = await BlacklistService.checkVisitor(phone, id_number);
            if (!blacklistCheck.allowed) {
                return res.status(403).json({
                    error: 'Access denied',
                    reason: blacklistCheck.reason,
                    expires_at: blacklistCheck.expires_at
                });
            }

            const visitor = await QRService.createVisitor({
                full_name,
                phone,
                id_number,
                purpose,
                property_id,
                unit_id,
                created_by: req.user.id
            });

            // Also log to VisitorLog table
            await VisitorLog.create({
                visitor_name: full_name,
                visitor_phone: phone,
                visitor_id_number: id_number,
                purpose: 'meeting',
                purpose_description: purpose,
                visited_property_id: property_id,
                visited_unit_number: unit_id ? String(unit_id) : null,
                entry_time: new Date(),
                logged_by: req.user.id,
                status: 'active'
            });

            res.status(201).json({
                success: true,
                data: visitor,
                message: 'Visitor registered successfully with QR code'
            });
        } catch (error) {
            console.error('Create visitor error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Validate QR and check-in
    static async validateQR(req, res) {
        try {
            const { qr_token } = req.params;
            
            const visitor = await QRService.validateQRToken(qr_token);
            
            const blacklistCheck = await BlacklistService.checkVisitor(
                visitor.phone, 
                visitor.id_number
            );
            
            if (!blacklistCheck.allowed) {
                return res.status(403).json({
                    error: 'Access denied',
                    reason: blacklistCheck.reason
                });
            }

            await QRService.useQRToken(qr_token);
            
            // Update VisitorLog
            await VisitorLog.update(
                { 
                    status: 'active',
                    entry_time: new Date()
                },
                { where: { visitor_name: visitor.full_name, status: 'pending' } }
            );
            
            res.json({
                success: true,
                data: visitor,
                message: 'Check-in successful'
            });
        } catch (error) {
            console.error('QR validation error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Check-out visitor
    static async checkout(req, res) {
        try {
            const { visitor_id } = req.params;
            
            // Use Sequelize to update the visitor
            const visitor = await Visitor.findByPk(visitor_id);
            
            if (!visitor) {
                return res.status(404).json({ error: 'Visitor not found' });
            }
            
            if (visitor.check_out_time) {
                return res.status(400).json({ error: 'Visitor already checked out' });
            }
            
            // Update check_out_time
            await visitor.update({
                check_out_time: new Date()
            });
            
            // Update VisitorLog
            await VisitorLog.update(
                { 
                    status: 'exited',
                    exit_time: new Date()
                },
                { where: { visitor_name: visitor.full_name, status: 'active' } }
            );
            
            res.json({
                success: true,
                message: 'Check-out successful'
            });
        } catch (error) {
            console.error('Checkout error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Regenerate QR code
    static async regenerateQR(req, res) {
        try {
            const { visitor_id } = req.params;
            const newQR = await QRService.regenerateQR(visitor_id);
            
            res.json({
                success: true,
                data: newQR,
                message: 'QR code regenerated successfully'
            });
        } catch (error) {
            console.error('Regenerate QR error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Get visitor logs (from QR system)
    static async getVisitorLogs(req, res) {
        try {
            const { property_id, date_from, date_to, page = 1, limit = 50 } = req.query;
            const offset = (page - 1) * limit;
            
            let query = `SELECT v.*, p.name as property_name, u.unit_number
                         FROM visitors v
                         LEFT JOIN properties p ON v.property_id = p.id
                         LEFT JOIN units u ON v.unit_id = u.id
                         WHERE 1=1`;
            const params = [];
            
            if (property_id) {
                query += ` AND v.property_id = ?`;
                params.push(property_id);
            }
            
            if (date_from) {
                query += ` AND v.created_at >= ?`;
                params.push(date_from);
            }
            
            if (date_to) {
                query += ` AND v.created_at <= ?`;
                params.push(date_to);
            }
            
            query += ` ORDER BY v.created_at DESC LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), parseInt(offset));
            
            const [rows] = await db.execute(query, params);
            
            const [total] = await db.execute(`SELECT COUNT(*) as total FROM visitors`, []);
            
            res.json({
                success: true,
                data: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total[0].total
                }
            });
        } catch (error) {
            console.error('Get visitor logs error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Get visitor by ID (from QR system)
    static async getVisitorById(req, res) {
        try {
            const { id } = req.params;
            
            const [rows] = await db.execute(
                `SELECT v.*, p.name as property_name, u.unit_number,
                        CONCAT(creator.first_name, ' ', creator.last_name) as created_by_name
                 FROM visitors v
                 LEFT JOIN properties p ON v.property_id = p.id
                 LEFT JOIN units u ON v.unit_id = u.id
                 LEFT JOIN users creator ON v.created_by = creator.id
                 WHERE v.id = ?`,
                [id]
            );
            
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Visitor not found' });
            }
            
            res.json({
                success: true,
                data: rows[0]
            });
        } catch (error) {
            console.error('Get visitor error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // ============================================
    // ENTRY/EXIT LOGGING METHODS (FIXED)
    // ============================================

    // @desc    Log visitor entry
    // @route   POST /api/visitors/entry
    // @access  Private (Security Guard only)
    static async logEntry(req, res) {
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
            } = req.body || {};

            if (!visitor_name || !visitor_phone || !purpose) {
                return res.status(400).json({
                    success: false,
                    message: 'Visitor name, phone, and purpose are required'
                });
            }

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
                message: 'Failed to log visitor entry',
                error: error.message
            });
        }
    }

    // @desc    Log visitor exit (FIXED - handles empty request body)
    // @route   PUT /api/visitors/:id/exit
    // @access  Private (Security Guard only)
    static async logExit(req, res) {
        try {
            const { id } = req.params;
            // FIXED: Safely get notes from request body (handle undefined)
            const notes = req.body?.notes;

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

            // Update with current timestamp
            const updateData = {
                exit_time: new Date(),
                status: 'exited'
            };

            // Only add notes if they exist
            if (notes) {
                updateData.notes = `${visitorLog.notes || ''}\nExit notes: ${notes}`.trim();
            }

            await visitorLog.update(updateData);

            res.json({
                success: true,
                message: 'Visitor exit logged successfully',
                data: visitorLog
            });
        } catch (error) {
            console.error('Log exit error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to log visitor exit',
                error: error.message
            });
        }
    }

    // @desc    Get active visitors (currently on property)
    // @route   GET /api/visitors/active
    // @access  Private (Security Guard, Admin)
    static async getActiveVisitors(req, res) {
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
    }

    // @desc    Get today's visitors
    // @route   GET /api/visitors/today
    // @access  Private (Security Guard, Admin)
    static async getTodayVisitors(req, res) {
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
    }

    // @desc    Get visitor history
    // @route   GET /api/visitors/history
    // @access  Private (Security Guard, Admin)
    static async getVisitorHistory(req, res) {
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
            
            if (start_date && end_date) {
                where.entry_time = {
                    [Op.between]: [new Date(start_date), new Date(end_date)]
                };
            }
            
            if (property_id) {
                where.visited_property_id = property_id;
            }
            
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
    }

    // @desc    Get visitors by property
    // @route   GET /api/visitors/property/:propertyId
    // @access  Private (Security Guard, Admin)
    static async getVisitorsByProperty(req, res) {
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
    }

    // @desc    Get dashboard statistics for security
    // @route   GET /api/visitors/dashboard/stats
    // @access  Private (Security Guard, Admin)
    static async getDashboardStats(req, res) {
        try {
            const { sequelize } = require('../models');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
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
            
            const activeVisitors = await VisitorLog.count({
                where: {
                    status: 'active',
                    exit_time: null
                }
            });
            
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
    }
}

module.exports = VisitorController;