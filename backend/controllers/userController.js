const User         = require('../models/User');
const Post         = require('../models/Post');
const Notification = require('../models/Notification');
const { cloudinary } = require('../config/cloudinary');

// @desc  Get user profile by username
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate('followers', 'name username avatar')
      .populate('following', 'name username avatar');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, semester, year, department } = req.body;
    const updates = { name, bio, semester, year, department };

    if (req.file) { const { uploadToCloudinary } = require("../config/cloudinary"); const result = await uploadToCloudinary(req.file.buffer, { folder: "knowva/avatars", resource_type: "image" }); updates.avatar = result.secure_url; }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Follow / unfollow user
exports.toggleFollow = async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user._id.toString())
      return res.status(400).json({ message: "Can't follow yourself" });

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const isFollowing = target.followers.includes(req.user._id);

    if (isFollowing) {
      target.followers.pull(req.user._id);
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: targetId } });
    } else {
      target.followers.push(req.user._id);
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: targetId } });
      // Create follow notification
      await Notification.create({ recipient: targetId, sender: req.user._id, type: 'follow' });
      // Emit socket notification
      req.app.get('io').to(targetId).emit('notification', { type: 'follow', sender: req.user });
    }
    await target.save();
    res.json({ following: !isFollowing, followersCount: target.followers.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Search users (for mentions)
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { name:     { $regex: q, $options: 'i' } },
      ]
    }).select('name username avatar semester').limit(10);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get saved posts
exports.getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedPosts',
      populate: { path: 'author', select: 'name username avatar' }
    });
    res.json(user.savedPosts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name username avatar')
      .populate('post', 'content media')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Mark notifications as read
exports.markNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Change password
// @desc  Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    const u = await User.findById(req.user._id);
    if (!await u.matchPassword(currentPassword))
      return res.status(400).json({ message: 'Current password is incorrect' });
    u.password = newPassword;
    await u.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// @desc  Update avatar only
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image provided' });
    const { uploadToCloudinary } = require('../config/cloudinary');
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'knowva/avatars', resource_type: 'image',
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
    });
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: result.secure_url }, { new: true });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// @desc  Update cover photo only
exports.updateCover = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image provided' });
    const { uploadToCloudinary } = require('../config/cloudinary');
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'knowva/covers', resource_type: 'image',
      transformation: [{ width: 1200, height: 400, crop: 'fill' }]
    });
    const user = await User.findByIdAndUpdate(req.user._id, { coverPhoto: result.secure_url }, { new: true });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
