const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { createPost, getAllPosts, getPostById, updatePost, deletePost } = require('../controllers/postController');
const router = express.Router();

router.route('/')
    .post(protect, createPost)
    .get(protect, getAllPosts);

router.route('/:id')
    .get(protect, getPostById)
    .put(protect, updatePost)
    .delete(protect, deletePost);

module.exports = router;