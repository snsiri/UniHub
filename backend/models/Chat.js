const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  name:       { type: String, default: '' },           // for group chats
  isGroup:    { type: Boolean, default: false },
  members:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  groupAvatar:{ type: String, default: '' },
  lastMessage:{ type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
