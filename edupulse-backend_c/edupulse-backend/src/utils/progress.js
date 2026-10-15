const crypto = require('crypto');
const { pool } = require('../config/db');

// Percentage of lessons completed by a student in a course
async function getCourseProgress(studentId, courseId) {
  const [[{ total }]] = await pool.execute(
    'SELECT COUNT(*) AS total FROM lessons WHERE course_id = :courseId',
    { courseId }
  );
  const [[{ done }]] = await pool.execute(
    `SELECT COUNT(*) AS done FROM lesson_progress lp
     JOIN lessons l ON l.lesson_id = lp.lesson_id
     WHERE lp.student_id = :studentId AND l.course_id = :courseId AND lp.completed = 1`,
    { studentId, courseId }
  );
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}

// Award every badge whose percentage_required <= current progress (idempotent)
async function awardBadges(studentId, courseId, percent) {
  const [badges] = await pool.execute(
    'SELECT badge_id FROM badges WHERE percentage_required <= :percent',
    { percent }
  );
  const newlyEarned = [];
  for (const b of badges) {
    const [r] = await pool.execute(
      `INSERT IGNORE INTO student_badges (student_id, badge_id, course_id)
       VALUES (:studentId, :badgeId, :courseId)`,
      { studentId, badgeId: b.badge_id, courseId }
    );
    if (r.affectedRows) newlyEarned.push(b.badge_id);
  }
  return newlyEarned;
}

// Mark enrollment completed + issue certificate at 100% (idempotent)
async function completeCourseIfDone(studentId, courseId, percent) {
  if (percent < 100) return null;
  await pool.execute(
    `UPDATE enrollments SET status = 'completed', completion_date = COALESCE(completion_date, NOW())
     WHERE student_id = :studentId AND course_id = :courseId`,
    { studentId, courseId }
  );
  const code = `EDU-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  await pool.execute(
    `INSERT IGNORE INTO certificates (student_id, course_id, certificate_code)
     VALUES (:studentId, :courseId, :code)`,
    { studentId, courseId, code }
  );
  const [rows] = await pool.execute(
    'SELECT * FROM certificates WHERE student_id = :studentId AND course_id = :courseId',
    { studentId, courseId }
  );
  return rows[0];
}

module.exports = { getCourseProgress, awardBadges, completeCourseIfDone };
