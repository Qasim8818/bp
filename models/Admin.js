const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  email: String,
  password: String, // hash with bcrypt
  role: { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
});

module.exports = mongoose.model('Admin', adminSchema);
