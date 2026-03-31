const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { upload }  = require('../config/cloudinary');
const {
  createPost, getFeed, getStudyMaterials, getPost,
  editPost, deletePost, toggleLike, toggleSave,
  votePoll, addComment, replyComment, downloadPost, getUserPosts, getTrending
} = require('../controllers/postController');

router.get('/feed',                    protect, getFeed);
router.get('/trending',                protect, getTrending);
router.get('/study-materials',         protect, getStudyMaterials);
router.get('/user/:userId',            protect, getUserPosts);
router.post('/',                       protect, upload.array('media', 10), createPost);
router.get('/:id',                     protect, getPost);
router.put('/:id',                     protect, editPost);
router.delete('/:id',                  protect, deletePost);
router.post('/:id/like',               protect, toggleLike);
router.post('/:id/save',               protect, toggleSave);
router.post('/:id/vote',               protect, votePoll);
router.post('/:id/download',           protect, downloadPost);
router.post('/:id/comments',           protect, addComment);
router.post('/:id/comments/:commentId/replies', protect, replyComment);

module.exports = router;
