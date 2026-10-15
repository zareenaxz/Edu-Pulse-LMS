const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/quizController');

router.get('/', protect, c.getQuizzes);
router.post('/', protect, authorize('instructor'), c.createQuiz);

// fixed paths must precede /:id
router.get('/attempts/me', protect, authorize('student'), c.getMyAttempts);
router.post('/attempts/:attemptId/submit', protect, authorize('student'), c.submitAttempt);
router.patch('/questions/:questionId', protect, authorize('instructor'), c.updateQuestion);
router.delete('/questions/:questionId', protect, authorize('instructor'), c.deleteQuestion);

router.get('/:id', protect, c.getQuizById);
router.patch('/:id', protect, authorize('instructor'), c.updateQuiz);
router.delete('/:id', protect, authorize('instructor'), c.deleteQuiz);
router.post('/:id/questions', protect, authorize('instructor'), c.addQuestion);
router.post('/:id/attempts', protect, authorize('student'), c.startAttempt);
router.get('/:id/attempts', protect, authorize('instructor'), c.getQuizAttempts);

module.exports = router;
