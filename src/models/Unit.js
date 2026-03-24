const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Unit = sequelize.define('Unit', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    unit_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Unit number is required' }
        }
    },
    building: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Building name is required' }
        }
    },
    floor: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: { args: [0], msg: 'Floor must be 0 or greater' }
        }
    },
    bedroom_count: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
            min: { args: [0], msg: 'Bedroom count must be 0 or greater' }
        }
    },
    bathroom_count: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
            min: { args: [0], msg: 'Bathroom count must be 0 or greater' }
        }
    },
    size_sqm: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
            min: { args: [0], msg: 'Size must be greater than 0' }
        }
    },
    rent_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: 'Rent price must be 0 or greater' }
        }
    },
    status: {
        type: DataTypes.ENUM('vacant', 'occupied', 'maintenance', 'reserved'),
        defaultValue: 'vacant'
    },
    property_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'properties',
            key: 'id'
        }
    },
    current_tenant_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    features: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('features');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('features', JSON.stringify(value));
        }
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'units',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Unit;