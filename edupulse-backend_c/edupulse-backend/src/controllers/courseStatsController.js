const asyncHandler = require('express-async-handler');
const { pool } = require('../config/db');

const DAY = 24 * 60 * 60 * 1000;
const parseDate = (s) => (s ? new Date(String(s).replace(' ', 'T')) : null);

const assertCourseAccess = async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM courses WHERE course_id = :id', { id: req.params.courseId });
  const course = rows[0];
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }
  if (req.user.role === 'instructor' && course.instructor_id !== req.user.user_id) {
    res.status(403);
    throw new Error('You do not own this course');
  }
  return course;
};

// Student is "at risk" when barely progressed AND (never active or inactive 14+ days)
const riskOf = (progress, lastActive, enrolledAt) => {
  const ref = parseDate(lastActive) || parseDate(enrolledAt);
  const idleDays = ref ? Math.floor((Date.now() - ref.getTime()) / DAY) : 0;
  if (progress >= 100) return 'completed';
  if (progress < 25 && idleDays >= 14) return 'at_risk';
  if (idleDays >= 14) return 'inactive';
  return 'on_track';
};

// @desc    Full stats for ONE course: overview, which lessons are done / not done, every student's progress
// @route   GET /api/analytics/course/:courseId
const getCourseStats = asyncHandler(async (req, res) => {
  const course = await assertCourseAccess(req, res);
  const c = { c: course.course_id };

  const [[{ lessonsTotal }]] = await pool.execute('SELECT COUNT(*) AS lessonsTotal FROM lessons WHERE course_id = :c', c);
  const [[{ assignmentsTotal }]] = await pool.execute('SELECT COUNT(*) AS assignmentsTotal FROM assignments WHERE course_id = :c', c);
  const [[{ quizzesTotal }]] = await pool.execute('SELECT COUNT(*) AS quizzesTotal FROM quizzes WHERE course_id = :c', c);

  // ---- per student ----
  const [students] = await pool.execute(
    `SELECT e.enrollment_id, e.student_id, e.status, e.enrolled_at, e.completion_date, u.name, u.email,
       (SELECT COUNT(*) FROM lesson_progress lp JOIN lessons l ON l.lesson_id = lp.lesson_id
          WHERE lp.student_id = e.student_id AND l.course_id = :c AND lp.completed = 1) AS completed_lessons,
       (SELECT MAX(lp.last_accessed) FROM lesson_progress lp JOIN lessons l ON l.lesson_id = lp.lesson_id
          WHERE lp.student_id = e.student_id AND l.course_id = :c) AS last_active,
       (SELECT COUNT(DISTINCT s.assignment_id) FROM submissions s JOIN assignments a ON a.assignment_id = s.assignment_id
          WHERE s.student_id = e.student_id AND a.course_id = :c) AS assignments_submitted,
       (SELECT ROUND(AVG(s.marks / a.max_marks * 100), 1) FROM submissions s JOIN assignments a ON a.assignment_id = s.assignment_id
          WHERE s.student_id = e.student_id AND a.course_id = :c AND s.marks IS NOT NULL AND a.max_marks > 0) AS assignment_avg_percent,
       (SELECT COUNT(DISTINCT qa.quiz_id) FROM quiz_attempts qa JOIN quizzes q ON q.quiz_id = qa.quiz_id
          WHERE qa.student_id = e.student_id AND q.course_id = :c AND qa.completed_at IS NOT NULL) AS quizzes_attempted,
       (SELECT ROUND(AVG(qa.score / q.total_marks * 100), 1) FROM quiz_attempts qa JOIN quizzes q ON q.quiz_id = qa.quiz_id
          WHERE qa.student_id = e.student_id AND q.course_id = :c AND qa.completed_at IS NOT NULL AND q.total_marks > 0) AS quiz_avg_percent
     FROM enrollments e JOIN users u ON u.user_id = e.student_id
     WHERE e.course_id = :c ORDER BY e.enrolled_at DESC`,
    c
  );

  const studentRows = students.map((s) => {
    const progress = lessonsTotal ? Math.round((s.completed_lessons / lessonsTotal) * 100) : 0;
    return {
      ...s,
      total_lessons: lessonsTotal,
      progress_percent: progress,
      assignments_total: assignmentsTotal,
      quizzes_total: quizzesTotal,
      health: riskOf(progress, s.last_active, s.enrolled_at),
    };
  });

  // ---- per lesson (which segments are completed / not completed) ----
  const [lessonRows] = await pool.execute(
    `SELECT l.lesson_id, l.title, l.lesson_order,
       (SELECT COUNT(*) FROM lesson_progress lp JOIN enrollments e ON e.student_id = lp.student_id AND e.course_id = l.course_id
          WHERE lp.lesson_id = l.lesson_id AND lp.completed = 1) AS completed_count,
       (SELECT COUNT(*) FROM lesson_progress lp JOIN enrollments e ON e.student_id = lp.student_id AND e.course_id = l.course_id
          WHERE lp.lesson_id = l.lesson_id AND lp.completed = 0) AS in_progress_count,
       (SELECT COUNT(*) FROM lesson_attachments la WHERE la.lesson_id = l.lesson_id) AS attachments
     FROM lessons l WHERE l.course_id = :c ORDER BY l.lesson_order ASC`,
    c
  );
  const n = studentRows.length;
  const lessons = lessonRows.map((l) => {
    const notStarted = Math.max(n - l.completed_count - l.in_progress_count, 0);
    return {
      ...l,
      not_started_count: notStarted,
      completion_rate: n ? Math.round((l.completed_count / n) * 100) : 0,
    };
  });

  // ---- overview ----
  const [[rating]] = await pool.execute(
    'SELECT ROUND(AVG(rating), 2) AS avg_rating, COUNT(*) AS review_count FROM course_reviews WHERE course_id = :c', c);
  const avg = (arr) => (arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null);

  res.json({
    success: true,
    course: { course_id: course.course_id, title: course.title, status: course.status },
    overview: {
      students: n,
      completed_students: studentRows.filter((s) => s.progress_percent >= 100).length,
      at_risk_students: studentRows.filter((s) => s.health === 'at_risk').length,
      avg_progress_percent: avg(studentRows.map((s) => s.progress_percent)) || 0,
      avg_assignment_percent: avg(studentRows.filter((s) => s.assignment_avg_percent !== null).map((s) => Number(s.assignment_avg_percent))),
      avg_quiz_percent: avg(studentRows.filter((s) => s.quiz_avg_percent !== null).map((s) => Number(s.quiz_avg_percent))),
      lessons: lessonsTotal,
      assignments: assignmentsTotal,
      quizzes: quizzesTotal,
      avg_rating: rating.avg_rating ? Number(rating.avg_rating) : 0,
      review_count: rating.review_count,
    },
    lessons,
    students: studentRows,
  });
});

// @desc    ONE student's detail inside a course: each lesson, assignment and quiz with status
// @route   GET /api/analytics/course/:courseId/students/:studentId
const getStudentCourseDetail = asyncHandler(async (req, res) => {
  const course = await assertCourseAccess(req, res);
  const p = { c: course.course_id, s: req.params.studentId };

  const [stu] = await pool.execute(
    `SELECT u.user_id, u.name, u.email, e.enrolled_at, e.status
     FROM enrollments e JOIN users u ON u.user_id = e.student_id
     WHERE e.course_id = :c AND e.student_id = :s`, p);
  if (!stu.length) {
    res.status(404);
    throw new Error('Student is not enrolled in this course');
  }

  const [lessons] = await pool.execute(
    `SELECT l.lesson_id, l.title, l.lesson_order,
       COALESCE(lp.completed, 0) AS completed, lp.completed_at, lp.last_accessed
     FROM lessons l
     LEFT JOIN lesson_progress lp ON lp.lesson_id = l.lesson_id AND lp.student_id = :s
     WHERE l.course_id = :c ORDER BY l.lesson_order`, p);

  const [assignments] = await pool.execute(
    `SELECT a.assignment_id, a.title, a.deadline, a.max_marks,
       s.submission_id, s.status, s.marks, s.submitted_at, s.file_url, s.feedback,
       (SELECT COUNT(*) FROM submission_history h WHERE h.submission_id = s.submission_id) AS previous_versions
     FROM assignments a
     LEFT JOIN submissions s ON s.assignment_id = a.assignment_id AND s.student_id = :s
     WHERE a.course_id = :c ORDER BY a.deadline`, p);

  const [quizzes] = await pool.execute(
    `SELECT q.quiz_id, q.title, q.total_marks,
       COUNT(qa.attempt_id) AS attempts, MAX(qa.score) AS best_score, MAX(qa.completed_at) AS last_attempt_at
     FROM quizzes q
     LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.quiz_id AND qa.student_id = :s AND qa.completed_at IS NOT NULL
     WHERE q.course_id = :c GROUP BY q.quiz_id, q.title, q.total_marks`, p);

  const done = lessons.filter((l) => l.completed).length;
  res.json({
    success: true,
    student: stu[0],
    progress_percent: lessons.length ? Math.round((done / lessons.length) * 100) : 0,
    lessons: lessons.map((l) => ({ ...l, completed: !!l.completed })),
    assignments,
    quizzes,
  });
});

module.exports = { getCourseStats, getStudentCourseDetail };
