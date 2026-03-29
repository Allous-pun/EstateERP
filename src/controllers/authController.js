// src/controllers/authController.js
const { User, Role } = require('../models');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Register user
exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, first_name, last_name, phone, role_id } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            email,
            password_hash: password, // Make sure you hash the password before saving
            first_name,
            last_name,
            phone,
            role_id
        });

        // Get role name
        const role = await Role.findByPk(role_id);

        res.status(201).json({
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: role.name,
            token: generateToken(user.id) // Use the newly created user's ID
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user with role
        const user = await User.findOne({ 
            where: { email },
            include: [{ model: Role, as: 'role' }]
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isValidPassword = await user.comparePassword(password);
        
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Update last login
        await user.update({ last_login: new Date() });

        res.json({
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role.name,
            token: generateToken(user.id)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Logout user
exports.logout = async (req, res) => {
    res.json({ message: 'Logged out successfully' });
};

// @desc    Get current user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
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

// @desc    Update profile
exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { first_name, last_name, phone, emergency_contact_name, emergency_contact_phone } = req.body;

        await user.update({
            first_name: first_name || user.first_name,
            last_name: last_name || user.last_name,
            phone: phone || user.phone,
            emergency_contact_name: emergency_contact_name || user.emergency_contact_name,
            emergency_contact_phone: emergency_contact_phone || user.emergency_contact_phone
        });

        res.json({
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Change password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isValidPassword = await user.comparePassword(currentPassword);
        
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        user.password_hash = newPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};