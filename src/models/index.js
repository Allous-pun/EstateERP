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
const VisitorLog = require('./VisitorLog');
const Blacklist = require('./blacklist');
const Visitor = require('./Visitor');

// ============================================
// User - Role Associations (CRITICAL FOR LOGIN)
// ============================================
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

// ============================================
// Property - Unit Associations
// ============================================
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

// ============================================
// Phase 6: Visitor Log Associations
// ============================================
VisitorLog.belongsTo(Property, { foreignKey: 'visited_property_id', as: 'property' });
VisitorLog.belongsTo(User, { foreignKey: 'logged_by', as: 'guard' });
Property.hasMany(VisitorLog, { foreignKey: 'visited_property_id', as: 'visitor_logs' });
User.hasMany(VisitorLog, { foreignKey: 'logged_by', as: 'visitor_logs' });

// ============================================
// QR Visitor System Associations (Paul's)
// ============================================
Visitor.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });
Visitor.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
Visitor.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Property.hasMany(Visitor, { foreignKey: 'property_id', as: 'visitors' });
Unit.hasMany(Visitor, { foreignKey: 'unit_id', as: 'visitors' });
User.hasMany(Visitor, { foreignKey: 'created_by', as: 'created_visitors' });

// Blacklist associations
Blacklist.belongsTo(Visitor, { foreignKey: 'visitor_id', as: 'visitor' });
Blacklist.belongsTo(User, { foreignKey: 'added_by', as: 'addedBy' });
Visitor.hasOne(Blacklist, { foreignKey: 'visitor_id', as: 'blacklist_entry' });
User.hasMany(Blacklist, { foreignKey: 'added_by', as: 'blacklist_entries' });

module.exports = {
    sequelize,
    User,
    Role,
    Property,
    Unit,
    Tenancy,
    Invoice,
    Payment,
    InvoiceSettings,
    VisitorLog,
    Visitor,
    Blacklist
};