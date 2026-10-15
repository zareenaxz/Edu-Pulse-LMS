const asyncHandler = require('express-async-handler');
const { pool } = require('../config/db');

const COURSE_SELECT = `
  SELECT
    co.*,
    u.name AS instructor_name,
    u.email AS instructor_email,
    cat.category_name,

    (
      SELECT ROUND(AVG(r.rating), 2)
      FROM course_reviews r
      WHERE r.course_id = co.course_id
    ) AS avg_rating,

    (
      SELECT COUNT(*)
      FROM course_reviews r
      WHERE r.course_id = co.course_id
    ) AS review_count,

    (
      SELECT COUNT(*)
      FROM enrollments en
      WHERE en.course_id = co.course_id
    ) AS enrolled_count

  FROM courses co
  JOIN users u
    ON u.user_id = co.instructor_id
  JOIN categories cat
    ON cat.category_id = co.category_id
`;

// =====================================================
// PUBLIC COURSE CATALOG
// =====================================================

// @desc    Public catalog - published courses only, with search + category filter
// @route   GET /api/courses/catalog?search=&category_id=
const getCatalog = asyncHandler(async (req, res) => {
  const { search, category_id } = req.query;

  const clauses = [`co.status = 'published'`];
  const params = {};

  if (category_id) {
    clauses.push('co.category_id = :categoryId');
    params.categoryId = category_id;
  }

  if (search) {
    clauses.push('co.title LIKE :search');
    params.search = `%${search}%`;
  }

  const [rows] = await pool.query(
    `${COURSE_SELECT}
     WHERE ${clauses.join(' AND ')}
     ORDER BY co.published_at DESC`,
    params
  );

  res.json({
    success: true,
    count: rows.length,
    courses: rows,
  });
});

// =====================================================
// GET COURSES
// =====================================================

// @desc    List courses
//          instructor -> own courses
//          student    -> enrolled courses
//          admin      -> all courses
// @route   GET /api/courses
const getCourses = asyncHandler(async (req, res) => {
  let where = '';
  const params = {};

  if (req.user.role === 'instructor') {
    where = 'WHERE co.instructor_id = :uid';
    params.uid = req.user.user_id;
  } else if (req.user.role === 'student') {
    where =
      'WHERE co.course_id IN (SELECT course_id FROM enrollments WHERE student_id = :uid)';
    params.uid = req.user.user_id;
  }

  const [rows] = await pool.query(
    `${COURSE_SELECT}
     ${where}
     ORDER BY co.created_at DESC`,
    params
  );

  // Attach student counts + lesson counts
  const result = await Promise.all(
    rows.map(async (course) => {
      const [[{ students }]] = await pool.execute(
        `SELECT COUNT(*) AS students
         FROM enrollments
         WHERE course_id = :id`,
        {
          id: course.course_id,
        }
      );

      const [[{ lessons }]] = await pool.execute(
        `SELECT COUNT(*) AS lessons
         FROM lessons
         WHERE course_id = :id`,
        {
          id: course.course_id,
        }
      );

      return {
        ...course,
        students,
        lessons,
      };
    })
  );

  res.json({
    success: true,
    count: result.length,
    courses: result,
  });
});

// =====================================================
// GET SINGLE COURSE
// =====================================================

// @desc    Get single course
// @route   GET /api/courses/:id
const getCourseById = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `${COURSE_SELECT}
     WHERE co.course_id = :id`,
    {
      id: req.params.id,
    }
  );

  if (!rows.length) {
    res.status(404);
    throw new Error('Course not found');
  }

  res.json({
    success: true,
    course: rows[0],
  });
});

// =====================================================
// CREATE COURSE
// =====================================================

// @desc    Create course
//          New courses are saved as drafts.
//          Course approval is NOT required.
// @route   POST /api/courses
const createCourse = asyncHandler(async (req, res) => {
  const {
    category_id,
    title,
    course_code,
    department,
    description,
    learning_outcomes,
    thumbnail,
    difficulty,
    duration_weeks,
    price,
    max_students,
    certificate_enabled,
  } = req.body;

  if (!category_id || !title) {
    res.status(400);
    throw new Error('category_id and title are required');
  }

  const [result] = await pool.execute(
    `INSERT INTO courses (
      category_id,
      instructor_id,
      title,
      course_code,
      department,
      description,
      learning_outcomes,
      thumbnail,
      difficulty,
      duration_weeks,
      price,
      max_students,
      certificate_enabled,
      status,
      published_at
    )
    VALUES (
      :categoryId,
      :instructorId,
      :title,
      :courseCode,
      :department,
      :description,
      :learningOutcomes,
      :thumbnail,
      :difficulty,
      :durationWeeks,
      :price,
      :maxStudents,
      :certificateEnabled,
      'draft',
      NULL
    )`,
    {
      categoryId: category_id,

      instructorId: req.user.user_id,

      title,

      courseCode:
        course_code || null,

      department:
        department || null,

      description:
        description || null,

      learningOutcomes:
        learning_outcomes || null,

      thumbnail:
        thumbnail || null,

      difficulty:
        difficulty || 'Beginner',

      durationWeeks:
        duration_weeks !== undefined &&
        duration_weeks !== ''
          ? Number(duration_weeks)
          : null,

      price:
        price !== undefined &&
        price !== ''
          ? Number(price)
          : 0,

      maxStudents:
        max_students !== undefined &&
        max_students !== ''
          ? Number(max_students)
          : null,

      certificateEnabled:
        certificate_enabled === undefined
          ? 1
          : certificate_enabled
            ? 1
            : 0,
    }
  );

  const [rows] = await pool.execute(
    `${COURSE_SELECT}
     WHERE co.course_id = :id`,
    {
      id: result.insertId,
    }
  );

  res.status(201).json({
    success: true,
    course: rows[0],
  });
});

// =====================================================
// OWNERSHIP CHECK
// =====================================================

const assertOwnedOrAdmin = async (req) => {
  const [rows] = await pool.execute(
    `SELECT *
     FROM courses
     WHERE course_id = :id`,
    {
      id: req.params.id,
    }
  );

  const course = rows[0];

  if (!course) {
    const err = new Error('Course not found');
    err.status = 404;
    throw err;
  }

  if (
    req.user.role === 'instructor' &&
    course.instructor_id !== req.user.user_id
  ) {
    const err = new Error('You do not own this course');
    err.status = 403;
    throw err;
  }

  return course;
};

// =====================================================
// UPDATE COURSE
// =====================================================

// @desc    Update course
//          Instructor can edit own course.
//          Instructor can publish only when account is active.
//          Admin can directly change course status.
// @route   PATCH /api/courses/:id
const updateCourse = asyncHandler(async (req, res) => {
  const course = await assertOwnedOrAdmin(req);

  const {
    category_id,
    title,
    course_code,
    department,
    description,
    learning_outcomes,
    thumbnail,
    difficulty,
    duration_weeks,
    price,
    max_students,
    certificate_enabled,
    status,
  } = req.body;

  const fields = [];

  const params = {
    id: course.course_id,
  };

  // =====================================================
  // BASIC COURSE FIELDS
  // =====================================================

  if (category_id !== undefined) {
    fields.push('category_id = :categoryId');
    params.categoryId = category_id;
  }

  if (title !== undefined) {
    fields.push('title = :title');
    params.title = title;
  }

  if (course_code !== undefined) {
    fields.push('course_code = :courseCode');
    params.courseCode = course_code || null;
  }

  if (department !== undefined) {
    fields.push('department = :department');
    params.department = department || null;
  }

  if (description !== undefined) {
    fields.push('description = :description');
    params.description = description || null;
  }

  if (learning_outcomes !== undefined) {
    fields.push(
      'learning_outcomes = :learningOutcomes'
    );

    params.learningOutcomes =
      learning_outcomes || null;
  }

  if (thumbnail !== undefined) {
    fields.push('thumbnail = :thumbnail');
    params.thumbnail = thumbnail || null;
  }

  if (difficulty !== undefined) {
    fields.push('difficulty = :difficulty');
    params.difficulty = difficulty;
  }

  if (duration_weeks !== undefined) {
    fields.push(
      'duration_weeks = :durationWeeks'
    );

    params.durationWeeks =
      duration_weeks === '' ||
      duration_weeks === null
        ? null
        : Number(duration_weeks);
  }

  if (price !== undefined) {
    fields.push('price = :price');

    params.price =
      price === '' ||
      price === null
        ? 0
        : Number(price);
  }

  if (max_students !== undefined) {
    fields.push(
      'max_students = :maxStudents'
    );

    params.maxStudents =
      max_students === '' ||
      max_students === null
        ? null
        : Number(max_students);
  }

  if (certificate_enabled !== undefined) {
    fields.push(
      'certificate_enabled = :certificateEnabled'
    );

    params.certificateEnabled =
      certificate_enabled ? 1 : 0;
  }

  // =====================================================
  // STATUS / PUBLISHING LOGIC
  // =====================================================

  if (req.user.role === 'instructor') {

    // ---------------------------------------------------
    // INSTRUCTOR IS TRYING TO PUBLISH
    // ---------------------------------------------------

    if (status === 'published') {

      /*
       * Pending instructor can edit courses,
       * but cannot publish them.
       */
      if (req.user.status !== 'active') {
        res.status(403);

        throw new Error(
          'Your instructor account is still not approved by the admin. You cannot publish courses until your account is approved.'
        );
      }

      fields.push(`status = 'published'`);
      fields.push('published_at = NOW()');
    }

    // ---------------------------------------------------
    // INSTRUCTOR IS SAVING AS DRAFT
    // ---------------------------------------------------

    else if (status === 'draft') {
      fields.push(`status = 'draft'`);
      fields.push('published_at = NULL');
    }

    // ---------------------------------------------------
    // INSTRUCTOR IS EDITING WITHOUT STATUS
    // ---------------------------------------------------

    /*
     * Important:
     *
     * If an instructor only edits title, description,
     * pricing, modules-related data, etc., we DO NOT
     * change the existing course status.
     *
     * So:
     * published -> remains published
     * draft     -> remains draft
     */
  }

  // =====================================================
  // ADMIN STATUS CONTROL
  // =====================================================

  else if (req.user.role === 'admin') {

    if (status !== undefined) {

      const allowedStatuses = [
        'draft',
        'published',
        'pending',
      ];

      if (!allowedStatuses.includes(status)) {
        res.status(400);

        throw new Error(
          'Invalid course status'
        );
      }

      fields.push(
        'status = :status'
      );

      params.status = status;

      if (status === 'published') {
        fields.push(
          'published_at = NOW()'
        );
      } else {
        fields.push(
          'published_at = NULL'
        );
      }
    }
  }

  // =====================================================
  // NO CHANGES
  // =====================================================

  if (!fields.length) {
    res.status(400);

    throw new Error(
      'No updatable fields provided'
    );
  }

  // =====================================================
  // UPDATE DATABASE
  // =====================================================

  await pool.execute(
    `UPDATE courses
     SET ${fields.join(', ')}
     WHERE course_id = :id`,
    params
  );

  // =====================================================
  // RETURN UPDATED COURSE
  // =====================================================

  const [rows] = await pool.execute(
    `${COURSE_SELECT}
     WHERE co.course_id = :id`,
    {
      id: course.course_id,
    }
  );

  res.json({
    success: true,
    course: rows[0],
  });
});

// =====================================================
// DELETE COURSE
// =====================================================

// @desc    Delete course
// @route   DELETE /api/courses/:id
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await assertOwnedOrAdmin(req);

  await pool.execute(
    `DELETE FROM courses
     WHERE course_id = :id`,
    {
      id: course.course_id,
    }
  );

  res.json({
    success: true,
    message: 'Course deleted',
  });
});

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  getCatalog,
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  assertOwnedOrAdmin,
};