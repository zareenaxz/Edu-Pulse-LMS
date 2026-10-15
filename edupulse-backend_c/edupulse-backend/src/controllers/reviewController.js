const asyncHandler = require('express-async-handler');
const { pool } = require('../config/db');

const requireCourse = async (res, courseId) => {
  const [rows] = await pool.execute('SELECT course_id, instructor_id FROM courses WHERE course_id = :id', { id: courseId });
  if (!rows.length) {
    res.status(404);
    throw new Error('Course not found');
  }
  return rows[0];
};

// @desc    Reviews + rating summary for a course
// @route   GET /api/courses/:courseId/reviews
const getReviews = asyncHandler(async (req, res) => {
  await requireCourse(res, req.params.courseId);

  const [reviews] = await pool.execute(
    `SELECT r.review_id, r.rating, r.comment, r.created_at, r.updated_at, r.student_id, u.name AS student_name
     FROM course_reviews r JOIN users u ON u.user_id = r.student_id
     WHERE r.course_id = :c ORDER BY r.updated_at DESC`,
    { c: req.params.courseId }
  );

  const [[summary]] = await pool.execute(
    `SELECT COUNT(*) AS review_count, ROUND(AVG(rating), 2) AS avg_rating
     FROM course_reviews WHERE course_id = :c`,
    { c: req.params.courseId }
  );
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => { distribution[r.rating] += 1; });

  let myReview = null;
  if (req.user.role === 'student') {
    myReview = reviews.find((r) => r.student_id === req.user.user_id) || null;
  }

  res.json({
    success: true,
    avg_rating: summary.avg_rating ? Number(summary.avg_rating) : 0,
    review_count: summary.review_count,
    distribution,
    myReview,
    reviews,
  });
});

// @desc    Rate a course (create or update my review). Only enrolled students.
// @route   POST /api/courses/:courseId/reviews   { rating: 1-5, comment? }
const upsertReview = asyncHandler(async (req, res) => {
  await requireCourse(res, req.params.courseId);
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('rating must be a whole number from 1 to 5');
  }
  const [enr] = await pool.execute(
    'SELECT enrollment_id FROM enrollments WHERE student_id = :s AND course_id = :c',
    { s: req.user.user_id, c: req.params.courseId }
  );
  if (!enr.length) {
    res.status(403);
    throw new Error('Enroll in this course before reviewing it');
  }

  await pool.execute(
    `INSERT INTO course_reviews (course_id, student_id, rating, comment)
     VALUES (:c, :s, :rating, :comment)
     ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)`,
    { c: req.params.courseId, s: req.user.user_id, rating, comment: (req.body.comment || '').trim() || null }
  );
  const [rows] = await pool.execute(
    'SELECT * FROM course_reviews WHERE course_id = :c AND student_id = :s',
    { c: req.params.courseId, s: req.user.user_id }
  );
  res.status(201).json({ success: true, review: rows[0] });
});

// @desc    Delete my review (admin can delete any via ?review_id=)
// @route   DELETE /api/courses/:courseId/reviews
const deleteReview = asyncHandler(async (req, res) => {
  let result;
  if (req.user.role === 'admin' && req.query.review_id) {
    [result] = await pool.execute('DELETE FROM course_reviews WHERE review_id = :id AND course_id = :c',
      { id: req.query.review_id, c: req.params.courseId });
  } else {
    [result] = await pool.execute('DELETE FROM course_reviews WHERE student_id = :s AND course_id = :c',
      { s: req.user.user_id, c: req.params.courseId });
  }
  if (!result.affectedRows) {
    res.status(404);
    throw new Error('Review not found');
  }
  res.json({ success: true, message: 'Review deleted' });
});

module.exports = { getReviews, upsertReview, deleteReview };
