const { supabase } = require('../database');

exports.joinRoom = async (req, res) => {
  const { roomId, userId } = req.body;

  if (!roomId || !userId) {
    return res.status(400).json({ message: 'Room ID and User ID are required' });
  }

  try {
    // Check if the room exists
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('room_id')
      .eq('room_id', roomId)
      .single();

    if (roomError || !room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Add the user to the room
    const { data: updatedUser, error: userError } = await supabase
      .from('users')
      .update({ room_id: roomId })
      .eq('id', userId)
      .select();

    if (userError) {
      console.error('Error updating user:', userError);
      return res.status(500).json({ message: 'Failed to join room' });
    }

    res.status(200).json({ message: 'Successfully joined room', user: updatedUser });
  } catch (error) {
    console.error('Error in joinRoom controller:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
