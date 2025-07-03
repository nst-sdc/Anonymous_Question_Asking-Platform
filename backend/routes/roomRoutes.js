const express = require('express');
const router = express.Router();
const { joinRoom } = require('../controllers/roomController');
const auth = require('../middleware/auth'); 


router.post('/join', auth, joinRoom);

module.exports = router;
