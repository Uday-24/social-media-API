const express = require('express');
const { follow, unfollow, getFeed } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/follow/:id', protect, follow);
router.post('/unfollow/:id', protect, unfollow);
router.get('/', protect, getFeed);

module.exports = router;