const { User } = require('../models');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/emailService');
const getResetTemplate = require('../utils/emailTemplate');
const { Op } = require('sequelize');

// @desc    Forgot password - send reset email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Save token to database (expires in 1 hour)
    user.reset_token = resetToken;
    user.reset_token_expiry = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Create reset link
    const resetLink = `http://localhost:3000/reset-password/${resetToken}`; // Change URL for production

    // Send email
    await sendEmail(
      user.email,
      'Password Reset Request - EstateERP',
      getResetTemplate(resetLink)
    );

    res.json({ 
      message: 'Password reset email sent successfully' 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reset password with token
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters' 
      });
    }

    // Find user with valid token
    const user = await User.findOne({
      where: {
        reset_token: token,
        reset_token_expiry: { [Op.gt]: new Date() } // token not expired
      }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired reset token' 
      });
    }

    // Update password (will be hashed by model hook)
    user.password_hash = password;
    user.reset_token = null;
    user.reset_token_expiry = null;
    await user.save();

    res.json({ 
      message: 'Password reset successful. You can now login with your new password.' 
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};