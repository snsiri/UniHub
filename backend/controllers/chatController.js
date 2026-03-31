const Chat    = require('../models/Chat');
const Message = require('../models/Message');
const User    = require('../models/User');

// @desc  Access or create DM chat
exports.accessChat = async (req, res) => {
  try {
    const { userId } = req.body;
    let chat = await Chat.findOne({
      isGroup: false,
      members: { $all: [req.user._id, userId], $size: 2 }
    }).populate('members', 'name username avatar isOnline lastSeen');

    if (!chat) {
      chat = await Chat.create({ isGroup: false, members: [req.user._id, userId] });
      chat = await Chat.findById(chat._id).populate('members', 'name username avatar isOnline lastSeen');
    }
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Create group chat
exports.createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;
    if (!members || members.length < 2)
      return res.status(400).json({ message: 'At least 2 members required' });

    const chat = await Chat.create({
      name,
      isGroup: true,
      members: [...members, req.user._id],
      admins: [req.user._id],
    });
    const populated = await Chat.findById(chat._id)
      .populate('members', 'name username avatar isOnline')
      .populate('admins', 'name username avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get my chats
exports.getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({ members: req.user._id })
      .populate('members', 'name username avatar isOnline lastSeen')
      .populate('admins',  'name username avatar')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'name username' } })
      .sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Rename group
exports.renameGroup = async (req, res) => {
  try {
    const { name } = req.body;
    const chat = await Chat.findById(req.params.chatId);
    if (!chat || !chat.isGroup) return res.status(404).json({ message: 'Group not found' });
    if (!chat.admins.map(a => a.toString()).includes(req.user._id.toString()))
      return res.status(403).json({ message: 'Admin only' });

    chat.name = name;
    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Add member to group
exports.addToGroup = async (req, res) => {
  try {
    const { userId } = req.body;
    const chat = await Chat.findByIdAndUpdate(
      req.params.chatId,
      { $addToSet: { members: userId } },
      { new: true }
    ).populate('members', 'name username avatar');
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Remove member from group
exports.removeFromGroup = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat.admins.map(a => a.toString()).includes(req.user._id.toString()))
      return res.status(403).json({ message: 'Admin only' });

    const updated = await Chat.findByIdAndUpdate(
      req.params.chatId,
      { $pull: { members: req.body.userId, admins: req.body.userId } },
      { new: true }
    ).populate('members', 'name username avatar');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Leave group
exports.leaveGroup = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat || !chat.isGroup) return res.status(404).json({ message: 'Group not found' });
    chat.members.pull(req.user._id);
    chat.admins.pull(req.user._id);
    // If no admins left, make first member admin
    if (chat.admins.length === 0 && chat.members.length > 0) {
      chat.admins.push(chat.members[0]);
    }
    await chat.save();
    res.json({ message: 'Left group' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// @desc  Get group details with members
exports.getGroupDetails = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('members', 'name username avatar isOnline semester year')
      .populate('admins',  'name username avatar');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    res.json(chat);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
