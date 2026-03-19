// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { User } = require('../models'); // Add this import

exports.verifyToken = async (req, res, next) => {
  // Handle "Bearer token" format
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ msg: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch the user from database to get role_id
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'email', 'first_name', 'last_name', 'role_id'] // Include role_id
    });

    if (!user) {
      return res.status(401).json({ msg: "User not found" });
    }

    // Attach full user data to req.user
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ msg: "Invalid or expired token" });
  }
};