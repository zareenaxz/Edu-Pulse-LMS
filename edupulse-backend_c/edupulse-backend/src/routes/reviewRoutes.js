const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, authorize } = require('../middleware/auth');
const { getReviews, upsertReview, deleteReview } = require('../controllers/reviewController');

router.get('/', protect, getReviews);
router.post('/', protect, authorize('student'), upsertReview);
router.delete('/', protect, authorize('student', 'admin'), deleteReview);

module.exports = router;
