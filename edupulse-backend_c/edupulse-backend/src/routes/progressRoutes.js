const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { completeLesson, touchLesson, getMyCourseProgress } = require('../controllers/progressController');

router.post('/lessons/:lessonId/complete', protect, authorize('student'), completeLesson);
router.post('/lessons/:lessonId/access', protect, authorize('student'), touchLesson);
router.get('/courses/:courseId', protect, authorize('student'), getMyCourseProgress);

module.exports = router;
