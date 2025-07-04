const Profile = require('../models/Profile');
const FollowRequest = require('../models/FollowRequest');
const sharp = require('sharp');
const path = require('path');
const AppError = require('../utils/AppError');
const redis = require('../services/redisService');

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
  }

  await profile.save();

  // Repopulate for cache consistency
  const populatedProfile = await Profile.findOne({ user: userId })
    .populate('user', 'username email')
    .populate('blockedUsers', 'username');

  await redis.set(`profile:${req.user._id}`, populatedProfile.toObject(), 1800);

  res.status(200).json({ message: 'Profile updated', profile: populatedProfile });
};

/**
 * @desc    Get the logged-in user's profile
 * @route   GET /api/profile/me
 * @access  Private
 */
exports.getMyProfile = async (req, res) => {
  const cacheKey = `profile:${req.user._id}`;

  try {
    // Try from Redis
    const cacheProfile = await redis.get(cacheKey);
    if (cacheProfile) {
      return res.status(200).json({
        success: true,
        profile: cacheProfile
      });
    }

    // Fallback to DB
    const profile = await Profile.findOne({ user: req.user._id })
      .populate('user', 'username email')
      .populate('blockedUsers', 'username');

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    // Convert to plain object before caching
    await redis.set(cacheKey, profile.toObject(), 1800);

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (err) {
    console.error('Error in getMyProfile:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


/**
 * @desc    Get another user's profile by user ID
 * @route   GET /api/profile/user/:id
 * @access  Private
 */
exports.getUserProfile = async (req, res) => {
  const viewerId = req.user._id;
  const targetUserId = req.params.userId;
  const cacheKey = `profile:${targetUserId}`;

  try {
    // 1. Load from Redis or DB
    let profile = await redisService.get(cacheKey);
    let source = 'cache';

    if (!profile) {
      // Fallback to DB
      const profileDoc = await Profile.findOne({ user: targetUserId })
        .populate('user', 'username email')
        .populate('blockedUsers', 'username')
        .lean(); // plain JS object

      if (!profileDoc) {
        return res.status(404).json({ success: false, message: 'Profile not found' });
      }

      profile = profileDoc;

      // Cache the full profile
      await redisService.set(cacheKey, profile, 1800); // 30 min
      source = 'db';
    }

    // 2. Check access
    const isOwner = viewerId === profile.user._id.toString();
    const isFollower = profile.followers?.some(
      (id) => id.toString() === viewerId
    );
    const hasAccess = !profile.isPrivate || isOwner || isFollower;

    // 3. Return limited or full profile
    if (!hasAccess) {
      return res.status(200).json({
        success: true,
        profile: {
          name: profile.name,
          avatar: profile.avatar,
          bio: profile.bio,
          isPrivate: true
        },
        source
      });
    }

    // 4. Return full profile
    return res.status(200).json({
      success: true,
      profile,
      source
    });

  } catch (err) {
    console.error('Error in getUserProfile:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};
