const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MaintenanceTicket = sequelize.define('MaintenanceTicket', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ticket_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
    },
    status: {
        type: DataTypes.ENUM('pending', 'assigned', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'pending'
    },
    category: {
        type: DataTypes.ENUM('plumbing', 'electrical', 'hvac', 'structural', 'appliance', 'furniture', 'cleaning', 'other'),
        defaultValue: 'other'
    },
    reported_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    unit_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'units', key: 'id' }
    },
    property_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'properties', key: 'id' }
    },
    assigned_to: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' }
    },
    scheduled_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    completed_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    estimated_cost: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    actual_cost: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    materials_used: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('materials_used');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('materials_used', JSON.stringify(value));
        }
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    resolution_notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    before_photos: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('before_photos');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('before_photos', JSON.stringify(value));
        }
    },
    after_photos: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('after_photos');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('after_photos', JSON.stringify(value));
        }
    },
    is_billed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    invoice_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'invoices', key: 'id' }
    }
}, {
    tableName: 'maintenance_tickets',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    indexes: [
        { fields: ['ticket_number'] },
        { fields: ['status'] },
        { fields: ['priority'] },
        { fields: ['reported_by'] },
        { fields: ['unit_id'] },
        { fields: ['property_id'] },
        { fields: ['assigned_to'] }
    ]
});

module.exports = MaintenanceTicket;