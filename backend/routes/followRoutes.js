// routes/followRoutes.js
const express = require('express');
const router = express.Router();
const {
  followUser,
  unfollowUser,
  respondToFollowRequest,
  getPendingRequests,
} = require('../controllers/followController');
const protect = require('../middlewares/authMiddleware');

router.post('/:id', protect, followUser);
router.delete('/:id', protect, unfollowUser);
router.patch('/:requestId', protect, respondToFollowRequest);
router.get('/requests', protect, getPendingRequests);

module.exports = router;
