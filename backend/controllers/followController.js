const Profile = require('../models/Profile');
const FollowRequest = require('../models/FollowRequest');
const AppError = require('../utils/AppError');

/**
 * @desc    Follow a user (or send follow request if user is private)
 * @route   POST /api/follow/:id
 * @access  Private
 */
exports.followUser = async (req, res) => {
  const fromUserId = req.user._id; // from token
  const toUserId = req.params.id;

  if (fromUserId === toUserId) {
    return res.status(400).json({ message: "You can't follow yourself" });
  }

  const fromProfile = await Profile.findOne({ user: fromUserId });
  const toProfile = await Profile.findOne({ user: toUserId });

  if (!toProfile) {
    return res.status(404).json({ message: 'User to follow not found' });
  }

  const isAlreadyFollowing = fromProfile.following.includes(toUserId);
  if (isAlreadyFollowing) {
    return res.status(400).json({ message: 'Already following this user' });
  }

  if (toProfile.isPrivate) {
    // Send follow request
    const existingRequest = await FollowRequest.findOne({
      from: fromUserId,
      to: toUserId,
      status: 'pending',
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Follow request already sent' });
    }

    await FollowRequest.create({ from: fromUserId, to: toUserId });
    return res.status(200).json({ message: 'Follow request sent' });
  } else {
    // Directly follow
    fromProfile.following.push(toUserId);
    toProfile.followers.push(fromUserId);

    fromProfile.followingCount++;
    toProfile.followersCount++;

    await fromProfile.save();
    await toProfile.save();

    return res.status(200).json({ message: 'Followed successfully' });
  }
};

/**
 * @desc    Unfollow a user
 * @route   POST /api/follow/:id
 * @access  Private
 */
exports.unfollowUser = async (req, res) => {
  const fromUserId = req.user._id;
  const toUserId = req.params.id;

  // Check if trying to unfollow self
  if (fromUserId.toString() === toUserId) {
    throw new AppError("You can't unfollow yourself", 400);
  }

  const [fromProfile, toProfile] = await Promise.all([
    Profile.findOne({ user: fromUserId }),
    Profile.findOne({ user: toUserId }),
  ]);

  if (!fromProfile || !toProfile) {
    throw new AppError('Profile not found', 404);
  }

  const isFollowing = fromProfile.following.includes(toUserId);
  if (!isFollowing) {
    throw new AppError('You are not following this user', 400);
  }

  // Remove from following/followers
  fromProfile.following = fromProfile.following.filter(
    (uid) => uid.toString() !== toUserId
  );
  toProfile.followers = toProfile.followers.filter(
    (uid) => uid.toString() !== fromUserId
  );

  // Update counts safely
  fromProfile.followingCount = Math.max(fromProfile.followingCount - 1, 0);
  toProfile.followersCount = Math.max(toProfile.followersCount - 1, 0);

  await Promise.all([fromProfile.save(), toProfile.save()]);

  res.status(200).json({ message: 'Unfollowed successfully' });
};

/**
 * @desc    Respond to a follow request (accept or decline)
 * @route   PATCH /api/follow/request/:requestId
 * @access  Private
 */
exports.respondToFollowRequest = async (req, res) => {
  const userId = req.user._id;
  const { requestId } = req.params;
  const { action } = req.body; // 'accept' or 'decline'

  if (!['accept', 'decline'].includes(action)) {
    throw new AppError('Invalid action. Must be "accept" or "decline".', 400);
  }

  const request = await FollowRequest.findById(requestId);
  if (!request) {
    throw new AppError('Follow request not found', 404);
  }

  if (request.to.toString() !== userId.toString()) {
    throw new AppError('You are not authorized to respond to this request', 403);
  }

  if (request.status !== 'pending') {
    throw new AppError(`Request has already been ${request.status}`, 400);
  }

  if (action === 'accept') {
    const [fromProfile, toProfile] = await Promise.all([
      Profile.findOne({ user: request.from }),
      Profile.findOne({ user: request.to }),
    ]);

    if (!fromProfile || !toProfile) {
      throw new AppError('One or both user profiles not found', 404);
    }

    // Avoid duplicate entries
    if (!fromProfile.following.includes(userId)) {
      fromProfile.following.push(userId);
      fromProfile.followingCount++;
    }

    if (!toProfile.followers.includes(request.from)) {
      toProfile.followers.push(request.from);
      toProfile.followersCount++;
    }

    request.status = 'accepted';

    await Promise.all([
      fromProfile.save(),
      toProfile.save(),
      request.save()
    ]);

    return res.status(200).json({ message: 'Follow request accepted' });
  }

  // If action is 'decline'
  request.status = 'declined';
  await request.save();

  return res.status(200).json({ message: 'Follow request declined' });
};

/**
 * @desc    Get all pending follow requests for the logged-in user
 * @route   GET /api/follow/requests
 * @access  Private
 */
exports.getPendingRequests = async (req, res) => {
  const profile = await Profile.findOne({ user: req.user._id });

  if (!profile) {
    throw new AppError('Profile not found', 404);
  }

  if (!profile.isPrivate) {
    throw new AppError('Only private accounts can have follow requests', 400);
  }

  const requests = await FollowRequest.find({
    to: req.user._id,
    status: 'pending',
  }).populate('from', 'username');

  res.status(200).json({ requests });
};
