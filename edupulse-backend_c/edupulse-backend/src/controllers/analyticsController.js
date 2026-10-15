const asyncHandler = require('express-async-handler');
const { pool } = require('../config/db');

// @route GET /api/analytics/student
const studentSummary = asyncHandler(async (req, res) => {
  const s = req.user.user_id;

  const [courses] = await pool.execute(
    `SELECT c.course_id, c.title, c.thumbnail, e.status, cat.category_name,
       (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.course_id) AS total_lessons,
       (SELECT COUNT(*) FROM lesson_progress lp JOIN lessons l2 ON l2.lesson_id = lp.lesson_id
          WHERE lp.student_id = :s AND l2.course_id = c.course_id AND lp.completed = 1) AS completed_lessons,
       (SELECT l3.title FROM lessons l3
          WHERE l3.course_id = c.course_id
            AND l3.lesson_id NOT IN (SELECT lp2.lesson_id FROM lesson_progress lp2 WHERE lp2.student_id = :s AND lp2.completed = 1)
          ORDER BY l3.lesson_order ASC LIMIT 1) AS next_lesson_title
     FROM enrollments e
     JOIN courses c ON c.course_id = e.course_id
     JOIN categories cat ON cat.category_id = c.category_id
     WHERE e.student_id = :s
     ORDER BY e.enrolled_at DESC`,
    { s }
  );

  const [upcoming] = await pool.execute(
    `SELECT a.assignment_id, a.course_id, a.title, a.deadline, a.max_marks, c.title AS course_title
     FROM assignments a JOIN courses c ON c.course_id = a.course_id
     WHERE a.course_id IN (SELECT course_id FROM enrollments WHERE student_id = :s)
       AND a.deadline >= NOW()
       AND a.assignment_id NOT IN (SELECT assignment_id FROM submissions WHERE student_id = :s)
     ORDER BY a.deadline ASC LIMIT 5`,
    { s }
  );

  const [recentGrades] = await pool.execute(
    `SELECT sub.submission_id, sub.marks, sub.graded_at, a.assignment_id, a.course_id, a.title, a.max_marks,
            c.title AS course_title
     FROM submissions sub
     JOIN assignments a ON a.assignment_id = sub.assignment_id
     JOIN courses c ON c.course_id = a.course_id
     WHERE sub.student_id = :s AND sub.marks IS NOT NULL
     ORDER BY sub.graded_at DESC LIMIT 5`,
    { s }
  );

  const [[grade]] = await pool.execute(
    `SELECT ROUND(AVG(sub.marks / a.max_marks * 100), 2) AS avg_percent
     FROM submissions sub JOIN assignments a ON a.assignment_id = sub.assignment_id
     WHERE sub.student_id = :s AND sub.marks IS NOT NULL`,
    { s }
  );
  const [[{ badges }]] = await pool.execute('SELECT COUNT(*) AS badges FROM student_badges WHERE student_id = :s', { s });
  const [[{ certificates }]] = await pool.execute('SELECT COUNT(*) AS certificates FROM certificates WHERE student_id = :s', { s });

  // ---- points (XP): 10 per completed lesson + marks earned on graded work + 50 per badge ----
  const [[pts]] = await pool.execute(
    `SELECT
       (SELECT COUNT(*) FROM lesson_progress WHERE student_id = :s AND completed = 1) AS lessons,
       (SELECT COALESCE(SUM(marks), 0) FROM submissions WHERE student_id = :s AND marks IS NOT NULL) AS marks`,
    { s }
  );
  const points = Number(pts.lessons) * 10 + Math.round(Number(pts.marks)) + Number(badges) * 50;

  // ---- study streak: consecutive days (ending today or yesterday) with any learning activity ----
  const [activeDays] = await pool.query(
    `SELECT DATE_FORMAT(t.d, '%Y-%m-%d') AS d FROM (
       SELECT DATE(lp.last_accessed) AS d FROM lesson_progress lp WHERE lp.student_id = :s
       UNION
       SELECT DATE(lp.completed_at) FROM lesson_progress lp WHERE lp.student_id = :s
       UNION
       SELECT DATE(sub.submitted_at) FROM submissions sub WHERE sub.student_id = :s
     ) t WHERE t.d IS NOT NULL`,
    { s }
  );
  const dayKey = (dt) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  const activeSet = new Set(activeDays.map((r) => r.d));
  const cursor = new Date();
  if (!activeSet.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1); // today not studied yet: streak is still alive
  let streakDays = 0;
  while (activeSet.has(dayKey(cursor))) {
    streakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // ---- lessons completed per day, last 7 days ----
  const [doneDays] = await pool.query(
    `SELECT DATE_FORMAT(lp.completed_at, '%Y-%m-%d') AS d, COUNT(*) AS n
     FROM lesson_progress lp
     WHERE lp.student_id = :s AND lp.completed = 1 AND lp.completed_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY d`,
    { s }
  );
  const doneMap = Object.fromEntries(doneDays.map((r) => [r.d, Number(r.n)]));
  const weeklyActivity = [];
  for (let k = 6; k >= 0; k -= 1) {
    const dt = new Date(Date.now() - k * 86400000);
    const key = dayKey(dt);
    weeklyActivity.push({ date: key, day: dt.toLocaleDateString('en-US', { weekday: 'short' }), lessons: doneMap[key] || 0 });
  }
  const weeklyDone = weeklyActivity.reduce((sum, d) => sum + d.lessons, 0);

  res.json({
    success: true,
    coursesEnrolled: courses.length,
    avgGradePercent: grade.avg_percent,
    badgesEarned: badges,
    certificatesEarned: certificates,
    points,
    streakDays,
    weeklyGoal: 4,
    weeklyDone,
    weeklyActivity,
    courses: courses.map((c) => ({
      ...c,
      progress_percent: c.total_lessons ? Math.round((c.completed_lessons / c.total_lessons) * 100) : 0,
    })),
    upcomingAssignments: upcoming,
    recentGrades,
  });
});

// @route GET /api/analytics/instructor
const instructorSummary = asyncHandler(async (req, res) => {
  const i = req.user.user_id;
  const [[{ totalCourses }]] = await pool.execute('SELECT COUNT(*) AS totalCourses FROM courses WHERE instructor_id = :i', { i });
  const [[{ totalStudents }]] = await pool.execute(
    `SELECT COUNT(DISTINCT e.student_id) AS totalStudents FROM enrollments e
     JOIN courses c ON c.course_id = e.course_id WHERE c.instructor_id = :i`, { i });
  const [[{ pendingGrading }]] = await pool.execute(
    `SELECT COUNT(*) AS pendingGrading FROM submissions s
     JOIN assignments a ON a.assignment_id = s.assignment_id
     JOIN courses c ON c.course_id = a.course_id
     WHERE c.instructor_id = :i AND s.graded_at IS NULL`, { i });

  // per-course: students, lessons, average progress, grade, rating
  const [perCourse] = await pool.execute(
    `SELECT c.course_id, c.title, c.status,
       (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.course_id) AS students,
       (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.course_id) AS lessons,
       (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.course_id AND e.status = 'completed') AS completed_students,
       (SELECT ROUND(AVG(s.marks / a.max_marks * 100), 2) FROM submissions s
          JOIN assignments a ON a.assignment_id = s.assignment_id
          WHERE a.course_id = c.course_id AND s.marks IS NOT NULL) AS avg_grade_percent,
       (SELECT ROUND(AVG(r.rating), 2) FROM course_reviews r WHERE r.course_id = c.course_id) AS avg_rating,
       (SELECT COUNT(*) FROM course_reviews r WHERE r.course_id = c.course_id) AS review_count,
       (SELECT COUNT(*) FROM lesson_progress lp JOIN lessons l ON l.lesson_id = lp.lesson_id
          JOIN enrollments e ON e.student_id = lp.student_id AND e.course_id = l.course_id
          WHERE l.course_id = c.course_id AND lp.completed = 1) AS lesson_completions
     FROM courses c WHERE c.instructor_id = :i ORDER BY c.created_at DESC`, { i });

  const courses = perCourse.map((c) => {
    const possible = c.students * c.lessons;
    return { ...c, avg_progress_percent: possible ? Math.round((c.lesson_completions / possible) * 100) : 0 };
  });

  // rating across all my courses
  const [[ratingAll]] = await pool.execute(
    `SELECT ROUND(AVG(r.rating), 2) AS avg_rating, COUNT(*) AS total_reviews
     FROM course_reviews r JOIN courses c ON c.course_id = r.course_id WHERE c.instructor_id = :i`, { i });

  const [recentReviews] = await pool.query(
    `SELECT r.review_id, r.rating, r.comment, r.created_at, u.name AS student_name, c.title AS course_title
     FROM course_reviews r JOIN courses c ON c.course_id = r.course_id JOIN users u ON u.user_id = r.student_id
     WHERE c.instructor_id = :i ORDER BY r.created_at DESC LIMIT 5`, { i });

  // newest assignment submissions + quiz attempts, together
  const [recentAssign] = await pool.query(
    `SELECT 'assignment' AS item_type, s.submission_id AS id, a.title, c.title AS course_title, u.name AS student_name,
            s.submitted_at, s.status, s.marks AS score, a.max_marks AS max_score, s.file_url
     FROM submissions s JOIN assignments a ON a.assignment_id = s.assignment_id
     JOIN courses c ON c.course_id = a.course_id JOIN users u ON u.user_id = s.student_id
     WHERE c.instructor_id = :i ORDER BY s.submitted_at DESC LIMIT 8`, { i });
  const [recentQuiz] = await pool.query(
    `SELECT 'quiz' AS item_type, qa.attempt_id AS id, q.title, c.title AS course_title, u.name AS student_name,
            qa.completed_at AS submitted_at, 'graded' AS status, qa.score AS score, q.total_marks AS max_score, NULL AS file_url
     FROM quiz_attempts qa JOIN quizzes q ON q.quiz_id = qa.quiz_id
     JOIN courses c ON c.course_id = q.course_id JOIN users u ON u.user_id = qa.student_id
     WHERE c.instructor_id = :i AND qa.completed_at IS NOT NULL ORDER BY qa.completed_at DESC LIMIT 8`, { i });
  const recentSubmissions = [...recentAssign, ...recentQuiz]
    .sort((a, b) => String(b.submitted_at || '').localeCompare(String(a.submitted_at || '')))
    .slice(0, 8);

  // last 7 days: lesson completions vs submissions
  const [compDays] = await pool.query(
    `SELECT DATE_FORMAT(lp.completed_at, '%Y-%m-%d') AS d, COUNT(*) AS n
     FROM lesson_progress lp JOIN lessons l ON l.lesson_id = lp.lesson_id JOIN courses c ON c.course_id = l.course_id
     WHERE c.instructor_id = :i AND lp.completed = 1 AND lp.completed_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY d`, { i });
  const [subDays] = await pool.query(
    `SELECT DATE_FORMAT(s.submitted_at, '%Y-%m-%d') AS d, COUNT(*) AS n
     FROM submissions s JOIN assignments a ON a.assignment_id = s.assignment_id JOIN courses c ON c.course_id = a.course_id
     WHERE c.instructor_id = :i AND s.submitted_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY d`, { i });
  const compMap = Object.fromEntries(compDays.map((r) => [r.d, r.n]));
  const subMap = Object.fromEntries(subDays.map((r) => [r.d, r.n]));
  const weeklyActivity = [];
  for (let k = 6; k >= 0; k -= 1) {
    const dt = new Date(Date.now() - k * 86400000);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    weeklyActivity.push({ date: key, day: dt.toLocaleDateString('en-US', { weekday: 'short' }), lesson_completions: compMap[key] || 0, submissions: subMap[key] || 0 });
  }

  // top performers + students who need attention (across all my courses)
  const [roster] = await pool.query(
    `SELECT e.student_id, u.name, c.course_id, c.title AS course_title, e.enrolled_at,
       (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.course_id) AS total_lessons,
       (SELECT COUNT(*) FROM lesson_progress lp JOIN lessons l ON l.lesson_id = lp.lesson_id
          WHERE lp.student_id = e.student_id AND l.course_id = c.course_id AND lp.completed = 1) AS completed_lessons,
       (SELECT MAX(lp.last_accessed) FROM lesson_progress lp JOIN lessons l ON l.lesson_id = lp.lesson_id
          WHERE lp.student_id = e.student_id AND l.course_id = c.course_id) AS last_active
     FROM enrollments e JOIN courses c ON c.course_id = e.course_id JOIN users u ON u.user_id = e.student_id
     WHERE c.instructor_id = :i AND e.status <> 'dropped'`, { i });
  const withProgress = roster.map((r) => ({
    ...r,
    progress_percent: r.total_lessons ? Math.round((r.completed_lessons / r.total_lessons) * 100) : 0,
  }));
  const idleDays = (r) => {
    const ref = new Date(String(r.last_active || r.enrolled_at).replace(' ', 'T'));
    return Math.floor((Date.now() - ref.getTime()) / 86400000);
  };
  const topStudents = [...withProgress].sort((a, b) => b.progress_percent - a.progress_percent).slice(0, 5);
  const atRiskStudents = withProgress
    .filter((r) => r.progress_percent < 25 && idleDays(r) >= 14)
    .map((r) => ({ ...r, idle_days: idleDays(r) }))
    .sort((a, b) => b.idle_days - a.idle_days)
    .slice(0, 5);

  res.json({
    success: true,
    totalCourses, totalStudents, pendingGrading,
    avgRating: ratingAll.avg_rating ? Number(ratingAll.avg_rating) : 0,
    totalReviews: ratingAll.total_reviews,
    courses,
    recentSubmissions,
    recentReviews,
    weeklyActivity,
    topStudents,
    atRiskStudents,
  });
});

// @route GET /api/analytics/admin
const adminSummary = asyncHandler(async (req, res) => {
  const count = async (sql) => (await pool.query(sql))[0][0].n;
  const [totalUsers, totalStudents, totalInstructors, pendingApplications, totalCourses, publishedCourses, pendingCourses, totalEnrollments, certificatesIssued] =
    await Promise.all([
      count('SELECT COUNT(*) AS n FROM users'),
      count(`SELECT COUNT(*) AS n FROM users WHERE role = 'student'`),
      count(`SELECT COUNT(*) AS n FROM users WHERE role = 'instructor'`),
      count(`SELECT COUNT(*) AS n FROM instructor_applications WHERE application_status = 'pending'`),
      count('SELECT COUNT(*) AS n FROM courses'),
      count(`SELECT COUNT(*) AS n FROM courses WHERE status = 'published'`),
      count(`SELECT COUNT(*) AS n FROM courses WHERE status = 'pending'`),
      count('SELECT COUNT(*) AS n FROM enrollments'),
      count('SELECT COUNT(*) AS n FROM certificates'),
    ]);

  const [enrollmentsByMonth] = await pool.query(
    `SELECT DATE_FORMAT(enrolled_at, '%Y-%m') AS month, COUNT(*) AS enrollments
     FROM enrollments GROUP BY month ORDER BY month DESC LIMIT 12`
  );
  const [coursesByCategory] = await pool.query(
    `SELECT cat.category_name, COUNT(c.course_id) AS courses
     FROM categories cat LEFT JOIN courses c ON c.category_id = cat.category_id
     GROUP BY cat.category_id, cat.category_name ORDER BY courses DESC`
  );

  res.json({
    success: true,
    totalUsers, totalStudents, totalInstructors, pendingApplications,
    totalCourses, publishedCourses, pendingCourses, totalEnrollments, certificatesIssued,
    enrollmentsByMonth: enrollmentsByMonth.reverse(),
    coursesByCategory,
  });
});

module.exports = { studentSummary, instructorSummary, adminSummary };
