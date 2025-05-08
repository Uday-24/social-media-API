const User = require('../models/User');
const Post = require('../models/Post');

// @desc Following a user
// @route /api/user/follow/:id
const follow = async (req, res) => {
    let targetUserId = req.params.id;
    let currentUserId = req.user.id;
    if(targetUserId === currentUserId){
        return res.status(400).json({message: 'You can not follow your self'});
    }

    try{
        let targetUser = await User.findById(targetUserId);
        let currentUser = await User.findById(currentUserId);

        if(!targetUser || !currentUser){
            return res.status(404).json({message: 'User not found'});
        }
        
        if(targetUser.followers.includes(currentUserId)){
            return res.status(400).json({message: 'Already following'});
        }

        targetUser.followers.push(currentUserId);
        currentUser.followings.push(targetUserId);

        await targetUser.save();
        await currentUser.save();

        res.status(200).json({message: `${currentUser.username} started following to ${targetUser.username}`});
    }catch(error){
        res.status(500).json({error: error.message});
    }
}

// @desc Unfollowing a user
// @route /api/user/unfollow/:id
const unfollow = async (req, res) => {
    let targetUserId = req.params.id;
    let currentUserId = req.user.id;

    if(targetUserId === currentUserId){
        return res.status(400).json({message: 'You can not unfollow your self'});
    }

    try{

        let targetUser = await User.findById(targetUserId);
        let currentUser = await User.findById(currentUserId);

        if(!targetUser || !currentUser){
            return res.status(404).json({message: 'User not found'});
        }

        if(!targetUser.followers.includes(currentUserId)){
            return res.status(404).json({message: 'You have to follow first'});
        }

        targetUser.followers = targetUser.followers.filter( id => id.toString() !== currentUserId.toString() );
        currentUser.followings = currentUser.followings.filter( id => id.toString() !== targetUserId.toString() );

        await targetUser.save();
        await currentUser.save();

        res.status(200).json({messag: `${currentUser.username} unfollowed ${targetUser.username}`});

    }catch(error){
        res.status(500).json({messag: 'Server Error'});
    }
    
}

// @desc Getting all posts from followings
// @route /api/user/getfeed
const getFeed = async (req, res) => {
    try{
        let { followings } = await User.findById(req.user.id).select('followings');

        let posts = await Post.find({
            author:{
                $in: followings
            }
        }).populate('author', 'username email').sort({ createdAt: -1 });
        res.status(200).json(posts);
    }catch(error){
        res.status(500).json({messag: 'Server Error'});
    }
}

module.exports = {
    follow,
    unfollow,
    getFeed
}