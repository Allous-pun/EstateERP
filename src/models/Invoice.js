// src/models/Invoice.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Invoice = sequelize.define('Invoice', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    invoice_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    tenancy_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    unit_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tenant_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    property_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    invoice_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    due_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    period_start: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    period_end: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    rent_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },
    additional_charges: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    penalty_amount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    total_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    amount_paid: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    balance_due: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    payment_status: {
        type: DataTypes.ENUM('pending', 'partially_paid', 'paid', 'overdue', 'cancelled'),
        defaultValue: 'pending'
    },
    last_payment_date: {
        type: DataTypes.DATEONLY
    },
    last_payment_amount: {
        type: DataTypes.DECIMAL(12, 2)
    },
    penalty_applied: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    penalty_applied_date: {
        type: DataTypes.DATEONLY
    },
    penalty_days_late: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    notes: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'invoices',
    timestamps: true,
    underscored: true
});

module.exports = Invoice;