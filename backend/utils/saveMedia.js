const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const AppError = require('./AppError');

const saveMedia = async (fileBuffer, userId, index, mimetype) => {
  const timestamp = Date.now();
  const ext = mimetype === 'video/mp4' ? 'mp4' : mimetype.startsWith('image/') ? 'jpg' : null;

  if (!ext) {
    throw new AppError('Unsupported media type', 400);
  }

  const filename = `post-${userId}-${timestamp}-${index}.${ext}`;
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'posts');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, filename);

  if (mimetype.startsWith('image/')) {
    await sharp(fileBuffer)
      .resize(1080)
      .toFormat('jpg')
      .jpeg({ quality: 85 })
      .toFile(filePath);
  } else if (mimetype === 'video/mp4') {
    fs.writeFileSync(filePath, fileBuffer);
  }

  return `/uploads/posts/${filename}`;
};

module.exports = { saveMedia };
