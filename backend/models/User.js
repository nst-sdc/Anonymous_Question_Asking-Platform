// Mongoose ko require kar rahe hain - MongoDB ke saath connect hone ke liye
const mongoose = require('mongoose');

// User ke liye ek schema bana rahe hain - yeh define karta hai ki database me user ka structure kaisa hoga
const userSchema = new mongoose.Schema({
  // User ka naam - required hai, bina iske user create nahi hoga
  name: { type: String, required: true },

  // User ka email - required hai aur unique bhi hona chahiye (har user ka alag email)
  email: { type: String, required: true, unique: true },

  // recentRooms array me un rooms ka data rakhenge jisme user recently gaya ho
  recentRooms: [
    {
      // Room ka code - yeh identify karta hai room ko
      code: { type: String, required: true },

      // User ne room kab join kiya - default value current time hai
      joinedAt: { type: Date, default: Date.now }
    }
  ]
});

// User model ko export kar rahe hain taaki isse baaki jagah use kiya ja sake
module.exports = mongoose.model('User', userSchema);
