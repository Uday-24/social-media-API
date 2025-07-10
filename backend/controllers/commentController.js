const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Profile = require('../models/Profile');
const canViewPrivateContent = require('../utils/canViewPrivateContent');
const AppError = require('../utils/AppError');

/**
 * @desc    Create a new comment on a post (or reply to an existing one)
 * @route   POST /api/comments/:postId
 * @access  Private
 */
exports.createComment = async (req, res) => {
  const { content, parent } = req.body;
  const { postId } = req.params;
  const userId = req.user._id;

  if (!content || content.trim() === '') {
    throw new AppError('Comment content is required', 400);
  }

  // Select only necessary post fields: user
  const post = await Post.findById(postId)
    .select('user')
    .populate({ path: 'user', select: '_id' });

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  // Get minimal profile info for privacy check
  const targetProfile = await Profile.findOne({ user: post.user._id })
    .select('user isPrivate followers');

  if (!targetProfile) {
    throw new AppError('Target user profile not found', 404);
  }

  // Privacy check
  const canView = canViewPrivateContent(targetProfile, userId);
  if (!canView) {
    throw new AppError('You are not allowed to comment on this post', 403);
  }

  // Validate parent comment
  if (parent) {
    const parentComment = await Comment.findById(parent).select('post');
    if (!parentComment || !parentComment.post.equals(postId)) {
      throw new AppError('Invalid parent comment', 400);
    }
  }

  const newComment = await Comment.create({
    post: postId,
    user: userId,
    content,
    parent: parent || null,
  });

  res.status(201).json({ success: true, data: newComment });
};


/**
 * @desc    Get all top-level comments for a post (paginated)
 * @route   GET /api/comments/:postId?page=1
 * @access  Private
 */
exports.getCommentsByPost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user?._id || null;

  const page = parseInt(req.query.page) || 1;
  const limit = 15;
  const skip = (page - 1) * limit;

  // 1. Check if post exists
  const post = await Post.findById(postId).select('user');
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  // 2. Privacy check
  const targetProfile = await Profile.findOne({ user: post.user }).select('user isPrivate followers');
  if (!targetProfile) {
    throw new AppError('Profile not found', 404);
  }

  const canView = canViewPrivateContent(targetProfile, userId);
  if (!canView) {
    throw new AppError('You are not allowed to view comments on this post', 403);
  }

  // 3. Fetch paginated top-level comments
  const comments = await Comment.find({ post: postId, parent: null })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({ path: 'user', select: 'username avatar' })
    .select('content user createdAt likes');

  const totalComments = await Comment.countDocuments({ post: postId, parent: null });

  res.status(200).json({
    success: true,
    data: comments,
    pagination: {
      total: totalComments,
      page,
      limit,
      totalPages: Math.ceil(totalComments / limit),
      hasNextPage: skip + comments.length < totalComments,
    },
  });
};


/**
 * @desc    Delete a comment (if owned by current user)
 * @route   DELETE /api/comments/:commentId
 * @access  Private
 */
exports.deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  // 1. Find the comment
  const comment = await Comment.findById(commentId).select('user parent');
  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  // 2. Authorization check
  if (!comment.user.equals(userId)) {
    throw new AppError('You are not authorized to delete this comment', 403);
  }

  // 3. Delete the comment
  await Comment.findByIdAndDelete(commentId);

  // 4. If this is a parent comment, also delete its replies
  if (!comment.parent) {
    await Comment.deleteMany({ parent: commentId });
  }

  res.status(200).json({
    success: true,
    message: 'Comment deleted successfully',
    data: { commentId },
  });
};


/**
 * @desc    Like a comment
 * @route   POST /api/comments/like/:commentId
 * @access  Private
 */
exports.likeComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  // 1. Find the comment and its post reference
  const comment = await Comment.findById(commentId).select('likes post');
  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  // 2. Get the post to find its author
  const post = await Post.findById(comment.post).select('user');
  if (!post) {
    throw new AppError('Associated post not found', 404);
  }

  // 3. Check privacy using post author's profile
  const targetProfile = await Profile.findOne({ user: post.user }).select('user isPrivate followers');
  if (!targetProfile) {
    throw new AppError('Profile not found', 404);
  }

  const canView = canViewPrivateContent(targetProfile, userId);
  if (!canView) {
    throw new AppError('You are not allowed to like this comment', 403);
  }

  // 4. Check if already liked
  if (comment.likes.includes(userId)) {
    throw new AppError('You have already liked this comment', 400);
  }

  // 5. Like the comment
  comment.likes.push(userId);
  await comment.save();

  res.status(200).json({
    success: true,
    message: 'Comment liked',
    data: { commentId, likesCount: comment.likes.length },
  });
};


/**
 * @desc    Unlike a comment
 * @route   POST /api/comments/unlike/:commentId
 * @access  Private
 */
exports.unlikeComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  // 1. Find the comment and get its post reference
  const comment = await Comment.findById(commentId).select('likes post');
  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  // 2. Get the post to find its author
  const post = await Post.findById(comment.post).select('user');
  if (!post) {
    throw new AppError('Associated post not found', 404);
  }

  // 3. Get the post owner's profile for privacy check
  const targetProfile = await Profile.findOne({ user: post.user }).select('user isPrivate followers');
  if (!targetProfile) {
    throw new AppError('Profile not found', 404);
  }

  const canView = canViewPrivateContent(targetProfile, userId);
  if (!canView) {
    throw new AppError('You are not allowed to unlike this comment', 403);
  }

  // 4. Check if the user has liked the comment
  const likedIndex = comment.likes.findIndex(id => id.equals(userId));
  if (likedIndex === -1) {
    throw new AppError('You have not liked this comment', 400);
  }

  // 5. Remove the like
  comment.likes.splice(likedIndex, 1);
  await comment.save();

  res.status(200).json({
    success: true,
    message: 'Comment unliked',
    data: { commentId, likesCount: comment.likes.length },
  });
};


/**
 * @desc    Edit your own comment
 * @route   PATCH /api/comments/:commentId
 * @access  Private
 */
exports.editComment = async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;

  if (!content || content.trim() === '') {
    throw new AppError('Comment content cannot be empty', 400);
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  if (!comment.user.equals(userId)) {
    throw new AppError('You are not authorized to edit this comment', 403);
  }

  comment.content = content.trim();
  await comment.save();

  res.status(200).json({
    success: true,
    message: 'Comment updated successfully',
    data: comment,
  });
};


/**
 * @desc    Get replies to a specific comment (paginated)
 * @route   GET /api/comments/replies/:commentId?page=1
 * @access  Private
 */
exports.getRepliesToComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?._id || null;

  const page = parseInt(req.query.page) || 1;
  const limit = 15;
  const skip = (page - 1) * limit;

  // 1. Find the parent comment
  const parentComment = await Comment.findById(commentId).select('post');
  if (!parentComment) {
    throw new AppError('Parent comment not found', 404);
  }

  // 2. Fetch the post to access author
  const post = await Post.findById(parentComment.post).select('user');
  if (!post) {
    throw new AppError('Associated post not found', 404);
  }

  // 3. Privacy check
  const targetProfile = await Profile.findOne({ user: post.user }).select('user isPrivate followers');
  if (!targetProfile) {
    throw new AppError('Profile not found', 404);
  }

  const canView = canViewPrivateContent(targetProfile, userId);
  if (!canView) {
    throw new AppError('You are not allowed to view replies on this comment', 403);
  }

  // 4. Fetch replies to the comment
  const replies = await Comment.find({ parent: commentId })
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .populate({ path: 'user', select: 'username avatar' })
    .select('content user createdAt likes');

  const totalReplies = await Comment.countDocuments({ parent: commentId });

  res.status(200).json({
    success: true,
    data: replies,
    pagination: {
      total: totalReplies,
      page,
      limit,
      totalPages: Math.ceil(totalReplies / limit),
      hasNextPage: skip + replies.length < totalReplies,
    },
  });
};