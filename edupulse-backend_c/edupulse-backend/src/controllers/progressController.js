const asyncHandler = require('express-async-handler');
const { pool } = require('../config/db');
const { getCourseProgress, awardBadges, completeCourseIfDone } = require('../utils/progress');

// @desc    Mark a lesson complete (upsert). Also awards badges and issues a
//          certificate automatically when thresholds are reached.
// @route   POST /api/progress/lessons/:lessonId/complete
const completeLesson = asyncHandler(async (req, res) => {
  const [lessonRows] = await pool.execute('SELECT * FROM lessons WHERE lesson_id = :id', { id: req.params.lessonId });
  const lesson = lessonRows[0];
  if (!lesson) {
    res.status(404);
    throw new Error('Lesson not found');
  }

  const [enr] = await pool.execute(
    'SELECT enrollment_id FROM enrollments WHERE student_id = :s AND course_id = :c',
    { s: req.user.user_id, c: lesson.course_id }
  );
  if (!enr.length) {
    res.status(403);
    throw new Error('Not enrolled in this course');
  }

  await pool.execute(
    `INSERT INTO lesson_progress (student_id, lesson_id, completed, completed_at, last_accessed)
     VALUES (:s, :l, 1, NOW(), NOW())
     ON DUPLICATE KEY UPDATE completed = 1, completed_at = COALESCE(completed_at, NOW()), last_accessed = NOW()`,
    { s: req.user.user_id, l: lesson.lesson_id }
  );

  const progress = await getCourseProgress(req.user.user_id, lesson.course_id);
  const newBadges = await awardBadges(req.user.user_id, lesson.course_id, progress.percent);
  const certificate = await completeCourseIfDone(req.user.user_id, lesson.course_id, progress.percent);

  res.json({ success: true, progress, newBadges, certificate });
});

// @desc    Track that a lesson was opened (updates last_accessed without completing)
// @route   POST /api/progress/lessons/:lessonId/access
const touchLesson = asyncHandler(async (req, res) => {
  await pool.execute(
    `INSERT INTO lesson_progress (student_id, lesson_id, completed, last_accessed)
     VALUES (:s, :l, 0, NOW())
     ON DUPLICATE KEY UPDATE last_accessed = NOW()`,
    { s: req.user.user_id, l: req.params.lessonId }
  );
  res.json({ success: true });
});

// @desc    My progress in a course: overall percent + per-lesson completion
// @route   GET /api/progress/courses/:courseId
const getMyCourseProgress = asyncHandler(async (req, res) => {
  const progress = await getCourseProgress(req.user.user_id, req.params.courseId);
  const [lessons] = await pool.execute(
    `SELECT l.lesson_id, l.title, l.lesson_order,
            COALESCE(lp.completed, 0) AS completed, lp.completed_at, lp.last_accessed
     FROM lessons l
     LEFT JOIN lesson_progress lp ON lp.lesson_id = l.lesson_id AND lp.student_id = :s
     WHERE l.course_id = :c ORDER BY l.lesson_order`,
    { s: req.user.user_id, c: req.params.courseId }
  );
  res.json({ success: true, progress, lessons });
});

module.exports = { completeLesson, touchLesson, getMyCourseProgress };
