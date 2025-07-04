const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Profile = require("../models/Profile");
const AppError = require("../utils/AppError");

// JWT configs
const ACCESS_SECRET = process.env.ACCESS_SECRET || "access_secret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refresh_secret";
const ACCESS_EXPIRES = "15m";
const REFRESH_EXPIRES = "7d";

// Token generators
const generateAccessToken = (userId) =>
  jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });

const generateRefreshToken = (userId) =>
  jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });

/**
 * @desc    Register user and create profile
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new AppError("All fields are required", 400);
  }

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    throw new AppError("Email or Username already exists", 400);
  }

  const user = await User.create({ username, email, password });
  await Profile.create({ user: user._id });

  res.status(201).json({
    success: true,
    message: "Registration successful",
    user: {
      userId: user._id,
      username: user.username,
    }
  });
};

/**
 * @desc    Login user and return tokens
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    throw new AppError("Identifier and password are required", 400);
  }

  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }],
  });

  if (!user) {
    throw new AppError("Invalid credentials", 400);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError("Invalid credentials", 400);
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
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
};

/**
 * @desc    Refresh access token using refresh token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
exports.refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    throw new AppError("No refresh token provided", 401);
  }

  let payload;
  try {
    payload = jwt.verify(token, REFRESH_SECRET);
  } catch (err) {
    throw new AppError("Invalid refresh token", 403);
  }

  const user = await User.findById(payload.userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Detect token reuse
  if (user.refreshToken !== token) {
    user.refreshToken = null;
    await user.save();
    throw new AppError("Token reuse detected", 403);
  }

  // Rotate tokens
  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save();

  // Set new refresh token in cookie
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json({ success: true, accessToken: newAccessToken });
};


/**
 * @desc    Logout user and clear refresh token
 * @route   POST /api/auth/logout
 * @access  Public
 */
exports.logout = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    return res.sendStatus(204); // No content
  }

  const user = await User.findOne({ refreshToken: token });

  if (user) {
    user.refreshToken = null;
    await user.save();
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "Strict",
    secure: process.env.NODE_ENV === "production",
  });

  res.status(200).json({ success: true, message: "Logged out successfully" });
};
