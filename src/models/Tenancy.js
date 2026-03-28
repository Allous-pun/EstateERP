const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tenancy = sequelize.define('Tenancy', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    
    // Relationships
    tenant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        validate: {
            notNull: { msg: 'Tenant ID is required' }
        }
    },
    unit_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'units', key: 'id' },
        validate: {
            notNull: { msg: 'Unit ID is required' }
        }
    },
    property_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'properties', key: 'id' }
    },
    
    // Tenancy Dates
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notNull: { msg: 'Start date is required' }
        }
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
            isAfterStartDate(value) {
                if (value && this.start_date && new Date(value) <= new Date(this.start_date)) {
                    throw new Error('End date must be after start date');
                }
            }
        }
    },
    actual_move_out_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    
    // Rent Details
    rent_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            min: { args: [0], msg: 'Rent amount must be positive' }
        }
    },
    deposit_amount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    deposit_paid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    deposit_refunded: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    
    // Payment Schedule
    payment_cycle: {
        type: DataTypes.ENUM('monthly', 'quarterly', 'semi_annual', 'annual'),
        defaultValue: 'monthly'
    },
    payment_due_day: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
            min: 1,
            max: 28
        }
    },
    
    // Status
    status: {
        type: DataTypes.ENUM('active', 'terminated', 'expired', 'pending'),
        defaultValue: 'pending',
        validate: {
            isIn: {
                args: [['active', 'terminated', 'expired', 'pending']],
                msg: 'Invalid status'
            }
        }
    },
    
    // Lease Agreement
    lease_agreement_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'URL to uploaded lease agreement document'
    },
    lease_agreement_filename: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    lease_agreement_uploaded_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lease_terms: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Additional lease terms and conditions'
    },
    
    // Move-in/Move-out
    move_in_notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    move_out_notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    move_inspection_report_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    move_out_inspection_report_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    
    // Auto-renewal
    auto_renew: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    
    // Termination
    terminated_by: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    termination_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    terminated_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'tenancies',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    indexes: [
        { fields: ['tenant_id'] },
        { fields: ['unit_id'] },
        { fields: ['property_id'] },
        { fields: ['status'] },
        { fields: ['start_date'] },
        { fields: ['end_date'] }
    ]
});

module.exports = Tenancy;