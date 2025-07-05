const { saveMedia } = require('../utils/saveMedia');
const AppError = require('../utils/AppError');
const Post = require('../models/Post');
const Hashtag = require('../models/Hashtag');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
  const { content, hashtags, tags, location } = req.body;
  const userId = req.user._id;

  const processedHashtags = [];

  if (hashtags && hashtags.length > 0) {
    for (let tag of hashtags) {
      tag = tag.toLowerCase(); // normalize

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
  const {postId} = req.params;

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

// // @desc    Get a post by ID
// // @route   GET /api/posts/:id
// // @access  Public
// exports.getPostById = asyncHandler(async (req, res) => {
//   const post = await Post.findById(req.params.id)
//     .populate('user', 'username profilePic')
//     .populate('tags', 'username profilePic');

//   if (!post) throw new AppError('Post not found', 404);

//   res.status(200).json({ success: true, data: post });
// });

// // @desc    Update a post
// // @route   PUT /api/posts/:id
// // @access  Private
// exports.updatePost = asyncHandler(async (req, res) => {
//   const post = await Post.findById(req.params.id);
//   if (!post) throw new AppError('Post not found', 404);
//   if (!post.user.equals(req.user._id)) throw new AppError('Unauthorized', 403);

//   const updates = ['content', 'media', 'tags', 'hashtags', 'location'];
//   updates.forEach((field) => {
//     if (req.body[field] !== undefined) {
//       post[field] = req.body[field];
//     }
//   });

//   await post.save();

//   res.status(200).json({ success: true, data: post });
// });

// // @desc    Delete a post
// // @route   DELETE /api/posts/:id
// // @access  Private
// exports.deletePost = asyncHandler(async (req, res) => {
//   const post = await Post.findById(req.params.id);
//   if (!post) throw new AppError('Post not found', 404);
//   if (!post.user.equals(req.user._id)) throw new AppError('Unauthorized', 403);

//   await post.deleteOne();

//   res.status(200).json({ success: true, message: 'Post deleted' });
// });

// // @desc    Like or Unlike a post
// // @route   PUT /api/posts/:id/like
// // @access  Private
// exports.toggleLike = asyncHandler(async (req, res) => {
//   const post = await Post.findById(req.params.id);
//   if (!post) throw new AppError('Post not found', 404);

//   const userId = req.user._id;
//   const alreadyLiked = post.likes.includes(userId);

//   if (alreadyLiked) {
//     post.likes.pull(userId);
//   } else {
//     post.likes.push(userId);
//   }

//   await post.save();

//   res.status(200).json({ success: true, liked: !alreadyLiked });
// });

// // @desc    Save or Unsave post
// // @route   PUT /api/posts/:id/save
// // @access  Private
// exports.toggleSave = asyncHandler(async (req, res) => {
//   const user = await User.findById(req.user._id);
//   if (!user) throw new AppError('User not found', 404);

//   const postId = req.params.id;
//   const alreadySaved = user.savedPosts.includes(postId);

//   if (alreadySaved) {
//     user.savedPosts.pull(postId);
//   } else {
//     user.savedPosts.push(postId);
//   }

//   await user.save();

//   res.status(200).json({ success: true, saved: !alreadySaved });
// });

// // @desc    Get all saved posts of the logged-in user
// // @route   GET /api/posts/saved/me
// // @access  Private
// exports.getSavedPosts = asyncHandler(async (req, res) => {
//   const user = await User.findById(req.user._id).populate({
//     path: 'savedPosts',
//     populate: { path: 'user', select: 'username profilePic' },
//   });

//   res.status(200).json({ success: true, data: user.savedPosts });
// });

// // @desc    Get posts by a specific user
// // @route   GET /api/posts/user/:userId
// // @access  Public
// exports.getPostsByUser = asyncHandler(async (req, res) => {
//   const posts = await Post.find({ user: req.params.userId })
//     .populate('user', 'username profilePic')
//     .sort({ createdAt: -1 });

//   res.status(200).json({ success: true, data: posts });
// });

// // @desc    Get posts by hashtag
// // @route   GET /api/posts/hashtag/:tag
// // @access  Public
// exports.getPostsByHashtag = asyncHandler(async (req, res) => {
//   const tag = req.params.tag;
//   const posts = await Post.find({ hashtags: tag })
//     .populate('user', 'username profilePic')
//     .sort({ createdAt: -1 });

//   res.status(200).json({ success: true, data: posts });
// });
