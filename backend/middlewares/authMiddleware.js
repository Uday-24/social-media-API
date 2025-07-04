const jwt = require('jsonwebtoken');
const User = require('../models/User');

const ACCESS_SECRET = process.env.ACCESS_SECRET || 'access_secret';

/**
 * @desc    Middleware to protect routes (JWT auth)
 * @usage   Add to any route you want to secure
 */
const protect = async (req, res, next) => {
  try {
    // Get token from Authorization header: "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, ACCESS_SECRET);

    // Attach user to request object
    const user = await User.findById(decoded.userId).select('-password -refreshToken');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role
    };


    next(); // continue to route/controller
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ success: false, message: 'Unauthorized or token expired' });
  }
};

module.exports = protect;
