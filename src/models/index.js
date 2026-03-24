// src/models/index.js
const User = require('./User');
const Role = require('./Role');
const Property = require('./Property');
const Unit = require('./Unit');

// Define associations

// User - Role associations
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

// Property - Unit associations
Property.hasMany(Unit, { foreignKey: 'property_id', as: 'units' });
Unit.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });

// Unit - User (Tenant) associations
Unit.belongsTo(User, { foreignKey: 'current_tenant_id', as: 'tenant' });
User.hasMany(Unit, { foreignKey: 'current_tenant_id', as: 'rented_units' });

module.exports = {
    User,
    Role,
    Property,
    Unit
};