const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Inventory = sequelize.define('Inventory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    item_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    category: {
        type: DataTypes.ENUM('tools', 'materials', 'equipment', 'spare_parts', 'consumables', 'cleaning', 'safety'),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    unit: {
        type: DataTypes.ENUM('piece', 'meter', 'kilogram', 'liter', 'box', 'set', 'roll', 'pack'),
        defaultValue: 'piece'
    },
    current_stock: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    minimum_stock: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    reorder_level: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    unit_cost: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    selling_price: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    supplier: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    supplier_contact: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    location: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    expiry_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    last_restocked: {
        type: DataTypes.DATE,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'inventory',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    indexes: [
        { fields: ['item_code'] },
        { fields: ['name'] },
        { fields: ['category'] },
        { fields: ['current_stock'] }
    ]
});

module.exports = Inventory;