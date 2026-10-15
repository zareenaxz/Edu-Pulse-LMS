const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getBadges, getMyBadges, createBadge, updateBadge, deleteBadge } = require('../controllers/badgeController');

router.get('/', protect, getBadges);
router.get('/me', protect, authorize('student'), getMyBadges);
router.post('/', protect, authorize('admin'), createBadge);
router.patch('/:id', protect, authorize('admin'), updateBadge);
router.delete('/:id', protect, authorize('admin'), deleteBadge);

module.exports = router;
