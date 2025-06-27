const Profile = require('../models/Profile');
const FollowRequest = require('../models/FollowRequest');
const sharp = require('sharp');
const path = require('path');
const AppError = require('../utils/AppError');

// Helper to save avatar image
const saveAvatar = async (buffer, userId) => {
  const filename = `avatar-${userId}-${Date.now()}.jpeg`;
  const filePath = path.join(__dirname, '..', 'uploads', filename);

  await sharp(buffer)
    .resize(300, 300)
    .jpeg({ quality: 90 })
    .toFile(filePath);

  return `/uploads/${filename}`;
};

/**
 * @desc    Update logged-in user's profile
 * @route   PUT /api/profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  const userId = req.user._id;

  const {
    name,
    bio,
    location,
    isPrivate,
    interests,
    gender,
    dob,
  } = req.body;

  const profile = await Profile.findOne({ user: userId });
  if (!profile) {
    throw new AppError('Profile not found', 404);
  }

  const wasPrivate = profile.isPrivate;

  // Update fields
  if (req.file) {
    const avatarPath = await saveAvatar(req.file.buffer, userId);
    profile.avatar = avatarPath;
  }
  if (name !== undefined) profile.name = name;
  if (bio !== undefined) profile.bio = bio;
  if (location !== undefined) profile.location = location;
  if (isPrivate !== undefined) profile.isPrivate = isPrivate;
  if (interests !== undefined)
    profile.interests = Array.isArray(interests) ? interests : interests.split(',');
  if (gender !== undefined) profile.gender = gender;
  if (dob !== undefined) profile.dob = new Date(dob);

  await profile.save();

  // Auto-accept follow requests if changing from private to public
  if (wasPrivate && isPrivate === false) {
    const pendingRequests = await FollowRequest.find({
      to: userId,
      status: 'pending',
    });

    for (const request of pendingRequests) {
      const followerProfile = await Profile.findOne({ user: request.from });

      if (followerProfile && !followerProfile.following.includes(userId)) {
        followerProfile.following.push(userId);
        followerProfile.followingCount++;
        await followerProfile.save();
      }

      if (!profile.followers.includes(request.from)) {
        profile.followers.push(request.from);
        profile.followersCount++;
      }

      request.status = 'accepted';
      await request.save();
    }

    await profile.save();
  }

  res.status(200).json({ message: 'Profile updated', profile });
};

/**
 * @desc    Get the logged-in user's profile
 * @route   GET /api/profile/me
 * @access  Private
 */
exports.getMyProfile = async (req, res) => {
  const profile = await Profile.findOne({ user: req.user._id })
    .populate('user', 'username email')
    .populate('blockedUsers', 'username');

  if (!profile) {
    throw new AppError('Profile not found', 404);
  }

  res.status(200).json({
    success: true,
    profile,
  });
};