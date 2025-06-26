const Profile = require('../models/Profile');
const sharp = require('sharp');
const path = require('path');

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

// PUT /api/profile
exports.updateProfile = async (req, res, next) => {
  try {
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
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (req.file) {
      // Save avatar
      const avatarPath = await saveAvatar(req.file.buffer, userId);
      profile.avatar = avatarPath;
    }

    if (name !== undefined) {
        profile.name = name;
    }
    if (bio !== undefined) {
        profile.bio = bio;
    }
    if (location !== undefined) {
        profile.location = location;
    }
    if (isPrivate !== undefined) {
        profile.isPrivate = isPrivate;
    }
    if (interests !== undefined) {
        profile.interests = Array.isArray(interests) ? interests : interests.split(',');
    }
    if (gender !== undefined) {
        profile.gender = gender;
    }
    if (dob !== undefined) {
        profile.dob = new Date(dob);
    }

    await profile.save();

    res.status(200).json({ message: 'Profile updated', profile });
  } catch (error) {
    next(error);
  }
};

exports.getMyProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id })
      .populate('user', 'username email') // get username/email from User
      .populate('blockedUsers', 'username');

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    next(error);
  }
};