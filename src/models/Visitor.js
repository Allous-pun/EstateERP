const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Visitor = sequelize.define('Visitor', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    full_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    id_number: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    purpose: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    property_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    unit_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    qr_token: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false
    },
    qr_expires_at: {
        type: DataTypes.DATE,
        allowNull: false
    },
    is_used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_blacklisted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    check_in_time: {
        type: DataTypes.DATE,
        allowNull: true
    },
    check_out_time: {
        type: DataTypes.DATE,
        allowNull: true
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'visitors',
    timestamps: false,  // Disable timestamps since table has only created_at
    underscored: true
});

module.exports = Visitor;
