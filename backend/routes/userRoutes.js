const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { upload }  = require('../config/cloudinary');
const {
  getUserProfile, updateProfile, toggleFollow, updateAvatar, updateCover,
  searchUsers, getSavedPosts, getNotifications, markNotificationsRead,
  changePassword
} = require('../controllers/userController');

router.get('/search',             protect, searchUsers);
router.get('/saved',              protect, getSavedPosts);
router.get('/notifications',      protect, getNotifications);
router.put('/notifications/read', protect, markNotificationsRead);
router.put('/password',           protect, changePassword);
router.put('/profile',            protect, upload.single('avatar'), updateProfile);
router.get('/:username',          protect, getUserProfile);
router.post('/:id/follow',        protect, toggleFollow);
router.put('/avatar',             protect, upload.single('avatar'), updateAvatar);
router.put('/cover',              protect, upload.single('cover'),  updateCover);

module.exports = router;
