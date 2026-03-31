const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  accessChat, createGroup, getMyChats, renameGroup,
  addToGroup, removeFromGroup, leaveGroup, getGroupDetails
} = require('../controllers/chatController');

router.post('/',                       protect, accessChat);
router.post('/group',                  protect, createGroup);
router.get('/',                        protect, getMyChats);
router.get('/:chatId/details',         protect, getGroupDetails);
router.put('/:chatId/rename',          protect, renameGroup);
router.put('/:chatId/add',             protect, addToGroup);
router.put('/:chatId/remove',          protect, removeFromGroup);
router.put('/:chatId/leave',           protect, leaveGroup);

module.exports = router;
