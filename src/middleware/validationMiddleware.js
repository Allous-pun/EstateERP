const { body, validationResult, param, query } = require('express-validator');

// ============================================
// USER VALIDATION RULES
// ============================================

const validateUser = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail()
        .isLength({ max: 100 }).withMessage('Email cannot exceed 100 characters'),
    
    body('password')
        .optional()
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
    
    body('first_name')
        .trim()
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/).withMessage('First name can only contain letters and spaces'),
    
    body('last_name')
        .trim()
        .notEmpty().withMessage('Last name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/).withMessage('Last name can only contain letters and spaces'),
    
    body('phone')
        .optional()
        .trim()
        .matches(/^[0-9+\-\s()]+$/).withMessage('Please provide a valid phone number')
        .isLength({ min: 10, max: 20 }).withMessage('Phone number must be between 10 and 20 characters'),
    
    body('id_number')
        .optional()
        .trim()
        .isLength({ min: 5, max: 20 }).withMessage('ID number must be between 5 and 20 characters'),
    
    body('role_id')
        .optional()
        .isInt({ min: 1 }).withMessage('Role ID must be a valid number'),
    
    body('is_active')
        .optional()
        .isBoolean().withMessage('is_active must be true or false'),
    
    body('emergency_contact_name')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Emergency contact name cannot exceed 100 characters'),
    
    body('emergency_contact_phone')
        .optional()
        .trim()
        .matches(/^[0-9+\-\s()]+$/).withMessage('Please provide a valid emergency contact phone number'),
    
    body('occupation')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Occupation cannot exceed 100 characters'),
    
    body('employee_id')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Employee ID cannot exceed 50 characters'),
    
    body('department')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Department cannot exceed 50 characters'),
    
    body('hire_date')
        .optional()
        .isISO8601().withMessage('Hire date must be a valid date')
        .toDate()
];

// ============================================
// LOGIN VALIDATION RULES
// ============================================

const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password is required')
];

// ============================================
// ROLE VALIDATION RULES
// ============================================

const validateRole = [
    body('name')
        .trim()
        .notEmpty().withMessage('Role name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Role name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z_]+$/).withMessage('Role name can only contain letters and underscores'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
];

// ============================================
// PROPERTY VALIDATION RULES
// ============================================

const validateProperty = [
    body('name')
        .trim()
        .notEmpty().withMessage('Property name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Property name must be between 2 and 100 characters'),
    
    body('location')
        .trim()
        .notEmpty().withMessage('Location is required')
        .isLength({ min: 3, max: 255 }).withMessage('Location must be between 3 and 255 characters'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    
    body('created_by')
        .optional()
        .isInt({ min: 1 }).withMessage('Created by must be a valid user ID')
];

// ============================================
// UNIT VALIDATION RULES
// ============================================

const validateUnit = [
    body('unit_number')
        .trim()
        .notEmpty().withMessage('Unit number is required')
        .isLength({ min: 1, max: 50 }).withMessage('Unit number must be between 1 and 50 characters')
        .matches(/^[a-zA-Z0-9\-\/]+$/).withMessage('Unit number can only contain letters, numbers, hyphens, and slashes'),
    
    body('building')
        .trim()
        .notEmpty().withMessage('Building name is required')
        .isLength({ min: 1, max: 100 }).withMessage('Building name must be between 1 and 100 characters'),
    
    body('floor')
        .optional()
        .isInt({ min: 0 }).withMessage('Floor must be 0 or greater')
        .toInt(),
    
    body('bedroom_count')
        .optional()
        .isInt({ min: 0, max: 10 }).withMessage('Bedroom count must be between 0 and 10')
        .toInt(),
    
    body('bathroom_count')
        .optional()
        .isInt({ min: 0, max: 10 }).withMessage('Bathroom count must be between 0 and 10')
        .toInt(),
    
    body('size_sqm')
        .optional()
        .isFloat({ min: 0, max: 10000 }).withMessage('Size must be between 0 and 10000 square meters')
        .toFloat(),
    
    body('rent_price')
        .notEmpty().withMessage('Rent price is required')
        .isFloat({ min: 0, max: 1000000 }).withMessage('Rent price must be between 0 and 1,000,000')
        .toFloat(),
    
    body('status')
        .optional()
        .isIn(['vacant', 'occupied', 'maintenance', 'reserved']).withMessage('Invalid status. Must be one of: vacant, occupied, maintenance, reserved'),
    
    body('property_id')
        .notEmpty().withMessage('Property ID is required')
        .isInt({ min: 1 }).withMessage('Property ID must be a valid number')
        .toInt(),
    
    body('current_tenant_id')
        .optional()
        .isInt({ min: 1 }).withMessage('Tenant ID must be a valid number')
        .toInt(),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    
    body('features')
        .optional()
        .isArray().withMessage('Features must be an array'),
    
    body('is_active')
        .optional()
        .isBoolean().withMessage('is_active must be true or false')
        .toBoolean()
];

// ============================================
// AUTH VALIDATION RULES
// ============================================

const validateRegistration = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
    
    body('first_name')
        .trim()
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
    
    body('last_name')
        .trim()
        .notEmpty().withMessage('Last name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
    
    body('phone')
        .optional()
        .trim()
        .matches(/^[0-9+\-\s()]+$/).withMessage('Please provide a valid phone number')
];

const validatePasswordReset = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail()
];

const validatePasswordUpdate = [
    body('current_password')
        .notEmpty().withMessage('Current password is required'),
    
    body('new_password')
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('New password must contain at least one letter and one number'),
    
    body('confirm_password')
        .custom((value, { req }) => {
            if (value !== req.body.new_password) {
                throw new Error('Password confirmation does not match');
            }
            return true;
        })
];

// ============================================
// PARAMETER VALIDATION
// ============================================

const validateIdParam = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID must be a valid positive integer')
        .toInt()
];

const validatePropertyIdParam = [
    param('propertyId')
        .isInt({ min: 1 }).withMessage('Property ID must be a valid positive integer')
        .toInt()
];

// ============================================
// QUERY VALIDATION
// ============================================

const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer')
        .toInt(),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
        .toInt()
];

const validateUnitFilters = [
    query('property_id')
        .optional()
        .isInt({ min: 1 }).withMessage('Property ID must be a valid number')
        .toInt(),
    
    query('status')
        .optional()
        .isIn(['vacant', 'occupied', 'maintenance', 'reserved']).withMessage('Invalid status'),
    
    query('building')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Building name too long')
];

const validatePropertyFilters = [
    query('search')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Search term too long'),
    
    query('location')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('Location filter too long'),
    
    query('min_units')
        .optional()
        .isInt({ min: 0 }).withMessage('Minimum units must be a positive number')
        .toInt(),
    
    query('max_units')
        .optional()
        .isInt({ min: 0 }).withMessage('Maximum units must be a positive number')
        .toInt(),
    
    query('has_vacant_units')
        .optional()
        .isBoolean().withMessage('has_vacant_units must be true or false')
        .toBoolean()
];

// ============================================
// VALIDATION RESULT HANDLER
// ============================================

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        // Group errors by field
        const groupedErrors = {};
        errors.array().forEach(err => {
            if (!groupedErrors[err.path]) {
                groupedErrors[err.path] = [];
            }
            groupedErrors[err.path].push(err.msg);
        });
        
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: groupedErrors,
            errorList: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                value: err.value
            }))
        });
    }
    
    next();
};

// ============================================
// CONDITIONAL VALIDATION HELPERS
// ============================================

const validateIfPresent = (validators) => {
    return [
        body().custom((value, { req }) => {
            // This is a placeholder for conditional validation
            // You can use this to apply validators only if field exists
            return true;
        })
    ];
};

// ============================================
// CUSTOM VALIDATORS
// ============================================

const isUnique = (model, field, message) => {
    return async (value, { req }) => {
        if (!value) return true;
        
        const where = { [field]: value };
        
        // If updating, exclude current record
        if (req.params.id) {
            where.id = { [Op.ne]: req.params.id };
        }
        
        const existing = await model.findOne({ where });
        if (existing) {
            throw new Error(message || `${field} already exists`);
        }
        
        return true;
    };
};

const isValidDateRange = (startDateField, endDateField) => {
    return (value, { req }) => {
        const startDate = req.body[startDateField];
        const endDate = req.body[endDateField];
        
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            throw new Error(`${startDateField} must be before ${endDateField}`);
        }
        
        return true;
    };
};

// ============================================
// EXPORT ALL VALIDATION RULES
// ============================================

module.exports = {
    // User validations
    validateUser,
    validateLogin,
    validateRegistration,
    
    // Role validations
    validateRole,
    
    // Property validations
    validateProperty,
    validatePropertyFilters,
    
    // Unit validations
    validateUnit,
    validateUnitFilters,
    
    // Auth validations
    validatePasswordReset,
    validatePasswordUpdate,
    
    // Parameter validations
    validateIdParam,
    validatePropertyIdParam,
    
    // Query validations
    validatePagination,
    
    // Handler
    handleValidationErrors,
    
    // Custom validators
    isUnique,
    isValidDateRange
};