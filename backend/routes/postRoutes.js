const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');
const protect = require('../middlewares/authMiddleware');
const { postValidation } = require('../validators/postValidation');
const validateRequest = require('../middlewares/validateRequest');
const { createPost } = require('../controllers/postController');

// Create a new post
router.post('/', protect, upload.array('media', 10), postValidation, validateRequest, createPost);

// Get all posts (explore or feed with pagination)
// router.get('/', postController.getAllPosts);

// // Get single post by ID
// router.get('/:id', postController.getPostById);

// // Update post
// router.put('/:id', protect, postController.updatePost);

// // Delete post
// router.delete('/:id', protect, postController.deletePost);

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
