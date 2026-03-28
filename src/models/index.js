// src/models/index.js
const { sequelize } = require('../config/database');
const User = require('./User');
const Role = require('./Role');
const Property = require('./Property');
const Unit = require('./Unit');
const Tenancy = require('./Tenancy');
const Invoice = require('./Invoice');
const Payment = require('./Payment');
const InvoiceSettings = require('./InvoiceSettings');

// User - Role associations
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

// Property - Unit associations
Property.hasMany(Unit, { foreignKey: 'property_id', as: 'units' });
Unit.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });

// Unit - User (Tenant) associations
Unit.belongsTo(User, { foreignKey: 'current_tenant_id', as: 'tenant' });
User.hasMany(Unit, { foreignKey: 'current_tenant_id', as: 'rented_units' });

// Property - User (Creator) association
Property.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Property, { foreignKey: 'created_by', as: 'properties' });

// ============================================
// Phase 3: Tenancy Associations
// ============================================
Tenancy.belongsTo(User, { foreignKey: 'tenant_id', as: 'tenant' });
Tenancy.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
Tenancy.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });
User.hasMany(Tenancy, { foreignKey: 'tenant_id', as: 'tenancies' });
Unit.hasMany(Tenancy, { foreignKey: 'unit_id', as: 'tenancies' });
Property.hasMany(Tenancy, { foreignKey: 'property_id', as: 'tenancies' });

// ============================================
// Phase 4: Invoice & Payment Associations
// ============================================
Invoice.belongsTo(Tenancy, { foreignKey: 'tenancy_id', as: 'tenancy' });
Invoice.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
Invoice.belongsTo(User, { foreignKey: 'tenant_id', as: 'tenant' });
Invoice.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });
Invoice.hasMany(Payment, { foreignKey: 'invoice_id', as: 'payments' });

Payment.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });
Payment.belongsTo(User, { foreignKey: 'recorded_by', as: 'recorder' });

Tenancy.hasMany(Invoice, { foreignKey: 'tenancy_id', as: 'invoices' });

// InvoiceSettings associations
InvoiceSettings.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });
InvoiceSettings.belongsTo(User, { foreignKey: 'tenant_id', as: 'tenant' });

module.exports = {
    sequelize,
    User,
    Role,
    Property,
    Unit,
    Tenancy,
    Invoice,
    Payment,
    InvoiceSettings
};