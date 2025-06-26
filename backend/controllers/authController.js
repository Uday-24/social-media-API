const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Profile = require('../models/Profile');

// JWT secrets and expiry durations
const ACCESS_SECRET = process.env.ACCESS_SECRET || 'access_secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh_secret';
const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES = '7d';

// Generate a short-lived access token
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
};

// Generate a long-lived refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
};

/**
 * @desc    Register user and create profile
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email or Username already exists' });
    }

    // Create user and profile (without transaction)
    const user = await User.create({ username, email, password });
    await Profile.create({ user: user._id });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

/**
 * @desc    Login user and return tokens
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }],
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

/**
 * @desc    Refresh access token using refresh token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }

    const payload = jwt.verify(token, REFRESH_SECRET);
    const user = await User.findById(payload.userId);

    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ success: false, message: 'Invalid refresh token' });
    }

    const newAccessToken = generateAccessToken(user._id);

    res.status(200).json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    console.error(error);
    res.status(403).json({ success: false, message: 'Token expired or invalid' });
  }
};

/**
 * @desc    Logout user and clear refresh token
 * @route   POST /api/auth/logout
 * @access  Public
 */
exports.logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
        return res.sendStatus(204); // No content
    } 

    const user = await User.findOne({ refreshToken: token });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'Strict',
      secure: process.env.NODE_ENV === 'production',
    });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error logging out' });
  }
};
