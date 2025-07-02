const User = require('../models/User');


const joinRoom = async (req, res) => {
  const { code } = req.body;

  try {
    const user = await User.findById(req.user.id); 


    user.recentRooms = user.recentRooms.filter(room => room.code !== code);


    user.recentRooms.unshift({ code, joinedAt: new Date() });


    user.recentRooms = user.recentRooms.slice(0, 10);

    await user.save();

    res.status(200).json({ message: 'Room joined and history updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to join room', error });
  }
};

module.exports = { joinRoom };
