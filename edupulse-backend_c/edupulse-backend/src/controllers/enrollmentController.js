const asyncHandler = require('express-async-handler');
const { pool } = require('../config/db');

// @desc    Student enrolls in a course
// @route   POST /api/enrollments
// body: { course_id }
const enroll = asyncHandler(async (req, res) => {
  const { course_id } = req.body;
  if (!course_id) {
    res.status(400);
    throw new Error('course_id is required');
  }

  const [courseRows] = await pool.execute('SELECT * FROM courses WHERE course_id = :id', { id: course_id });
  if (!courseRows.length) {
    res.status(404);
    throw new Error('Course not found');
  }

  const [existing] = await pool.execute(
    'SELECT * FROM enrollments WHERE student_id = :studentId AND course_id = :courseId',
    { studentId: req.user.user_id, courseId: course_id }
  );
  if (existing.length) {
    res.status(409);
    throw new Error('Already enrolled in this course');
  }

  const [result] = await pool.execute(
    `INSERT INTO enrollments (student_id, course_id, status) VALUES (:studentId, :courseId, 'active')`,
    { studentId: req.user.user_id, courseId: course_id }
  );
  const [rows] = await pool.execute('SELECT * FROM enrollments WHERE enrollment_id = :id', { id: result.insertId });
  res.status(201).json({ success: true, enrollment: rows[0] });
});

// @desc    My enrollments, with course info and computed progress percentage
// @route   GET /api/enrollments/me
const getMyEnrollments = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT e.*, c.title, c.thumbnail, c.difficulty, c.status AS course_status,
       (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.course_id) AS total_lessons,
       (SELECT COUNT(*) FROM lesson_progress lp
          JOIN lessons l2 ON l2.lesson_id = lp.lesson_id
          WHERE lp.student_id = e.student_id AND l2.course_id = c.course_id AND lp.completed = 1) AS completed_lessons
     FROM enrollments e
     JOIN courses c ON c.course_id = e.course_id
     WHERE e.student_id = :studentId
     ORDER BY e.enrolled_at DESC`,
    { studentId: req.user.user_id }
  );

  const result = rows.map((r) => ({
    ...r,
    progress_percent: r.total_lessons ? Math.round((r.completed_lessons / r.total_lessons) * 100) : 0,
  }));

  res.json({ success: true, count: result.length, enrollments: result });
});

// @desc    Roster for a course (instructor/admin), with per-student progress
// @route   GET /api/enrollments/course/:courseId
const getCourseRoster = asyncHandler(async (req, res) => {
  const [courseRows] = await pool.execute('SELECT * FROM courses WHERE course_id = :id', { id: req.params.courseId });
  const course = courseRows[0];
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }
  if (req.user.role === 'instructor' && course.instructor_id !== req.user.user_id) {
    res.status(403);
    throw new Error('You do not own this course');
  }

  const [rows] = await pool.execute(
    `SELECT e.*, u.name, u.email,
       (SELECT COUNT(*) FROM lessons l WHERE l.course_id = :courseId) AS total_lessons,
       (SELECT COUNT(*) FROM lesson_progress lp
          JOIN lessons l2 ON l2.lesson_id = lp.lesson_id
          WHERE lp.student_id = e.student_id AND l2.course_id = :courseId AND lp.completed = 1) AS completed_lessons
     FROM enrollments e
     JOIN users u ON u.user_id = e.student_id
     WHERE e.course_id = :courseId
     ORDER BY e.enrolled_at DESC`,
    { courseId: req.params.courseId }
  );

  const result = rows.map((r) => ({
    ...r,
    progress_percent: r.total_lessons ? Math.round((r.completed_lessons / r.total_lessons) * 100) : 0,
  }));

  res.json({ success: true, count: result.length, students: result });
});

// @desc    Update enrollment status (drop / complete)
// @route   PATCH /api/enrollments/:id/status
const updateEnrollmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'completed', 'dropped'].includes(status)) {
    res.status(400);
    throw new Error("status must be 'active', 'completed', or 'dropped'");
  }

  const [rows] = await pool.execute('SELECT * FROM enrollments WHERE enrollment_id = :id', { id: req.params.id });
  const enrollment = rows[0];
  if (!enrollment) {
    res.status(404);
    throw new Error('Enrollment not found');
  }
  if (req.user.role === 'student' && enrollment.student_id !== req.user.user_id) {
    res.status(403);
    throw new Error('Not your enrollment');
  }

  const completionDate = status === 'completed' ? 'NOW()' : 'NULL';
  await pool.query(
    `UPDATE enrollments SET status = ?, completion_date = ${completionDate} WHERE enrollment_id = ?`,
    [status, req.params.id]
  );
  const [updated] = await pool.execute('SELECT * FROM enrollments WHERE enrollment_id = :id', { id: req.params.id });
  res.json({ success: true, enrollment: updated[0] });
});

// @desc    Remove a student from a course (instructor/admin)
// @route   DELETE /api/enrollments/:id
const removeEnrollment = asyncHandler(async (req, res) => {
  const [result] = await pool.execute('DELETE FROM enrollments WHERE enrollment_id = :id', { id: req.params.id });
  if (!result.affectedRows) {
    res.status(404);
    throw new Error('Enrollment not found');
  }
  res.json({ success: true, message: 'Enrollment removed' });
});

module.exports = { enroll, getMyEnrollments, getCourseRoster, updateEnrollmentStatus, removeEnrollment };
