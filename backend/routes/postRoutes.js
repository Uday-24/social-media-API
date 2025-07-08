const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');
const protect = require('../middlewares/authMiddleware');
const { postValidation } = require('../validators/postValidation');
const validateRequest = require('../middlewares/validateRequest');
const { createPost, editPost, deletePost, getPostById, getPostsByUser, getMyPosts } = require('../controllers/postController');

// Create a new post
router.post('/', protect, upload.array('media', 10), postValidation, validateRequest, createPost);

// Update post
router.patch('/:postId', protect, editPost);

// Delete post
router.delete('/:postId', protect, deletePost);

// Get single post by ID
router.get('/:postId', protect, getPostById);

// Get all posts from User
router.get('/user/:userId', protect, getPostsByUser);

// Get all my posts
router.get('/me', protect, getMyPosts);





// // Like / Unlike post
// router.put('/:id/like', protect, postController.toggleLike);

// // Save / Unsave post
// router.put('/:id/save', protect, postController.toggleSave);

// // Get posts of a specific user
// router.get('/user/:userId', postController.getPostsByUser);

// // Get posts by hashtag
// router.get('/hashtag/:tag', postController.getPostsByHashtag);

// // Get all saved posts of current user
// router.get('/saved/me', protect, postController.getSavedPosts);

module.exports = router;
