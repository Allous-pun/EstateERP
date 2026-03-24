const Role = require('../models/Role');

// Generic role checker
const hasRole = (roleNames) => {
    return async (req, res, next) => {
        try {
            // Check if user exists with role_id
            if (!req.user) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            // Check if user has role_id
            if (!req.user.role_id) {
                return res.status(403).json({ message: 'User role not found' });
            }

            // Get user role from database (or use the one attached by middleware)
            // Since we attached the full user with role, we can use req.user.role
            const userRole = req.user.role || await Role.findByPk(req.user.role_id);
            
            if (!userRole) {
                return res.status(403).json({ message: 'User role not found in database' });
            }

            // Debug log to see what's happening
            console.log('User Role:', userRole.name);
            console.log('Allowed Roles:', roleNames);

            // Check if user's role is allowed
            if (!roleNames.includes(userRole.name)) {
                return res.status(403).json({ 
                    message: `Access denied. Required role: ${roleNames.join(' or ')}. Your role: ${userRole.name}` 
                });
            }
            
            next();
        } catch (error) {
            console.error('Role middleware error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    };
};

// Generic checkRole function (alias for hasRole)
const checkRole = (roleNames) => {
    return hasRole(roleNames);
};

// Specific role middleware
exports.checkRole = checkRole;
exports.hasRole = hasRole;
exports.isAdmin = hasRole(['super_admin', 'admin']);
exports.isFinanceOfficer = hasRole(['finance_officer', 'super_admin', 'admin']);
exports.isFacilityManager = hasRole(['facility_manager', 'super_admin', 'admin']);
exports.isTechnician = hasRole(['technician', 'facility_manager', 'super_admin', 'admin']);
exports.isSecurityGuard = hasRole(['security_guard', 'super_admin', 'admin']);
exports.isTenant = hasRole(['tenant']);