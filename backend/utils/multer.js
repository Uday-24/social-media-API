const multer = require('multer');
const path = require('path');
const AppError = require('./AppError'); // optional if you use custom error handling

// Use memory storage for sharp/video buffer processing
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimetypes = ['image/jpeg', 'image/png', 'video/mp4'];
  if (allowedMimetypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG/PNG images or MP4 videos are allowed'));
  }

};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 30 * 1024 * 1024, // 15MB limit per file
  },
});

module.exports = upload;
