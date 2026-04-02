const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StockLog = sequelize.define('StockLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    inventory_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'inventory', key: 'id' }
    },
    ticket_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'maintenance_tickets', key: 'id' }
    },
    transaction_type: {
        type: DataTypes.ENUM('restock', 'usage', 'adjustment', 'return', 'damaged'),
        allowNull: false
    },
    quantity: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            notNull: true
        }
    },
    quantity_before: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    quantity_after: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    unit_cost: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    total_cost: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        get() {
            const quantity = parseFloat(this.getDataValue('quantity'));
            const unitCost = parseFloat(this.getDataValue('unit_cost'));
            return quantity * unitCost;
        }
    },
    reference_number: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    performed_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'stock_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    indexes: [
        { fields: ['inventory_id'] },
        { fields: ['ticket_id'] },
        { fields: ['transaction_type'] },
        { fields: ['created_at'] }
    ]
});

module.exports = StockLog;