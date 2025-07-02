const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth'); // Auth middleware required

// GET /api/users/me/recent-rooms
router.get('/me/recent-rooms', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json(user.recentRooms);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch recent rooms' });
  }
});

module.exports = router;
