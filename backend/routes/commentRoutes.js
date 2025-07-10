const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const {
  createComment,
  getCommentsByPost,
  deleteComment,
  likeComment,
  unlikeComment,
  editComment,
  getRepliesToComment
} = require('../controllers/commentController');

// Create a new comment on a post
router.post('/:postId', protect, createComment);

// Get all comments for a post
router.get('/:postId', protect, getCommentsByPost);

// Delete a comment (own)
router.delete('/:commentId', protect, deleteComment);

// Like a comment
router.post('/like/:commentId', protect, likeComment);

// Unlike a comment
router.post('/unlike/:commentId', protect, unlikeComment);

// Get replies to comment
router.get('/replies/:commentId', protect, getRepliesToComment);

// Edit own comment
router.patch('/:commentId', protect, editComment);

module.exports = router;