// src/models/InvoiceSettings.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InvoiceSettings = sequelize.define('InvoiceSettings', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    property_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    tenant_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    billing_day: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    due_day: {
        type: DataTypes.INTEGER,
        defaultValue: 5
    },
    penalty_rate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 5.00
    },
    penalty_type: {
        type: DataTypes.ENUM('percentage', 'fixed'),
        defaultValue: 'percentage'
    },
    grace_period_days: {
        type: DataTypes.INTEGER,
        defaultValue: 3
    },
    setting_type: {
        type: DataTypes.ENUM('property', 'tenant'),
        defaultValue: 'property'
    }
}, {
    tableName: 'invoice_settings',
    timestamps: true,
    underscored: true
});

module.exports = InvoiceSettings;