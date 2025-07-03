const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth'); // Auth middleware required

// GET /api/users/me/recent-rooms
router.get('/me/recent-rooms', auth, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      recentRooms: user.recentRooms || []
    });
  } catch (error) {
    console.error('Error fetching recent rooms:', error);
    res.status(500).json({
      message: 'Failed to fetch recent rooms',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
});

module.exports = router;
