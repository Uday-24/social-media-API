const crypto = require("crypto");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { sendEmail } = require("../utils/sendEmail");
const AppError = require("../utils/AppError");

// Forgot Password (Send Reset Link)
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save();

  const resetURL = `${process.env.CLIENT_URL}/reset-password/${token}`;
  const message = `Click this link to reset your password:\n\n${resetURL}\n\nThis link is valid for 15 minutes.`;

  await sendEmail(user.email, "Password Reset", message);

  res.status(200).json({ message: "Password reset link sent to email" });
};

// Reset Password (via token)
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!token) {
    throw new AppError("Token is required", 400);
  }
  if (!newPassword) {
    throw new AppError("New password is required", 400);
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError("Token is invalid or has expired", 400);
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ message: "Password reset successful" });
};