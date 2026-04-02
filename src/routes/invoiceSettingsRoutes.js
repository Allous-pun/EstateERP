// src/routes/invoiceSettingsRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');
const InvoiceSettings = require('../models/InvoiceSettings');

router.use(verifyToken);

// Get settings for property
router.get('/property/:propertyId', async (req, res) => {
    try {
        let settings = await InvoiceSettings.findOne({
            where: {
                property_id: req.params.propertyId,
                setting_type: 'property'
            }
        });
        
        if (!settings) {
            // Return defaults
            return res.json({
                success: true,
                data: {
                    billing_day: 1,
                    due_day: 5,
                    penalty_rate: 5,
                    penalty_type: 'percentage',
                    grace_period_days: 3
                }
            });
        }
        
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get settings'
        });
    }
});

// Update property settings (Admin only)
router.put('/property/:propertyId', checkRole(['super_admin', 'admin', 'finance_officer']), async (req, res) => {
    try {
        const { billing_day, due_day, penalty_rate, penalty_type, grace_period_days } = req.body;
        
        let settings = await InvoiceSettings.findOne({
            where: {
                property_id: req.params.propertyId,
                setting_type: 'property'
            }
        });
        
        if (settings) {
            await settings.update({
                billing_day,
                due_day,
                penalty_rate,
                penalty_type,
                grace_period_days
            });
        } else {
            settings = await InvoiceSettings.create({
                property_id: req.params.propertyId,
                setting_type: 'property',
                billing_day,
                due_day,
                penalty_rate,
                penalty_type,
                grace_period_days
            });
        }
        
        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: settings
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings'
        });
    }
});

module.exports = router;