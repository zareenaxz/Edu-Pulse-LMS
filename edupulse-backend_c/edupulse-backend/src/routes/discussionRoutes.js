const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/discussionController');

router.get('/', protect, c.getDiscussions);
router.post('/', protect, c.createDiscussion);
router.delete('/replies/:replyId', protect, c.deleteReply);
router.get('/:id', protect, c.getDiscussionById);
router.delete('/:id', protect, c.deleteDiscussion);
router.post('/:id/replies', protect, c.addReply);

module.exports = router;
