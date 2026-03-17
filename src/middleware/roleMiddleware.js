const Role = require('../models/Role');

// Generic role checker
const hasRole = (roleNames) => {
    return async (req, res, next) => {
        try {
            const userRole = await Role.findByPk(req.user.role_id);
            
            if (!userRole || !roleNames.includes(userRole.name)) {
                return res.status(403).json({ 
                    message: `Access denied. Required role: ${roleNames.join(' or ')}` 
                });
            }
            next();
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    };
};

// Specific role middleware
exports.isAdmin = hasRole(['super_admin', 'admin']);
exports.isFinanceOfficer = hasRole(['finance_officer', 'super_admin', 'admin']);
exports.isFacilityManager = hasRole(['facility_manager', 'super_admin', 'admin']);
exports.isTechnician = hasRole(['technician', 'facility_manager', 'super_admin', 'admin']);
exports.isSecurityGuard = hasRole(['security_guard', 'super_admin', 'admin']);
exports.isTenant = hasRole(['tenant']);