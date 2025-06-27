const crypto = require("crypto");
const User = require("../models/User");
const { sendEmail } = require("../utils/sendEmail");
const AppError = require("../utils/AppError");

/**
 * @desc    Forgot password - send password reset link to email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  const { identifier } = req.body; // `identifier` can be email or username

  if (!identifier) {
    throw new AppError("Email or Username is required", 400);
  }

  // Try to find user by email or username (case-insensitive)
  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier.toLowerCase() }
    ]
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Generate reset token
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Save hashed token to DB with expiry
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save();

  const resetURL = `${process.env.CLIENT_URL}/reset-password/${token}`;
  const message = `Click this link to reset your password:\n\n${resetURL}\n\nThis link is valid for 15 minutes.`;

  await sendEmail(user.email, "Password Reset", message);

  res.status(200).json({ message: "Password reset link sent to email" });
};

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!token) {
    throw new AppError("Token is required", 400);
  }

  if (!newPassword) {
    throw new AppError("New password is required", 400);
  }

  // Hash the token and find matching user
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError("Token is invalid or has expired", 400);
  }

  // Set new password and clear reset fields
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ message: "Password reset successful" });
};
