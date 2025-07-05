const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  }
}, { _id: false });

function mediaLimit(val) {
  return val.length <= 10;
}

const PostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  content: { type: String, required: true },

  media: {
    type: [mediaSchema],
    validate: {
      validator: mediaLimit,
      message: 'A post cannot have more than 10 media items.'
    }
  },

  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  hashtags: [{ type: String }],
  location: { type: String },

  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', PostSchema);