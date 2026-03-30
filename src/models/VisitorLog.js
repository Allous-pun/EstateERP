const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VisitorLog = sequelize.define('VisitorLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    visitor_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    visitor_phone: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    visitor_id_number: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    purpose: {
        type: DataTypes.ENUM('delivery', 'meeting', 'inspection', 'maintenance', 'rental_viewing', 'guest', 'other'),
        allowNull: false
    },
    purpose_description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
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
        allowNull: true
    },
    entry_time: {
        type: DataTypes.DATE,
        allowNull: false
    },
    exit_time: {
        type: DataTypes.DATE,
        allowNull: true
    },
    vehicle_plate: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    vehicle_make: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    logged_by: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'exited'),
        defaultValue: 'active'
    }
}, {
    tableName: 'visitor_logs',
    timestamps: true,
    underscored: true
});

module.exports = VisitorLog;
