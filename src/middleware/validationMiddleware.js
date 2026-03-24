const { body, validationResult } = require('express-validator');

// Validation rules for Property
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
    
    body('total_units')
        .optional()
        .isInt({ min: 0 }).withMessage('Total units must be a positive number'),
    
    body('building_type')
        .optional()
        .isIn(['apartment', 'commercial', 'residential', 'mixed']).withMessage('Invalid building type'),
    
    body('is_active')
        .optional()
        .isBoolean().withMessage('is_active must be true or false')
];

// Validation rules for Unit
const validateUnit = [
    body('unit_number')
        .trim()
        .notEmpty().withMessage('Unit number is required')
        .isLength({ min: 1, max: 50 }).withMessage('Unit number must be between 1 and 50 characters'),
    
    body('building')
        .trim()
        .notEmpty().withMessage('Building name is required')
        .isLength({ min: 1, max: 100 }).withMessage('Building name must be between 1 and 100 characters'),
    
    body('floor')
        .optional()
        .isInt({ min: 0 }).withMessage('Floor must be 0 or greater'),
    
    body('bedroom_count')
        .optional()
        .isInt({ min: 0 }).withMessage('Bedroom count must be 0 or greater'),
    
    body('bathroom_count')
        .optional()
        .isInt({ min: 0 }).withMessage('Bathroom count must be 0 or greater'),
    
    body('size_sqm')
        .optional()
        .isFloat({ min: 0 }).withMessage('Size must be a positive number'),
    
    body('rent_price')
        .notEmpty().withMessage('Rent price is required')
        .isFloat({ min: 0 }).withMessage('Rent price must be a positive number'),
    
    body('status')
        .optional()
        .isIn(['vacant', 'occupied', 'maintenance', 'reserved']).withMessage('Invalid status'),
    
    body('property_id')
        .notEmpty().withMessage('Property ID is required')
        .isInt({ min: 1 }).withMessage('Property ID must be a valid number'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    
    body('is_active')
        .optional()
        .isBoolean().withMessage('is_active must be true or false')
];

// Validation result handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

module.exports = {
    validateProperty,
    validateUnit,
    handleValidationErrors
};