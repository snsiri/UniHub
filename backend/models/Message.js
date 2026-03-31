const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat:       { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  sender:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:       { type: String, default: '' },
  mentions:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  media: {
    url:          { type: String },
    resourceType: { type: String },
    fileName:     { type: String },
  },
  sharedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
  readBy:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
