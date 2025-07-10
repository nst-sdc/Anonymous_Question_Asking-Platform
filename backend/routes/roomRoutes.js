const express = require('express');
const router = express.Router();
const { joinRoom } = require('../controllers/roomController');

// Route to join a room
router.post('/join', joinRoom);

module.exports = router;
