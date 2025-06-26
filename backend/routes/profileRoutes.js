const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');
const { updateProfile,getMyProfile } = require('../controllers/profileController');
const protect = require('../middlewares/authMiddleware');
const { validateProfileUpdate } = require('../validators/profileValidation');
const validateRequest = require('../middlewares/validateRequest');

router.put(
  '/update',
  protect,
  upload.single('avatar'),
  validateProfileUpdate,
  validateRequest,
  updateProfile
);
router.get('/me', protect, getMyProfile);

module.exports = router;
