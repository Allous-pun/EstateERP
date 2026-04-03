// src/controllers/dashboardController.js
const { Property, Unit, User, Tenancy, Invoice, MaintenanceTicket, VisitorLog, Inventory } = require('../models');
const { Op } = require('sequelize');

// @desc    Get admin dashboard statistics
// @route   GET /api/dashboard/admin
// @access  Private/Admin
exports.getAdminDashboard = async (req, res) => {
    try {
        // Properties
        const properties = await Property.findAll();
        const totalProperties = properties.length;

        // Tenants (users with role_id 7 - tenant role)
        const allUsers = await User.findAll();
        const totalTenants = allUsers.filter(u => u.role_id === 7).length;

        // Units
        const units = await Unit.findAll();
        const occupiedUnits = units.filter(u => u.status === 'occupied').length;
        const vacantUnits = units.filter(u => u.status === 'vacant').length;

        // Financial stats
        const invoices = await Invoice.findAll();
        const currentMonth = new Date().getMonth();
        const monthlyRevenue = invoices
            .filter(inv => new Date(inv.created_at).getMonth() === currentMonth)
            .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
        
        const outstandingPayments = invoices
            .filter(inv => inv.status !== 'paid')
            .reduce((sum, inv) => sum + (parseFloat(inv.balance) || 0), 0);

        // Maintenance tickets
        const tickets = await MaintenanceTicket.findAll();
        const openMaintenanceTickets = tickets.filter(t => t.status !== 'completed').length;

        // Monthly revenue data (last 6 months)
        const monthlyRevenueData = [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const today = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const monthIndex = (today.getMonth() - i + 12) % 12;
            const monthName = months[monthIndex];
            const monthRevenue = invoices
                .filter(inv => new Date(inv.created_at).getMonth() === monthIndex)
                .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
            monthlyRevenueData.push({ month: monthName, revenue: monthRevenue });
        }

        // Monthly maintenance data (last 6 months)
        const monthlyMaintenanceData = [];
        for (let i = 5; i >= 0; i--) {
            const monthIndex = (today.getMonth() - i + 12) % 12;
            const monthName = months[monthIndex];
            const monthRequests = tickets
                .filter(t => new Date(t.created_at).getMonth() === monthIndex)
                .length;
            monthlyMaintenanceData.push({ month: monthName, requests: monthRequests });
        }

        res.json({
            success: true,
            data: {
                stats: {
                    totalProperties,
                    totalTenants,
                    occupiedUnits,
                    vacantUnits,
                    monthlyRevenue,
                    outstandingPayments,
                    openMaintenanceTickets
                },
                revenueData: monthlyRevenueData,
                maintenanceData: monthlyMaintenanceData,
                occupancyData: [
                    { name: 'Occupied', value: occupiedUnits },
                    { name: 'Vacant', value: vacantUnits }
                ]
            }
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get finance dashboard statistics
// @route   GET /api/dashboard/finance
// @access  Private/Finance
exports.getFinanceDashboard = async (req, res) => {
    try {
        const invoices = await Invoice.findAll();
        
        const currentMonth = new Date().getMonth();
        const monthlyRevenue = invoices
            .filter(inv => new Date(inv.created_at).getMonth() === currentMonth)
            .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
        
        const outstandingPayments = invoices
            .filter(inv => inv.status !== 'paid')
            .reduce((sum, inv) => sum + (parseFloat(inv.balance) || 0), 0);
        
        const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
        const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;

        // Monthly revenue trend
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const today = new Date();
        const monthlyRevenueData = [];
        
        for (let i = 5; i >= 0; i--) {
            const monthIndex = (today.getMonth() - i + 12) % 12;
            const monthName = months[monthIndex];
            const monthRevenue = invoices
                .filter(inv => new Date(inv.created_at).getMonth() === monthIndex)
                .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
            monthlyRevenueData.push({ month: monthName, revenue: monthRevenue });
        }

        res.json({
            success: true,
            data: {
                stats: {
                    monthlyRevenue,
                    outstandingPayments,
                    paidInvoicesCount: paidInvoices,
                    overdueInvoicesCount: overdueInvoices
                },
                revenueData: monthlyRevenueData
            }
        });
    } catch (error) {
        console.error('Finance dashboard error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get facility manager dashboard statistics
// @route   GET /api/dashboard/facility
// @access  Private/FacilityManager
exports.getFacilityDashboard = async (req, res) => {
    try {
        const properties = await Property.findAll();
        const totalProperties = properties.length;

        const units = await Unit.findAll();
        const occupiedUnits = units.filter(u => u.status === 'occupied').length;
        const vacantUnits = units.filter(u => u.status === 'vacant').length;

        const tickets = await MaintenanceTicket.findAll();
        const openMaintenanceTickets = tickets.filter(t => t.status !== 'completed').length;

        // Monthly maintenance data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const today = new Date();
        const monthlyMaintenanceData = [];
        
        for (let i = 5; i >= 0; i--) {
            const monthIndex = (today.getMonth() - i + 12) % 12;
            const monthName = months[monthIndex];
            const monthRequests = tickets
                .filter(t => new Date(t.created_at).getMonth() === monthIndex)
                .length;
            monthlyMaintenanceData.push({ month: monthName, requests: monthRequests });
        }

        res.json({
            success: true,
            data: {
                stats: {
                    totalProperties,
                    occupiedUnits,
                    vacantUnits,
                    openMaintenanceTickets
                },
                maintenanceData: monthlyMaintenanceData,
                occupancyData: [
                    { name: 'Occupied', value: occupiedUnits },
                    { name: 'Vacant', value: vacantUnits }
                ]
            }
        });
    } catch (error) {
        console.error('Facility dashboard error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get technician dashboard statistics
// @route   GET /api/dashboard/technician
// @access  Private/Technician
exports.getTechnicianDashboard = async (req, res) => {
    try {
        const tickets = await MaintenanceTicket.findAll({
            where: { assigned_to: req.user.id }
        });
        
        const assignedTickets = tickets.filter(t => t.status === 'assigned').length;
        const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
        const completedThisMonth = tickets.filter(t => 
            t.status === 'completed' && 
            t.completed_date && 
            new Date(t.completed_date).getMonth() === new Date().getMonth()
        ).length;

        const inventory = await Inventory.findAll();
        const lowStockItems = inventory.filter(i => i.current_stock <= i.reorder_level).length;

        // Monthly completed tickets
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const today = new Date();
        const monthlyMaintenanceData = [];
        
        for (let i = 5; i >= 0; i--) {
            const monthIndex = (today.getMonth() - i + 12) % 12;
            const monthName = months[monthIndex];
            const monthRequests = tickets
                .filter(t => t.completed_date && new Date(t.completed_date).getMonth() === monthIndex)
                .length;
            monthlyMaintenanceData.push({ month: monthName, requests: monthRequests });
        }

        res.json({
            success: true,
            data: {
                stats: {
                    assignedTickets,
                    inProgressTickets,
                    completedThisMonth,
                    lowStockItems
                },
                maintenanceData: monthlyMaintenanceData
            }
        });
    } catch (error) {
        console.error('Technician dashboard error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get security guard dashboard statistics
// @route   GET /api/dashboard/security
// @access  Private/SecurityGuard
exports.getSecurityDashboard = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayVisitors = await VisitorLog.findAll({
            where: {
                entry_time: { [Op.gte]: today, [Op.lt]: tomorrow }
            }
        });
        
        const visitorsToday = todayVisitors.length;
        const activeVisitors = todayVisitors.filter(v => v.status === 'active').length;

        // Weekly visitors
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weeklyVisitors = await VisitorLog.count({
            where: { entry_time: { [Op.gte]: weekAgo } }
        });

        res.json({
            success: true,
            data: {
                stats: {
                    visitorsToday,
                    activeVisitors,
                    weeklyVisitors
                }
            }
        });
    } catch (error) {
        console.error('Security dashboard error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get tenant dashboard statistics
// @route   GET /api/dashboard/tenant
// @access  Private/Tenant
exports.getTenantDashboard = async (req, res) => {
    try {
        const tenancy = await Tenancy.findOne({
            where: { tenant_id: req.user.id, status: 'active' },
            include: [{ model: Unit, as: 'unit' }]
        });

        let myUnit = 'Not assigned';
        let rentDue = 0;
        let openRequests = 0;

        if (tenancy && tenancy.unit) {
            myUnit = tenancy.unit.unit_number || 'Not assigned';
            rentDue = tenancy.rent_amount || 0;
            
            const tickets = await MaintenanceTicket.findAll({
                where: { unit_id: tenancy.unit_id, status: { [Op.ne]: 'completed' } }
            });
            openRequests = tickets.length;
        }

        res.json({
            success: true,
            data: {
                stats: {
                    myUnit,
                    rentDue,
                    openRequests
                }
            }
        });
    } catch (error) {
        console.error('Tenant dashboard error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};