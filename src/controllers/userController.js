// src/controllers/userController.js
const User = require('../models/User');
const Role = require('../models/Role');

// @desc    Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password_hash'] },
            include: [{ model: Role, as: 'role', attributes: ['name'] }]
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user by ID (Admin only)
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password_hash'] },
            include: [{ model: Role, as: 'role', attributes: ['name'] }]
        });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create user (Admin only)
exports.createUser = async (req, res) => {
    try {
        const { email, password, first_name, last_name, phone, role_id } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            email,
            password_hash: password,
            first_name,
            last_name,
            phone,
            role_id
        });

        res.status(201).json({
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            message: 'User created successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update user (Admin only)
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { first_name, last_name, phone, role_id, is_active } = req.body;

        await user.update({
            first_name: first_name || user.first_name,
            last_name: last_name || user.last_name,
            phone: phone || user.phone,
            role_id: role_id || user.role_id,
            is_active: is_active !== undefined ? is_active : user.is_active
        });

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete user (Admin only)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================
// NEW: Get technicians (for Facility Manager)
// ============================================

// @desc    Get all technicians (users with role_id = 5)
// @route   GET /api/users/technicians
// @access  Private/Admin, Facility Manager
exports.getTechnicians = async (req, res) => {
    try {
        const technicians = await User.findAll({
            where: {
                role_id: 5,
                is_active: true
            },
            attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
            include: [
                {
                    model: Role,
                    as: 'role',
                    attributes: ['name']
                }
            ],
            order: [['first_name', 'ASC']]
        });
        
        res.json({
            success: true,
            data: technicians
        });
    } catch (error) {
        console.error('Get technicians error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};