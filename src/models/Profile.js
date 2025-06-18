const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    username: {
        type: String,
        unique: true,
        trim: true,
        required: true,
        minlength: 3,
        validate: {
        validator: function (value) {
            return /^[a-zA-Z0-9._]+$/.test(value);
        },
        message: 'Username can only contain letters, numbers, dots, and underscores.'
    }
    },
    name: {
        type: String,
        trim: true
    },
    bio: {
        type: String,
        trim: true,
        minlength: 5
    },
    profilePic: {
        type: String
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile'
    }],
    followings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile'
    }],
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile'
    }],
    isPrivate: {
        type: Boolean,
        default: false
    },
    followRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile'
    }]
}, {timestamps: true});

module.exports = mongoose.model('Profile', profileSchema);