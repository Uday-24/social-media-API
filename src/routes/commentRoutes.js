const express = require('express');
const { addComment, editComment, deleteComment, getCommentsByPost } = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.route('/:id')
    .post(protect, addComment)
    .get(protect, getCommentsByPost)
    .put(protect, editComment)
    .delete(protect, deleteComment)

module.exports = router;