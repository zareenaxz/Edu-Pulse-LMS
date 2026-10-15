const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { studentSummary, instructorSummary, adminSummary } = require('../controllers/analyticsController');
const { getCourseStats, getStudentCourseDetail } = require('../controllers/courseStatsController');

router.get('/student', protect, authorize('student'), studentSummary);
router.get('/instructor', protect, authorize('instructor'), instructorSummary);
router.get('/course/:courseId', protect, authorize('instructor', 'admin'), getCourseStats);
router.get('/course/:courseId/students/:studentId', protect, authorize('instructor', 'admin'), getStudentCourseDetail);
router.get('/admin', protect, authorize('admin'), adminSummary);

module.exports = router;
