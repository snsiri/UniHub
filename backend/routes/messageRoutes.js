const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { upload }  = require('../config/cloudinary');
const { sendMessage, getMessages } = require('../controllers/messageController');

router.post('/',           protect, upload.single('media'), sendMessage);
router.get('/:chatId',     protect, getMessages);

module.exports = router;
