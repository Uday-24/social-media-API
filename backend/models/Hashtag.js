// models/Hashtag.js
const mongoose = require('mongoose');

const hashtagSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  usageCount: { type: Number, default: 1 },
});

module.exports = mongoose.model('Hashtag', hashtagSchema);