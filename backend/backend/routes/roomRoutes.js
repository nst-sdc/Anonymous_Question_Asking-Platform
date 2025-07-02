const express = require('express');
const router = express.Router();
const { joinRoom } = require('../controllers/roomController');
const auth = require('../middleware/auth'); // assumes auth middleware

// POST request to join a room
router.post('/join', auth, joinRoom);

module.exports = router;
