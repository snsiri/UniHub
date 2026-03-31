const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  username:    { type: String, required: true, unique: true, trim: true, lowercase: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  password:    { type: String, required: true },
  avatar:      { type: String, default: '' },
  coverPhoto:  { type: String, default: '' },
  bio:         { type: String, default: '', maxlength: 300 },
  semester:    { type: Number, min: 1, max: 8, default: null },
  year:        { type: Number, min: 1, max: 4, default: null },
  department:  { type: String, default: '' },
  role:        { type: String, enum: ['student', 'admin', 'developer'], default: 'student' },
  followers:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedPosts:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  isOnline:    { type: Boolean, default: false },
  lastSeen:    { type: Date, default: Date.now },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
