const asyncHandler = require('express-async-handler');
const { pool } = require('../config/db');

const assertCourseOwnedOrAdmin = async (req) => {
  const [rows] = await pool.execute(
    'SELECT * FROM courses WHERE course_id = :id',
    {
      id: req.params.courseId,
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

// ============================================================
// GET ALL LESSONS
// @route GET /api/courses/:courseId/lessons
// ============================================================

const getLessons = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `
      SELECT *
      FROM lessons
      WHERE course_id = :courseId
      ORDER BY lesson_order ASC
    `,
    {
      courseId: req.params.courseId,
    }
  );

  res.json({
    success: true,
    count: rows.length,
    lessons: rows,
  });
});

// ============================================================
// GET SINGLE LESSON
// @route GET /api/courses/:courseId/lessons/:lessonId
// ============================================================

const getLessonById = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `
      SELECT *
      FROM lessons
      WHERE lesson_id = :id
        AND course_id = :courseId
    `,
    {
      id: req.params.lessonId,
      courseId: req.params.courseId,
    }
  );

  if (!rows.length) {
    res.status(404);
    throw new Error('Lesson not found');
  }

  // Get lesson attachments
  const [attachments] = await pool.execute(
    `
      SELECT *
      FROM lesson_attachments
      WHERE lesson_id = :id
      ORDER BY created_at ASC
    `,
    {
      id: req.params.lessonId,
    }
  );

  // Get quizzes linked to this lesson
  const [quizzes] = await pool.execute(
    `
      SELECT
        quiz_id,
        title,
        description,
        total_marks
      FROM quizzes
      WHERE lesson_id = :id
    `,
    {
      id: req.params.lessonId,
    }
  );

  res.json({
    success: true,
    lesson: {
      ...rows[0],
      attachments,
      quizzes,
    },
  });
});

// ============================================================
// CREATE LESSON
// @route POST /api/courses/:courseId/lessons
// ============================================================

const createLesson = asyncHandler(async (req, res) => {
  await assertCourseOwnedOrAdmin(req);

  const {
    title,
    description,
    content,
    video_url,
    lesson_order,
    module_id,
  } = req.body;

  if (!title || !title.trim()) {
    res.status(400);
    throw new Error('title is required');
  }

  let order = lesson_order;

  // If no order is provided, add lesson to the end
  if (order === undefined || order === null || order === '') {
    const [[{ maxOrder }]] = await pool.execute(
      `
        SELECT COALESCE(MAX(lesson_order), 0) AS maxOrder
        FROM lessons
        WHERE course_id = :courseId
      `,
      {
        courseId: req.params.courseId,
      }
    );

    order = Number(maxOrder) + 1;
  }

  const [result] = await pool.execute(
    `
      INSERT INTO lessons
      (
        course_id,
        module_id,
        title,
        description,
        content,
        video_url,
        lesson_order
      )
      VALUES
      (
        :courseId,
        :moduleId,
        :title,
        :description,
        :content,
        :videoUrl,
        :order
      )
    `,
    {
      courseId: req.params.courseId,
      moduleId: module_id || null,
      title: title.trim(),
      description: description || null,
      content: content || null,
      videoUrl: video_url || null,
      order,
    }
  );

  const [rows] = await pool.execute(
    `
      SELECT *
      FROM lessons
      WHERE lesson_id = :id
    `,
    {
      id: result.insertId,
    }
  );

  res.status(201).json({
    success: true,
    lesson: rows[0],
  });
});

// ============================================================
// UPDATE LESSON
// @route PATCH /api/courses/:courseId/lessons/:lessonId
// ============================================================

const updateLesson = asyncHandler(async (req, res) => {
  await assertCourseOwnedOrAdmin(req);

  const {
    title,
    description,
    content,
    video_url,
    lesson_order,
    module_id,
  } = req.body;

  const fields = [];

  const params = {
    id: req.params.lessonId,
    courseId: req.params.courseId,
  };

  // ----------------------------
  // TITLE
  // ----------------------------

  if (title !== undefined) {
    fields.push('title = :title');
    params.title = title.trim();
  }

  // ----------------------------
  // DESCRIPTION
  // ----------------------------

  if (description !== undefined) {
    fields.push('description = :description');
    params.description = description || null;
  }

  // ----------------------------
  // CONTENT
  // ----------------------------

  if (content !== undefined) {
    fields.push('content = :content');
    params.content = content || null;
  }

  // ----------------------------
  // VIDEO URL
  // ----------------------------

  if (video_url !== undefined) {
    fields.push('video_url = :videoUrl');
    params.videoUrl = video_url || null;
  }

  // ----------------------------
  // LESSON ORDER
  // ----------------------------

  if (lesson_order !== undefined) {
    fields.push('lesson_order = :order');
    params.order = lesson_order;
  }

  // ----------------------------
  // MODULE
  // ----------------------------

  if (module_id !== undefined) {
    fields.push('module_id = :moduleId');
    params.moduleId = module_id || null;
  }

  // Nothing to update
  if (!fields.length) {
    res.status(400);
    throw new Error('No updatable fields provided');
  }

  // ----------------------------
  // UPDATE DATABASE
  // ----------------------------

  const [result] = await pool.execute(
    `
      UPDATE lessons
      SET ${fields.join(', ')}
      WHERE lesson_id = :id
        AND course_id = :courseId
    `,
    params
  );

  if (!result.affectedRows) {
    res.status(404);
    throw new Error('Lesson not found');
  }

  // ----------------------------
  // RETURN UPDATED LESSON
  // ----------------------------

  const [rows] = await pool.execute(
    `
      SELECT *
      FROM lessons
      WHERE lesson_id = :id
        AND course_id = :courseId
    `,
    {
      id: req.params.lessonId,
      courseId: req.params.courseId,
    }
  );

  res.json({
    success: true,
    lesson: rows[0],
  });
});

// ============================================================
// DELETE LESSON
// @route DELETE /api/courses/:courseId/lessons/:lessonId
// ============================================================

const deleteLesson = asyncHandler(async (req, res) => {
  await assertCourseOwnedOrAdmin(req);

  const [result] = await pool.execute(
    `
      DELETE FROM lessons
      WHERE lesson_id = :id
        AND course_id = :courseId
    `,
    {
      id: req.params.lessonId,
      courseId: req.params.courseId,
    }
  );

  if (!result.affectedRows) {
    res.status(404);
    throw new Error('Lesson not found');
  }

  res.json({
    success: true,
    message: 'Lesson deleted',
  });
});

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  getLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  assertCourseOwnedOrAdmin,
};