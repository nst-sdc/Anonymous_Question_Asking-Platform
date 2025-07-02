const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Example fields (add real ones based on your app)
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },

  // 👇 Add this for room history tracking
  recentRooms: [
    {
      code: { type: String, required: true },
      joinedAt: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model('User', userSchema);
