// Demo data. Run `npm run migrate` first (creates tables + initial categories/badges).
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const TABLES = [
  'quiz_answers', 'quiz_attempts', 'quiz_questions', 'quizzes', 'submissions', 'assignments',
  'discussion_replies', 'discussions', 'certificates', 'student_badges', 'bookmarks',
  'lesson_progress', 'enrollments', 'lessons', 'courses', 'instructor_applications', 'users',
];

async function clear() {
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const t of TABLES) await pool.query(`TRUNCATE TABLE ${t}`);
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
}

async function seed() {
  await clear();
  const pw = await bcrypt.hash('password123', 10);

  const addUser = async (name, email, role, status = 'active') =>
    (await pool.execute(
      'INSERT INTO users (name, email, password, role, status) VALUES (?,?,?,?,?)',
      [name, email, pw, role, status]
    ))[0].insertId;

  const admin = await addUser('Alex Robinson', 'admin@edupulse.io', 'admin');
  const inst1 = await addUser('Prof. Sarah Anderson', 'sarah.anderson@edupulse.io', 'instructor');
  const inst2 = await addUser('David Kim', 'david.kim@edupulse.io', 'instructor');
  const instPending = await addUser('Elena Rostova', 'elena@rustlabs.io', 'instructor', 'pending');
  const s1 = await addUser('Sarah Chen', 's.chen@university.edu', 'student');
  const s2 = await addUser('Alex Johnson', 'a.johnson@university.edu', 'student');
  const s3 = await addUser('Marcus Rodriguez', 'm.rodriguez@university.edu', 'student');
  await addUser('Jane Watson', 'jane@watson.co', 'student', 'blocked');

  await pool.execute(
    `INSERT INTO instructor_applications (user_id, qualification, experience) VALUES (?,?,?)`,
    [instPending, 'PhD Physics, MIT', '6 years teaching quantum computing']
  );
  await pool.execute(
    `INSERT INTO instructor_applications (user_id, qualification, experience, application_status, reviewed_by, reviewed_at)
     VALUES (?,?,?, 'approved', ?, NOW())`,
    [inst1, 'PhD Computer Science', '10 years teaching programming', admin]
  );

  const [cats] = await pool.query('SELECT category_id, category_name FROM categories');
  const cat = Object.fromEntries(cats.map((c) => [c.category_name, c.category_id]));

  const addCourse = async (instructor, category, title, description, difficulty, status) =>
    (await pool.execute(
      `INSERT INTO courses (category_id, instructor_id, title, description, difficulty, status, published_at)
       VALUES (?,?,?,?,?,?, ${status === 'published' ? 'NOW()' : 'NULL'})`,
      [category, instructor, title, description, difficulty, status]
    ))[0].insertId;

  const js = await addCourse(inst1, cat['Web Development'], 'JavaScript Fundamentals',
    'Variables, functions, DOM and modern ES6+.', 'Beginner', 'published');
  const sql = await addCourse(inst2, cat['Database'], 'SQL for Beginners',
    'Queries, joins and schema design.', 'Beginner', 'published');
  await addCourse(inst1, cat['Cybersecurity'], 'Intro to Cybersecurity',
    'Threats, defenses and best practices.', 'Intermediate', 'pending');

  const lessonIds = [];
  const lessonTitles = ['Getting Started', 'Variables & Types', 'Functions', 'Working with the DOM'];
  for (let i = 0; i < lessonTitles.length; i++) {
    const [r] = await pool.execute(
      `INSERT INTO lessons (course_id, title, description, content, lesson_order) VALUES (?,?,?,?,?)`,
      [js, lessonTitles[i], `Lesson ${i + 1}`, `Content for ${lessonTitles[i]}`, i + 1]
    );
    lessonIds.push(r.insertId);
  }
  await pool.execute(
    `INSERT INTO lessons (course_id, title, description, lesson_order) VALUES (?,?,?,1), (?,?,?,2)`,
    [sql, 'SELECT Basics', 'Intro to SELECT', sql, 'Joins', 'INNER/LEFT joins']
  );

  for (const [student, course] of [[s1, js], [s2, js], [s3, js], [s1, sql]]) {
    await pool.execute('INSERT INTO enrollments (student_id, course_id) VALUES (?,?)', [student, course]);
  }
  // s1 completed 2 of 4 lessons -> Bronze + Silver eligible
  for (const l of lessonIds.slice(0, 2)) {
    await pool.execute(
      'INSERT INTO lesson_progress (student_id, lesson_id, completed, completed_at) VALUES (?,?,1,NOW())',
      [s1, l]
    );
  }
  const [badges] = await pool.query('SELECT badge_id, percentage_required FROM badges WHERE percentage_required <= 50');
  for (const b of badges) {
    await pool.execute('INSERT INTO student_badges (student_id, badge_id, course_id) VALUES (?,?,?)', [s1, b.badge_id, js]);
  }
  await pool.execute('INSERT INTO bookmarks (student_id, lesson_id) VALUES (?,?)', [s1, lessonIds[2]]);

  const [a1] = await pool.execute(
    `INSERT INTO assignments (course_id, lesson_id, title, description, deadline, max_marks)
     VALUES (?,?,?,?, DATE_ADD(NOW(), INTERVAL 7 DAY), 100)`,
    [js, lessonIds[1], 'Variables Exercise', 'Complete the practice problems.']
  );
  await pool.execute(
    `INSERT INTO submissions (assignment_id, student_id, submission_text, status) VALUES (?,?,?, 'submitted')`,
    [a1.insertId, s1, 'My answers...']
  );
  await pool.execute(
    `INSERT INTO submissions (assignment_id, student_id, submission_text, marks, feedback, graded_by, graded_at, status)
     VALUES (?,?,?,?,?,?, NOW(), 'graded')`,
    [a1.insertId, s2, 'My answers...', 88, 'Great work!', inst1]
  );

  const [q] = await pool.execute(
    `INSERT INTO quizzes (course_id, lesson_id, title, description, total_marks) VALUES (?,?,?,?,2)`,
    [js, lessonIds[1], 'Variables Quiz', 'Quick check on variables']
  );
  await pool.execute(
    `INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks)
     VALUES (?,?,?,?,?,?,?,1), (?,?,?,?,?,?,?,1)`,
    [q.insertId, 'Which keyword declares a block-scoped variable?', 'var', 'let', 'def', 'dim', 'B',
     q.insertId, 'typeof null returns?', "'null'", "'undefined'", "'object'", "'number'", 'C']
  );

  const [d] = await pool.execute(
    'INSERT INTO discussions (course_id, user_id, title, content) VALUES (?,?,?,?)',
    [js, s1, 'let vs const?', 'When should I prefer const?']
  );
  await pool.execute(
    'INSERT INTO discussion_replies (discussion_id, user_id, content) VALUES (?,?,?)',
    [d.insertId, inst1, 'Default to const, use let only when you need to reassign.']
  );

  console.log('Seed complete. Demo accounts (password: "password123"):');
  console.log('  admin@edupulse.io | sarah.anderson@edupulse.io | david.kim@edupulse.io');
  console.log('  elena@rustlabs.io (pending instructor) | s.chen@university.edu | a.johnson@university.edu');
  console.log('  m.rodriguez@university.edu | jane@watson.co (blocked)');
}

const run = process.argv.includes('--destroy')
  ? clear().then(() => console.log('All data cleared (categories & badges kept).'))
  : seed();

run.then(() => pool.end()).catch((e) => { console.error(e); process.exit(1); });
