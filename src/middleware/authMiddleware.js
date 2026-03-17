// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  // Handle "Bearer token" format
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ msg: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ msg: "Invalid or expired token" });
  }
};

// Remove the isAdmin function from here - it's in roleMiddleware.js
// exports.isAdmin = (req, res, next) => { ... }  // DELETE THIS