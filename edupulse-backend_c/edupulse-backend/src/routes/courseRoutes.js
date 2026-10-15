const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCatalog,
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');

router.get('/catalog', protect, getCatalog);
router.get('/', protect, getCourses);
router.post('/', protect, authorize('instructor'), createCourse);
router.get('/:id', protect, getCourseById);
router.patch('/:id', protect, authorize('instructor', 'admin'), updateCourse);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteCourse);

module.exports = router;
