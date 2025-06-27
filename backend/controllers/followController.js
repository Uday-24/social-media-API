const Profile = require('../models/Profile');
const FollowRequest = require('../models/FollowRequest');
const User = require('../models/User');

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

  const fromProfile = await Profile.findOne({ user: fromUserId });
  const toProfile = await Profile.findOne({ user: toUserId });

  if (!fromProfile || !toProfile) {
    return res.status(404).json({ message: 'Profile not found' });
  }

  fromProfile.following = fromProfile.following.filter(
    (uid) => uid.toString() !== toUserId
  );
  toProfile.followers = toProfile.followers.filter(
    (uid) => uid.toString() !== fromUserId
  );

  fromProfile.followingCount = Math.max(fromProfile.followingCount - 1, 0);
  toProfile.followersCount = Math.max(toProfile.followersCount - 1, 0);

  await fromProfile.save();
  await toProfile.save();

  return res.status(200).json({ message: 'Unfollowed successfully' });
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

  const request = await FollowRequest.findById(requestId);
  if (!request || request.to.toString() !== userId) {
    return res.status(404).json({ message: 'Follow request not found' });
  }

  if (action === 'accept') {
    const fromProfile = await Profile.findOne({ user: request.from });
    const toProfile = await Profile.findOne({ user: request.to });

    fromProfile.following.push(request.to);
    toProfile.followers.push(request.from);

    fromProfile.followingCount++;
    toProfile.followersCount++;

    await fromProfile.save();
    await toProfile.save();

    request.status = 'accepted';
    await request.save();

    return res.status(200).json({ message: 'Follow request accepted' });
  } else if (action === 'decline') {
    request.status = 'declined';
    await request.save();

    return res.status(200).json({ message: 'Follow request declined' });
  } else {
    return res.status(400).json({ message: 'Invalid action' });
  }
};

/**
 * @desc    Get all pending follow requests for the logged-in user
 * @route   GET /api/follow/requests
 * @access  Private
 */
exports.getPendingRequests = async (req, res) => {
  const requests = await FollowRequest.find({
    to: req.user._id,
    status: 'pending',
  }).populate('from', 'username');

  res.status(200).json({ requests });
};
