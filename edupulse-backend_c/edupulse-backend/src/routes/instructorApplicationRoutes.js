const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getApplications,
  getMyApplication,
  reviewApplication,
} = require('../controllers/instructorApplicationController');

router.get('/', protect, authorize('admin'), getApplications);
router.get('/me', protect, authorize('instructor'), getMyApplication);
router.patch('/:id/review', protect, authorize('admin'), reviewApplication);

module.exports = router;
