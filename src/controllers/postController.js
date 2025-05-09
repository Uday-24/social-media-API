const Post = require('../models/Post');

// @desc Create a new post
// @route POST /api/posts
const createPost = async (req, res) =>{
    const { content, image } = req.body;
    
    try{
        const post = await Post.create({
            content,
            image,
            author: req.user.id
        });

        res.status(201).json({
            message: 'Post Created',
            post
        });
    }catch(error){
        res.status(500).json({message: 'Server Error'});
    }
}

// @desc Get all posts of a user
// @route GET /api/posts
const getAllPosts = async (req, res) => {
    
    try{
        const posts = await Post.find({author: req.user.id}).populate('author', 'username email').sort({createdAt: -1});
        res.status(200).json(posts);
    }catch(error){
        res.status(500).json({message: 'Server Error'});
    }
}

// @desc Get a post
// @route GET /api/posts/:id
const getPostById = async (req, res) => {

    try{
        const post = await Post.findOne({_id: req.params.id, author: req.user.id}).populate('author', 'username email');
        if(!post){
            return res.status(404).json({message: 'Post not found'});
        }
        res.status(200).json(post);
    }catch(error){
        res.status(500).json({message: 'Server Error'});
    }
}

// @desc Update post
// @route PUT /api/posts/:id
const updatePost = async (req, res) => {
    const { content, image } = req.body;

    try{
        const post = await Post.findOne({_id: req.params.id, author: req.user.id}).populate('author', 'username email');
        if(!post){
            return res.status(404).json({message: 'Post not found'});
        }

        post.content = content || post.content;
        post.image = image || post.image;

        await post.save();
        res.status(200).json(post);
    }catch(error){
        res.status(500).json({message: 'Server Error'});
    }
}

// @desc Delete a post
// @route DELETE /api/posts/:id
const deletePost = async (req, res) => {
    try{
        const post = await Post.findOneAndDelete({_id: req.params.id, author: req.user.id});
        if(!post){
            return res.status(404).json({message: 'Post not found'});
        }
        res.status(200).json({message: 'Post Deleted', post});
    }catch(error){
        res.status(500).json({message: 'Server Error'});
    }
    res.status(200).json({message: 'Delete posts'});
}

const toggleLike = async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;

    try{

        const post = await Post.findById(postId);
        if(!post) return res(404).json({message: 'Post not found'});

        const liked = post.likes.includes(userId);

        if(liked){
            post.likes = post.likes.filter(id => id.toString() !== userId.toString());
            await post.save();
            return res.status(200).json({message: 'Post Unliked'});
        }
        
        post.likes.push(userId);
        await post.save();
        return res.status(200).json({message: 'Post Liked'});

    }catch(error){
        res.status(500).json({message: 'Server Error'});
    }
}

module.exports = {
    createPost,
    getAllPosts,
    getPostById,
    updatePost,
    deletePost,
    toggleLike,
}