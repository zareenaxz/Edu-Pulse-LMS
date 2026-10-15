const asyncHandler = require('express-async-handler');
const { pool } = require('../config/db');


// =====================================================
// Check whether the course exists and user owns it
// =====================================================
const verifyCourseOwner = async (courseId, user) => {
  const [rows] = await pool.execute(
    `SELECT course_id, instructor_id, title
     FROM courses
     WHERE course_id = :courseId`,
    {
      courseId
    }
  );

  const course = rows[0];

  if (!course) {
    const error = new Error('Course not found');
    error.status = 404;
    throw error;
  }

  // Instructor can only manage their own course
  if (
    user.role === 'instructor' &&
    Number(course.instructor_id) !== Number(user.user_id)
  ) {
    const error = new Error('You do not own this course');
    error.status = 403;
    throw error;
  }

  return course;
};


// =====================================================
// GET ALL MODULES FOR A COURSE
// GET /api/courses/:courseId/modules
// =====================================================
const getModules = asyncHandler(async (req, res) => {
  const courseId = req.params.courseId;

  await verifyCourseOwner(courseId, req.user);

  // Get modules
  const [modules] = await pool.execute(
    `SELECT
        module_id,
        course_id,
        title,
        module_order,
        created_at
     FROM course_modules
     WHERE course_id = :courseId
     ORDER BY module_order ASC, module_id ASC`,
    {
      courseId
    }
  );

  // Get lessons for each module
  for (const module of modules) {
    const [lessons] = await pool.execute(
      `SELECT
          lesson_id,
          course_id,
          module_id,
          title,
          description,
          content,
          video_url,
          lesson_order,
          created_at
       FROM lessons
       WHERE course_id = :courseId
         AND module_id = :moduleId
       ORDER BY lesson_order ASC, lesson_id ASC`,
      {
        courseId,
        moduleId: module.module_id
      }
    );

    module.lessons = lessons;
  }

  res.json({
    success: true,
    count: modules.length,
    modules
  });
});


// =====================================================
// CREATE MODULE
// POST /api/courses/:courseId/modules
// =====================================================
const createModule = asyncHandler(async (req, res) => {
  const courseId = req.params.courseId;

  await verifyCourseOwner(courseId, req.user);

  const { title, module_order } = req.body;

  // Validate title
  if (!title || !title.trim()) {
    res.status(400);
    throw new Error('Module title is required');
  }

  let order;

  // If frontend does not send order,
  // automatically put module at the end
  if (
    module_order === undefined ||
    module_order === null ||
    module_order === ''
  ) {
    const [rows] = await pool.execute(
      `SELECT COALESCE(MAX(module_order), 0) AS maxOrder
       FROM course_modules
       WHERE course_id = :courseId`,
      {
        courseId
      }
    );

    order = Number(rows[0].maxOrder) + 1;
  } else {
    order = Number(module_order);

    if (!Number.isFinite(order) || order < 1) {
      res.status(400);
      throw new Error('Invalid module order');
    }
  }

  // Insert module
  const [result] = await pool.execute(
    `INSERT INTO course_modules
      (course_id, title, module_order)
     VALUES
      (:courseId, :title, :moduleOrder)`,
    {
      courseId,
      title: title.trim(),
      moduleOrder: order
    }
  );

  // Get newly created module
  const [rows] = await pool.execute(
    `SELECT
        module_id,
        course_id,
        title,
        module_order,
        created_at
     FROM course_modules
     WHERE module_id = :moduleId`,
    {
      moduleId: result.insertId
    }
  );

  res.status(201).json({
    success: true,
    message: 'Module created successfully',
    module: {
      ...rows[0],
      lessons: []
    }
  });
});


// =====================================================
// UPDATE MODULE
// PATCH /api/courses/:courseId/modules/:moduleId
// =====================================================
const updateModule = asyncHandler(async (req, res) => {
  const courseId = req.params.courseId;
  const moduleId = req.params.moduleId;

  await verifyCourseOwner(courseId, req.user);

  const {
    title,
    module_order
  } = req.body;

  const fields = [];
  const params = {
    courseId,
    moduleId
  };

  // Update title
  if (title !== undefined) {
    if (!title || !title.trim()) {
      res.status(400);
      throw new Error('Module title cannot be empty');
    }

    fields.push('title = :title');
    params.title = title.trim();
  }

  // Update order
  if (module_order !== undefined) {
    const order = Number(module_order);

    if (!Number.isFinite(order) || order < 1) {
      res.status(400);
      throw new Error('Invalid module order');
    }

    fields.push('module_order = :moduleOrder');
    params.moduleOrder = order;
  }

  if (fields.length === 0) {
    res.status(400);
    throw new Error('No updatable fields provided');
  }

  const [result] = await pool.execute(
    `UPDATE course_modules
     SET ${fields.join(', ')}
     WHERE module_id = :moduleId
       AND course_id = :courseId`,
    params
  );

  if (!result.affectedRows) {
    res.status(404);
    throw new Error('Module not found');
  }

  // Return updated module
  const [rows] = await pool.execute(
    `SELECT
        module_id,
        course_id,
        title,
        module_order,
        created_at
     FROM course_modules
     WHERE module_id = :moduleId
       AND course_id = :courseId`,
    {
      moduleId,
      courseId
    }
  );

  res.json({
    success: true,
    message: 'Module updated successfully',
    module: rows[0]
  });
});


// =====================================================
// DELETE MODULE
// DELETE /api/courses/:courseId/modules/:moduleId
// =====================================================
const deleteModule = asyncHandler(async (req, res) => {
  const courseId = req.params.courseId;
  const moduleId = req.params.moduleId;

  await verifyCourseOwner(courseId, req.user);

  const [result] = await pool.execute(
    `DELETE FROM course_modules
     WHERE module_id = :moduleId
       AND course_id = :courseId`,
    {
      moduleId,
      courseId
    }
  );

  if (!result.affectedRows) {
    res.status(404);
    throw new Error('Module not found');
  }

  res.json({
    success: true,
    message: 'Module deleted successfully'
  });
});


module.exports = {
  getModules,
  createModule,
  updateModule,
  deleteModule
};