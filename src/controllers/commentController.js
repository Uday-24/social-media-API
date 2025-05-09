const Comment = require('../models/Comment');

const addComment = async (req, res) => {
    const postId = req.params.id;
    const { content } = req.body;

    try {
        const comment = await Comment.create({
            post: postId,
            author: req.user.id,
            content
        });

        res.status(201).json({ comment });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
}

const editComment = async (req, res) => {
    const commentId = req.params.id;
    const { content } = req.body;
    try {
        const comment = await Comment.findOne({_id: commentId, author: req.user.id});
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        comment.content = content || comment.content;
        await comment.save();

        res.status(200).json({ comment });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
}

const deleteComment = async (req, res) => {
    const commentId = req.params.id;
    try {
        const comment = await Comment.findOneAndDelete({_id: commentId, author: req.user.id});
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        res.status(201).json({ message: 'Comment Deleted', comment });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
}

const getCommentsByPost = async (req, res) => {
    const postId = req.params.id;
    try {
        const comments = await Comment.find({ post: postId }).populate('author', 'username email').sort({ createdAt: -1 });
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
}

module.exports = {
    addComment,
    editComment,
    deleteComment,
    getCommentsByPost
}