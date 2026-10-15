const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, authorize } = require('../middleware/auth');
const { lessonUpload } = require('../middleware/upload');
const {
  getLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
} = require('../controllers/lessonController');
const {
  uploadAttachments,
  getAttachments,
  deleteAttachment,
} = require('../controllers/attachmentController');

router.get('/', protect, getLessons);
router.post('/', protect, authorize('instructor'), createLesson);
router.get('/:lessonId', protect, getLessonById);
router.patch('/:lessonId', protect, authorize('instructor'), updateLesson);
router.delete('/:lessonId', protect, authorize('instructor'), deleteLesson);

// Lesson files: pdf, doc, slides, video, audio, ...
router.get('/:lessonId/attachments', protect, getAttachments);
router.post('/:lessonId/attachments', protect, authorize('instructor', 'admin'), lessonUpload.array('files', 10), uploadAttachments);
router.delete('/:lessonId/attachments/:attachmentId', protect, authorize('instructor', 'admin'), deleteAttachment);

module.exports = router;
