const Message = require('../models/Message');
const Chat    = require('../models/Chat');
const { uploadToCloudinary } = require('../config/cloudinary');

const getResourceType = (mime) => {
  if (!mime) return 'raw';
  if (mime.startsWith('video/') || mime.startsWith('audio/')) return 'video';
  if (mime.startsWith('image/')) return 'image';
  return 'raw';
};

// @desc  Send message
exports.sendMessage = async (req, res) => {
  try {
    const { chatId, text, sharedPostId, mentions } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!chat.members.map(m => m.toString()).includes(req.user._id.toString()))
      return res.status(403).json({ message: 'Not a member of this chat' });

    const msgData = {
      chat:   chatId,
      sender: req.user._id,
      text:   text || '',
      readBy: [req.user._id],
    };

    if (sharedPostId) msgData.sharedPost = sharedPostId;
    if (mentions)     msgData.mentions   = JSON.parse(mentions);

    // Upload file if attached
    if (req.file) {
      const mime         = req.file.mimetype;
      const resourceType = getResourceType(mime);
      const result = await uploadToCloudinary(req.file.buffer, {
        folder:          'knowva/chat',
        resource_type:   resourceType,
        use_filename:    true,
        unique_filename: true,
      });
      msgData.media = {
        url:          result.secure_url,
        resourceType: mime.startsWith('image/') ? 'image' : mime.startsWith('video/') ? 'video' : 'raw',
        fileName:     req.file.originalname,
        mimeType:     mime,
      };
    }

    let message = await Message.create(msgData);
    message = await Message.findById(message._id)
      .populate('sender',     'name username avatar')
      .populate('sharedPost', 'content media author moduleCode materialType postType')
      .populate({ path: 'sharedPost', populate: { path: 'author', select: 'name username avatar' } })
      .populate('mentions',   'name username');

    await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });
    req.app.get('io').to(chatId).emit('receive_message', message);
    res.status(201).json(message);
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get messages
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const chat = await Chat.findById(chatId);
    if (!chat.members.map(m => m.toString()).includes(req.user._id.toString()))
      return res.status(403).json({ message: 'Not a member of this chat' });

    const messages = await Message.find({ chat: chatId, deletedFor: { $ne: req.user._id } })
      .populate('sender',     'name username avatar')
      .populate({ path: 'sharedPost', populate: { path: 'author', select: 'name username avatar' } })
      .populate('mentions',   'name username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    await Message.updateMany(
      { chat: chatId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );
    res.json(messages.reverse());
  } catch (err) { res.status(500).json({ message: err.message }); }
};
