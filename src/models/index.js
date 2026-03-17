// src/models/index.js to handle model associations and exports
const User = require('./User');
const Role = require('./Role');

// Define associations
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

module.exports = {
    User,
    Role
};