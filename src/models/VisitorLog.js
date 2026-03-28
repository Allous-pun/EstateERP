// src/models/VisitorLog.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VisitorLog = sequelize.define('VisitorLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    
    // Visitor Information
    visitor_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notNull: { msg: 'Visitor name is required' }
        }
    },
    visitor_phone: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    visitor_id_number: {
        type: DataTypes.STRING(50),
        comment: 'National ID or Passport number'
    },
    
    // Visit Details
    purpose: {
        type: DataTypes.ENUM('delivery', 'meeting', 'inspection', 'maintenance', 'rental_viewing', 'guest', 'other'),
        allowNull: false
    },
    purpose_description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    
    // Who they are visiting
    visited_tenant_name: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    visited_unit_number: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    visited_property_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'properties', key: 'id' }
    },
    
    // Entry/Exit Tracking
    entry_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    exit_time: {
        type: DataTypes.DATE,
        allowNull: true
    },
    
    // Vehicle Information (optional)
    vehicle_plate: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    vehicle_make: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    
    // Security Guard Information
    logged_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        comment: 'Security guard who logged this entry'
    },
    
    // Additional Notes
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    
    // Status
    status: {
        type: DataTypes.ENUM('active', 'exited'),
        defaultValue: 'active'
    }
}, {
    tableName: 'visitor_logs',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['entry_time'] },
        { fields: ['exit_time'] },
        { fields: ['status'] },
        { fields: ['visited_property_id'] },
        { fields: ['logged_by'] }
    ]
});

module.exports = VisitorLog;