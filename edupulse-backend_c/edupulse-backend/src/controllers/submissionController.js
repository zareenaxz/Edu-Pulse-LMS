const asyncHandler = require('express-async-handler');
const { pool } = require('../config/db');

// @desc    Student submits / re-submits work (status 'late' when past deadline)
// @route   POST /api/assignments/:assignmentId/submissions
const submitWork = asyncHandler(async (req, res) => {
  const [aRows] = await pool.execute('SELECT * FROM assignments WHERE assignment_id = :id', { id: req.params.assignmentId });
  const assignment = aRows[0];
  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }

  const [enr] = await pool.execute(
    'SELECT enrollment_id FROM enrollments WHERE student_id = :s AND course_id = :c',
    { s: req.user.user_id, c: assignment.course_id }
  );
  if (!enr.length) {
    res.status(403);
    throw new Error('Not enrolled in this course');
  }

  const late = assignment.deadline && new Date() > new Date(assignment.deadline.replace(' ', 'T'));
  const status = late ? 'late' : 'submitted';
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : req.body.file_url || null;
  const text = req.body.submission_text || null;

  const [existing] = await pool.execute(
    'SELECT * FROM submissions WHERE assignment_id = :a AND student_id = :s',
    { a: assignment.assignment_id, s: req.user.user_id }
  );

  let id;
  if (existing.length) {
    id = existing[0].submission_id;
    // Keep the previous version so instructors can still see every earlier submission
    const prev = existing[0];
    await pool.execute(
      `INSERT INTO submission_history
         (submission_id, assignment_id, student_id, submission_text, file_url, status, marks, feedback, submitted_at)
       VALUES (:id, :a, :s, :text, :file, :status, :marks, :feedback, :at)`,
      {
        id, a: prev.assignment_id, s: prev.student_id, text: prev.submission_text, file: prev.file_url,
        status: prev.status, marks: prev.marks, feedback: prev.feedback, at: prev.submitted_at,
      }
    );
    await pool.execute(
      `UPDATE submissions SET submission_text = :text, file_url = :fileUrl, submitted_at = NOW(),
         status = :status, marks = NULL, feedback = NULL, graded_by = NULL, graded_at = NULL
       WHERE submission_id = :id`,
      { text, fileUrl, status, id }
    );
  } else {
    const [r] = await pool.execute(
      `INSERT INTO submissions (assignment_id, student_id, submission_text, file_url, status)
       VALUES (:a, :s, :text, :fileUrl, :status)`,
      { a: assignment.assignment_id, s: req.user.user_id, text, fileUrl, status }
    );
    id = r.insertId;
  }

  const [rows] = await pool.execute('SELECT * FROM submissions WHERE submission_id = :id', { id });
  res.status(201).json({ success: true, submission: rows[0] });
});

// @desc    Instructor/admin: all submissions for an assignment
// @route   GET /api/assignments/:assignmentId/submissions
const getSubmissionsForAssignment = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT s.*, u.name AS student_name, u.email AS student_email
     FROM submissions s JOIN users u ON u.user_id = s.student_id
     WHERE s.assignment_id = :a ORDER BY s.submitted_at DESC`,
    { a: req.params.assignmentId }
  );
  res.json({ success: true, count: rows.length, submissions: rows });
});

// @route GET /api/assignments/:assignmentId/submissions/me
const getMySubmission = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT * FROM submissions WHERE assignment_id = :a AND student_id = :s',
    { a: req.params.assignmentId, s: req.user.user_id }
  );
  res.json({ success: true, submission: rows[0] || null });
});

// @desc    Grade a submission (marks + feedback)
// @route   PATCH /api/submissions/:id/grade
const gradeSubmission = asyncHandler(async (req, res) => {
  const { marks, feedback } = req.body;
  const [rows] = await pool.execute(
    `SELECT s.*, a.max_marks, c.instructor_id
     FROM submissions s
     JOIN assignments a ON a.assignment_id = s.assignment_id
     JOIN courses c ON c.course_id = a.course_id
     WHERE s.submission_id = :id`,
    { id: req.params.id }
  );
  const sub = rows[0];
  if (!sub) {
    res.status(404);
    throw new Error('Submission not found');
  }
  if (req.user.role === 'instructor' && sub.instructor_id !== req.user.user_id) {
    res.status(403);
    throw new Error('You do not own this course');
  }
  if (marks === undefined || Number(marks) < 0 || Number(marks) > sub.max_marks) {
    res.status(400);
    throw new Error(`marks must be between 0 and ${sub.max_marks}`);
  }

  await pool.execute(
    `UPDATE submissions SET marks = :marks, feedback = :feedback, graded_by = :g, graded_at = NOW(), status = 'graded'
     WHERE submission_id = :id`,
    { marks, feedback: feedback || null, g: req.user.user_id, id: req.params.id }
  );
  const [updated] = await pool.execute('SELECT * FROM submissions WHERE submission_id = :id', { id: req.params.id });
  res.json({ success: true, submission: updated[0] });
});

module.exports = { submitWork, getSubmissionsForAssignment, getMySubmission, gradeSubmission };
