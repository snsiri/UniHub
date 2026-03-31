const express = require('express');
const router  = express.Router();
const { protect, isDeveloper } = require('../middleware/auth');
const {
  classify, checkSimilarity, getModules, addModule,
  deleteModule, getStats, getEvents
} = require('../controllers/aiController');

router.post('/classify',      protect, classify);
router.post('/similarity',    protect, checkSimilarity);
router.get('/events',         protect, getEvents);
router.get('/modules',        protect, isDeveloper, getModules);
router.post('/modules',       protect, isDeveloper, addModule);
router.delete('/modules/:id', protect, isDeveloper, deleteModule);
router.get('/stats',          protect, isDeveloper, getStats);

module.exports = router;
