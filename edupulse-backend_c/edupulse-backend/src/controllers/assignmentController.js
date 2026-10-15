const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');

const { pool } = require('../config/db');
const { uploadDir } = require('../middleware/upload');

// ============================================================
// ALLOWED ASSIGNMENT QUESTION FILE TYPES
// ============================================================

const ALLOWED_QUESTION_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
];

// ============================================================
// DELETE UPLOADED FILE SAFELY
// ============================================================

const removeFileQuietly = (fileUrl) => {
  if (!fileUrl || !fileUrl.startsWith('/uploads/')) {
    return;
  }

  const fullPath = path.join(
    uploadDir,
    path.basename(fileUrl)
  );

  fs.unlink(fullPath, () => {});
};

// ============================================================
// CHECK COURSE OWNERSHIP
// ============================================================

const loadOwnedCourse = async (req, res, courseId) => {
  const [rows] = await pool.execute(
    `
      SELECT *
      FROM courses
      WHERE course_id = :id
    `,
    {
      id: courseId,
    }
  );

  const course = rows[0];

  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  // Instructor can only create/update/delete assignments
  // for their own courses.
  if (
    req.user.role === 'instructor' &&
    course.instructor_id !== req.user.user_id
  ) {
    res.status(403);
    throw new Error('You do not own this course');
  }

  return course;
};

// ============================================================
// GET ALL ASSIGNMENTS
// GET /api/assignments
// GET /api/assignments?course_id=1
// ============================================================

const getAssignments = asyncHandler(async (req, res) => {
  const clauses = [];
  const params = {};

  // Optional course filter
  if (req.query.course_id) {
    clauses.push('a.course_id = :courseId');

    params.courseId = req.query.course_id;
  }

  // Instructor can only see assignments
  // belonging to their own courses.
  if (req.user.role === 'instructor') {
    clauses.push('c.instructor_id = :uid');

    params.uid = req.user.user_id;
  }

  // Student can only see assignments from
  // courses they are enrolled in.
  if (req.user.role === 'student') {
    clauses.push(
      `
        a.course_id IN (
          SELECT course_id
          FROM enrollments
          WHERE student_id = :uid
        )
      `
    );

    params.uid = req.user.user_id;
  }

  const where = clauses.length
    ? `WHERE ${clauses.join(' AND ')}`
    : '';

  const [rows] = await pool.query(
    `
      SELECT
        a.*,
        c.title AS course_title,

        (
          SELECT COUNT(*)
          FROM submissions s
          WHERE s.assignment_id = a.assignment_id
        ) AS submissions_count,

        (
          SELECT COUNT(*)
          FROM submissions s
          WHERE
            s.assignment_id = a.assignment_id
            AND s.graded_at IS NULL
        ) AS pending_count

      FROM assignments a

      JOIN courses c
        ON c.course_id = a.course_id

      ${where}

      ORDER BY a.deadline ASC
    `,
    params
  );

  let result = rows;

  // ==========================================================
  // ADD CURRENT STUDENT'S SUBMISSION
  // ==========================================================

  if (
    req.user.role === 'student' &&
    rows.length
  ) {
    const assignmentIds = rows.map(
      (row) => row.assignment_id
    );

    const [subs] = await pool.query(
      `
        SELECT *
        FROM submissions
        WHERE
          student_id = :uid
          AND assignment_id IN (:ids)
      `,
      {
        uid: req.user.user_id,
        ids: assignmentIds,
      }
    );

    const byAssignment = Object.fromEntries(
      subs.map((submission) => [
        submission.assignment_id,
        submission,
      ])
    );

    result = rows.map((row) => ({
      ...row,

      my_submission:
        byAssignment[row.assignment_id] || null,
    }));
  }

  res.json({
    success: true,
    count: result.length,
    assignments: result,
  });
});

// ============================================================
// GET SINGLE ASSIGNMENT
// GET /api/assignments/:id
// ============================================================

const getAssignmentById = asyncHandler(
  async (req, res) => {
    const [rows] = await pool.execute(
      `
        SELECT
          a.*,
          c.title AS course_title,
          c.instructor_id

        FROM assignments a

        JOIN courses c
          ON c.course_id = a.course_id

        WHERE
          a.assignment_id = :id
      `,
      {
        id: req.params.id,
      }
    );

    if (!rows.length) {
      res.status(404);
      throw new Error('Assignment not found');
    }

    const assignment = rows[0];

    // ========================================================
    // ACCESS CONTROL
    // ========================================================

    if (req.user.role === 'instructor') {
      if (
        assignment.instructor_id !==
        req.user.user_id
      ) {
        res.status(403);
        throw new Error(
          'You do not have access to this assignment'
        );
      }
    }

    if (req.user.role === 'student') {
      const [enrollment] = await pool.execute(
        `
          SELECT enrollment_id
          FROM enrollments
          WHERE
            course_id = :courseId
            AND student_id = :studentId
          LIMIT 1
        `,
        {
          courseId: assignment.course_id,
          studentId: req.user.user_id,
        }
      );

      if (!enrollment.length) {
        res.status(403);
        throw new Error(
          'You are not enrolled in this course'
        );
      }
    }

    res.json({
      success: true,
      assignment,
    });
  }
);

// ============================================================
// CREATE ASSIGNMENT
// POST /api/assignments
//
// Supports:
// multipart/form-data
//
// Fields:
// course_id
// lesson_id
// title
// description
// deadline
// max_marks
//
// File:
// attachment
// ============================================================

const createAssignment = asyncHandler(
  async (req, res) => {
    const {
      course_id,
      lesson_id,
      title,
      description,
      deadline,
      max_marks,
    } = req.body;

    // ========================================================
    // BASIC VALIDATION
    // ========================================================

    if (!course_id) {
      if (req.file) {
        removeFileQuietly(
          `/uploads/${req.file.filename}`
        );
      }

      res.status(400);

      throw new Error(
        'course_id is required'
      );
    }

    if (!title || !title.trim()) {
      if (req.file) {
        removeFileQuietly(
          `/uploads/${req.file.filename}`
        );
      }

      res.status(400);

      throw new Error(
        'Assignment title is required'
      );
    }

    // ========================================================
    // COURSE OWNERSHIP
    // ========================================================

    await loadOwnedCourse(
      req,
      res,
      course_id
    );

    // ========================================================
    // FILE INFORMATION
    // ========================================================

    let attachmentUrl = null;
    let attachmentName = null;
    let attachmentMimeType = null;
    let attachmentSize = null;

    if (req.file) {
      const extension = path
        .extname(
          req.file.originalname || ''
        )
        .toLowerCase();

      // ------------------------------------------------------
      // Check PDF / DOC / DOCX
      // ------------------------------------------------------

      if (
        !ALLOWED_QUESTION_EXTENSIONS.includes(
          extension
        )
      ) {
        removeFileQuietly(
          `/uploads/${req.file.filename}`
        );

        res.status(400);

        throw new Error(
          'Assignment question must be a PDF, DOC, or DOCX file.'
        );
      }

      attachmentUrl =
        `/uploads/${req.file.filename}`;

      attachmentName =
        req.file.originalname;

      attachmentMimeType =
        req.file.mimetype || null;

      attachmentSize =
        req.file.size || null;
    }

    // ========================================================
    // INSERT ASSIGNMENT
    // ========================================================

    try {
      const [result] =
        await pool.execute(
          `
            INSERT INTO assignments
            (
              course_id,
              lesson_id,
              title,
              description,
              deadline,
              max_marks,

              attachment_url,
              attachment_name,
              attachment_mime_type,
              attachment_size
            )

            VALUES
            (
              :courseId,
              :lessonId,
              :title,
              :description,
              :deadline,
              :maxMarks,

              :attachmentUrl,
              :attachmentName,
              :attachmentMimeType,
              :attachmentSize
            )
          `,
          {
            courseId: course_id,

            lessonId:
              lesson_id || null,

            title:
              title.trim(),

            description:
              description &&
              description.trim()
                ? description.trim()
                : null,

            deadline:
              deadline || null,

            maxMarks:
              max_marks ||
              100,

            attachmentUrl,

            attachmentName,

            attachmentMimeType,

            attachmentSize,
          }
        );

      // ======================================================
      // GET CREATED ASSIGNMENT
      // ======================================================

      const [rows] =
        await pool.execute(
          `
            SELECT *
            FROM assignments
            WHERE
              assignment_id = :id
          `,
          {
            id: result.insertId,
          }
        );

      res.status(201).json({
        success: true,

        message:
          'Assignment created successfully',

        assignment:
          rows[0],
      });
    } catch (error) {
      // If database insert fails,
      // delete uploaded question file.
      if (req.file) {
        removeFileQuietly(
          `/uploads/${req.file.filename}`
        );
      }

      throw error;
    }
  }
);

// ============================================================
// UPDATE ASSIGNMENT
// PATCH /api/assignments/:id
// ============================================================

const updateAssignment = asyncHandler(
  async (req, res) => {
    // ========================================================
    // FIND EXISTING ASSIGNMENT
    // ========================================================

    const [existing] =
      await pool.execute(
        `
          SELECT *
          FROM assignments
          WHERE
            assignment_id = :id
        `,
        {
          id: req.params.id,
        }
      );

    if (!existing.length) {
      res.status(404);

      throw new Error(
        'Assignment not found'
      );
    }

    const existingAssignment =
      existing[0];

    // ========================================================
    // CHECK COURSE OWNERSHIP
    // ========================================================

    await loadOwnedCourse(
      req,
      res,
      existingAssignment.course_id
    );

    const {
      lesson_id,
      title,
      description,
      deadline,
      max_marks,
    } = req.body;

    const fields = [];

    const params = {
      id: req.params.id,
    };

    // ========================================================
    // LESSON
    // ========================================================

    if (
      lesson_id !== undefined
    ) {
      fields.push(
        'lesson_id = :lessonId'
      );

      params.lessonId =
        lesson_id || null;
    }

    // ========================================================
    // TITLE
    // ========================================================

    if (
      title !== undefined
    ) {
      if (!title.trim()) {
        res.status(400);

        throw new Error(
          'Assignment title cannot be empty'
        );
      }

      fields.push(
        'title = :title'
      );

      params.title =
        title.trim();
    }

    // ========================================================
    // DESCRIPTION
    // ========================================================

    if (
      description !== undefined
    ) {
      fields.push(
        'description = :description'
      );

      params.description =
        description || null;
    }

    // ========================================================
    // DEADLINE
    // ========================================================

    if (
      deadline !== undefined
    ) {
      fields.push(
        'deadline = :deadline'
      );

      params.deadline =
        deadline || null;
    }

    // ========================================================
    // MAX MARKS
    // ========================================================

    if (
      max_marks !== undefined
    ) {
      fields.push(
        'max_marks = :maxMarks'
      );

      params.maxMarks =
        max_marks;
    }

    // ========================================================
    // NO CHANGES
    // ========================================================

    if (!fields.length) {
      res.status(400);

      throw new Error(
        'No updatable fields provided'
      );
    }

    // ========================================================
    // UPDATE
    // ========================================================

    await pool.execute(
      `
        UPDATE assignments

        SET
          ${fields.join(', ')}

        WHERE
          assignment_id = :id
      `,
      params
    );

    // ========================================================
    // RETURN UPDATED ASSIGNMENT
    // ========================================================

    const [rows] =
      await pool.execute(
        `
          SELECT *
          FROM assignments
          WHERE
            assignment_id = :id
        `,
        {
          id: req.params.id,
        }
      );

    res.json({
      success: true,

      message:
        'Assignment updated successfully',

      assignment:
        rows[0],
    });
  }
);

// ============================================================
// DELETE ASSIGNMENT
// DELETE /api/assignments/:id
// ============================================================

const deleteAssignment = asyncHandler(
  async (req, res) => {
    // ========================================================
    // FIND ASSIGNMENT
    // ========================================================

    const [existing] =
      await pool.execute(
        `
          SELECT *
          FROM assignments
          WHERE
            assignment_id = :id
        `,
        {
          id: req.params.id,
        }
      );

    if (!existing.length) {
      res.status(404);

      throw new Error(
        'Assignment not found'
      );
    }

    const assignment =
      existing[0];

    // ========================================================
    // CHECK COURSE OWNERSHIP
    // ========================================================

    await loadOwnedCourse(
      req,
      res,
      assignment.course_id
    );

    // ========================================================
    // DELETE DATABASE RECORD
    // ========================================================

    await pool.execute(
      `
        DELETE FROM assignments
        WHERE
          assignment_id = :id
      `,
      {
        id: req.params.id,
      }
    );

    // ========================================================
    // DELETE QUESTION FILE
    // ========================================================

    removeFileQuietly(
      assignment.attachment_url
    );

    // ========================================================
    // RESPONSE
    // ========================================================

    res.json({
      success: true,

      message:
        'Assignment deleted successfully',
    });
  }
);

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
};