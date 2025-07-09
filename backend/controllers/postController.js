const { saveMedia } = require('../utils/saveMedia');
const AppError = require('../utils/AppError');
const canViewPrivateContent = require('../utils/canViewPrivateContent');
const Post = require('../models/Post');
const Hashtag = require('../models/Hashtag');
const Profile = require('../models/Profile');
const paginateCursor = require('../utils/paginateCursor');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
  const { content, hashtags, tags, location } = req.body;
  const userId = req.user._id;

  const processedHashtags = [];

  if (hashtags && hashtags.length > 0) {
    for (let tag of hashtags) {
      tag = tag.toLowerCase();

      let existing = await Hashtag.findOne({ name: tag });

      if (existing) {
        existing.usageCount += 1;
        await existing.save();
      } else {
        existing = await Hashtag.create({ name: tag });
      }

      processedHashtags.push(existing.name);
    }
  }

  const mediaArray = [];

  if (req.files && req.files.length > 0) {
    if (req.files.length > 10) {
      throw new AppError('A post cannot have more than 10 media files.', 400);
    }

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const url = await saveMedia(file.buffer, userId, i, file.mimetype);
      const type = file.mimetype.startsWith('image/') ? 'image' : 'video';
      mediaArray.push({ url, type });
    }
  }

  const newPost = new Post({
    user: userId,
    content,
    hashtags,
    tags,
    location,
    media: mediaArray,
  });

  await newPost.save();

  res.status(201).json({ message: 'Post created successfully', post: newPost });
};


exports.editPost = async (req, res) => {
  const userId = req.user._id;
  const { postId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === '') {
    throw new AppError('Content is required to update', 400);
  }

  const updatedPost = await Post.findOneAndUpdate(
    { _id: postId, user: userId },
    { content },
    { new: true } // return the updated post
  );

  if (!updatedPost) {
    throw new AppError('Post not found or you are not authorized to edit it', 404);
  }

  res.status(200).json({
    message: 'Post content updated successfully',
    post: updatedPost,
  });
};


exports.deletePost = async (req, res) => {
  const userId = req.user._id;
  const { postId } = req.params;

  const deletedPost = await Post.findOneAndDelete({
    _id: postId,
    user: userId, // ensures only the owner can delete
  });

  if (!deletedPost) {
    throw new AppError('Post not found or you are not authorized to delete it', 404);
  }

  res.status(200).json({
    message: 'Post deleted successfully',
  });
};


exports.getPostById = async (req, res) => {
  const { postId } = req.params;
  const currentUserId = req.user._id; // may be null if not logged in

  // 1. Fetch the post
  const post = await Post.findById(postId)
    .populate('user', 'username') // basic user info
    .populate('tags', 'username');

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  // 2. Fetch the owner's profile
  const ownerProfile = await Profile.findOne({ user: post.user._id }).select('isPrivate followers user');
  if (!ownerProfile) {
    throw new AppError('Profile not found for this post owner', 404);
  }

  // 3. Privacy check
  const canView = canViewPrivateContent(ownerProfile, currentUserId);
  if (!canView) {
    throw new AppError('You are not authorized to view this post', 403);
  }

  res.status(200).json({ post });
};


exports.getPostsByUser = async (req, res) => {
  const targetUserId = req.params.userId;
  const currentUserId = req.user?._id || null;

  const targetProfile = await Profile.findOne({ user: targetUserId }).select('isPrivate followers user');
  if (!targetProfile) throw new AppError('User profile not found', 404);

  const canView = canViewPrivateContent(targetProfile, currentUserId);
  if (!canView) throw new AppError('You are not authorized to view posts from this user', 403);

  const limit = parseInt(req.query.limit) || 12;
  const cursor = req.query.cursor;

  const { results: posts, nextCursor } = await paginateCursor({
    model: Post,
    filter: { user: targetUserId },
    cursor,
    limit,
    populate: [
      { path: 'user', select: 'username' },
      { path: 'tags', select: 'username' },
    ],
  });

  res.status(200).json({
    count: posts.length,
    nextCursor,
    posts,
  });
};

exports.getMyPosts = async (req, res) => {
  const limit = parseInt(req.query.limit) || 12;
  const cursor = req.query.cursor;

  const { results: posts, nextCursor } = await paginateCursor({
    model: Post,
    filter: { user: req.user._id },
    cursor,
    limit,
    populate: [{ path: 'tags', select: 'username' }],
  });

  res.status(200).json({
    count: posts.length,
    nextCursor,
    posts,
  });
};

exports.likePost = async (req, res) => {
  const userId = req.user._id;
  const { postId } = req.params;

  // 1. Find the post
  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  // 2. Fetch the post owner's profile (including isPrivate and followers)
  const targetProfile = await Profile.findOne({ user: post.user }).select('isPrivate followers user');
  if (!targetProfile) {
    throw new AppError('Post owner profile not found', 404);
  }

  // 3. Check if current user can view/like the post
  const canView = canViewPrivateContent(targetProfile, userId);
  if (!canView) {
    throw new AppError('You are not allowed to interact with this post', 403);
  }

  // 4. Like logic
  if (post.likes.includes(userId)) {
    return res.status(400).json({ success: false, message: 'Post already liked' });
  }

  post.likes.push(userId);
  await post.save();

  res.status(200).json({ success: true, message: 'Post liked' });
};

exports.unlikePost = async (req, res) => {
  const userId = req.user._id;
  const { postId } = req.params;

  // 1. Find the post
  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  // 2. Fetch the post owner's profile
  const targetProfile = await Profile.findOne({ user: post.user }).select('isPrivate followers user');
  if (!targetProfile) {
    throw new AppError('Post owner profile not found', 404);
  }

  // 3. Privacy check
  const canView = canViewPrivateContent(targetProfile, userId);
  if (!canView) {
    throw new AppError('You are not allowed to interact with this post', 403);
  }

  // 4. Unlike logic
  const index = post.likes.indexOf(userId);
  if (index === -1) {
    return res.status(400).json({ success: false, message: 'Post not liked yet' });
  }

  post.likes.splice(index, 1);
  await post.save();

  res.status(200).json({ success: true, message: 'Post unliked' });
};

// @desc    Get all posts (explore/feed)
// @route   GET /api/posts
// @access  Public
// exports.getAllPosts = asyncHandler(async (req, res) => {
//   const posts = await Post.find()
//     .populate('user', 'username profilePic')
//     .populate('tags', 'username profilePic')
//     .sort({ createdAt: -1 });

//   res.status(200).json({ success: true, count: posts.length, data: posts });
// });

exports.toggleSavePost = async (req, res) => {
  const userId = req.user._id;
  const { postId } = req.params;

  // 1. Fetch the post
  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);

  // 2. Get the post owner's profile
  const postOwnerProfile = await Profile.findOne({ user: post.user }).select('isPrivate followers user');
  if (!postOwnerProfile) throw new AppError('Post owner profile not found', 404);

  // 3. Check privacy
  const canView = canViewPrivateContent(postOwnerProfile, userId);
  if (!canView) throw new AppError('You are not allowed to save this post', 403);

  // 4. Fetch the current user's profile
  const profile = await Profile.findOne({ user: userId });
  if (!profile) throw new AppError('Your profile not found', 404);

  // 5. Toggle logic
  const alreadySaved = profile.savedPosts.includes(postId);
  let action;

  if (alreadySaved) {
    profile.savedPosts.pull(postId);
    action = 'unsaved';
  } else {
    profile.savedPosts.push(postId);
    action = 'saved';
  }

  await profile.save();

  res.status(200).json({
    success: true,
    message: `Post ${action} successfully.`,
    savedPosts: profile.savedPosts,
  });
};

exports.getSavedPosts = async (req, res) => {
  const userId = req.user._id;

  // 1. Find user profile
  const profile = await Profile.findOne({ user: userId }).select('savedPosts');
  if (!profile) throw new AppError('Profile not found', 404);

  const limit = parseInt(req.query.limit) || 12;
  const cursor = req.query.cursor;

  // 2. Paginate over saved post IDs
  const { results: posts, nextCursor } = await paginateCursor({
    model: Post,
    filter: { _id: { $in: profile.savedPosts } },
    cursor,
    limit,
    sortField: 'createdAt', // default used if not specified
    populate: [
      { path: 'user', select: 'username avatar' },
      { path: 'tags', select: 'username' },
    ],
  });

  res.status(200).json({
    count: posts.length,
    nextCursor,
    posts,
  });
};


exports.getPostsByHashtag = async (req, res) => {
  const { tag } = req.params; // hashtag without #
  const limit = parseInt(req.query.limit) || 12;
  const cursor = req.query.cursor;

  // Sanitize and lowercase the hashtag (optional)
  const cleanTag = tag.trim().toLowerCase();

  // Fetch posts containing this hashtag
  const { results: posts, nextCursor } = await paginateCursor({
    model: Post,
    filter: { hashtags: cleanTag },
    cursor,
    limit,
    sortField: 'createdAt',
    populate: [
      { path: 'user', select: 'username avatar' },
      { path: 'tags', select: 'username' },
    ],
  });

  res.status(200).json({
    count: posts.length,
    nextCursor,
    posts,
  });
};