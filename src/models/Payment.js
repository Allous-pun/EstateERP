// src/models/Payment.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    invoice_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    payment_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    payment_method: {
        type: DataTypes.ENUM('cash', 'bank_transfer', 'mpesa', 'cheque', 'card'),
        allowNull: false
    },
    reference_number: {
        type: DataTypes.STRING(100)
    },
    notes: {
        type: DataTypes.TEXT
    },
    recorded_by: {
        type: DataTypes.INTEGER
    }
}, {
    tableName: 'payments',
    timestamps: true,
    underscored: true
});

module.exports = Payment;