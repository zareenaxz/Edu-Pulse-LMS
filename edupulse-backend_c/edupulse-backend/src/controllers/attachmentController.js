const fs = require('fs');
const path = require('path');
const asyncHandler = require('express-async-handler');
const { pool } = require('../config/db');
const { classify, uploadDir } = require('../middleware/upload');

// Instructor must own the course; admin always allowed; student must be enrolled.
const assertLessonAccess = async (req, res, { write }) => {
  const [rows] = await pool.execute(
    `SELECT l.lesson_id, l.course_id, c.instructor_id
     FROM lessons l JOIN courses c ON c.course_id = l.course_id
     WHERE l.lesson_id = :lessonId AND l.course_id = :courseId`,
    { lessonId: req.params.lessonId, courseId: req.params.courseId }
  );
  const lesson = rows[0];
  if (!lesson) {
    res.status(404);
    throw new Error('Lesson not found');
  }
  const { role, user_id } = req.user;
  if (role === 'admin') return lesson;
  if (role === 'instructor') {
    if (lesson.instructor_id !== user_id) {
      res.status(403);
      throw new Error('You do not own this course');
    }
    return lesson;
  }
  // student
  if (write) {
    res.status(403);
    throw new Error('Students cannot modify lesson content');
  }
  const [enr] = await pool.execute(
    'SELECT enrollment_id FROM enrollments WHERE student_id = :s AND course_id = :c',
    { s: user_id, c: lesson.course_id }
  );
  if (!enr.length) {
    res.status(403);
    throw new Error('Not enrolled in this course');
  }
  return lesson;
};

const removeFileQuietly = (fileUrl) => {
  if (!fileUrl || !fileUrl.startsWith('/uploads/')) return;
  const full = path.join(uploadDir, path.basename(fileUrl));
  fs.unlink(full, () => {});
};

// @desc    Upload one or more files (video, audio, pdf, doc, slides, ...) to a lesson
// @route   POST /api/courses/:courseId/lessons/:lessonId/attachments   (multipart field: files)
const uploadAttachments = asyncHandler(async (req, res) => {
  try {
    await assertLessonAccess(req, res, { write: true });
  } catch (err) {
    (req.files || []).forEach((f) => removeFileQuietly(`/uploads/${f.filename}`)); // don't keep orphans
    throw err;
  }
  if (!req.files || !req.files.length) {
    res.status(400);
    throw new Error('No files uploaded (send them in the "files" field)');
  }

  const saved = [];
  for (const f of req.files) {
    const [r] = await pool.execute(
      `INSERT INTO lesson_attachments (lesson_id, uploaded_by, original_name, file_url, file_type, mime_type, file_size)
       VALUES (:lesson, :by, :name, :url, :type, :mime, :size)`,
      {
        lesson: req.params.lessonId,
        by: req.user.user_id,
        name: f.originalname,
        url: `/uploads/${f.filename}`,
        type: classify(f.originalname) || 'other',
        mime: f.mimetype || null,
        size: f.size,
      }
    );
    const [rows] = await pool.execute('SELECT * FROM lesson_attachments WHERE attachment_id = :id', { id: r.insertId });
    saved.push(rows[0]);
  }
  res.status(201).json({ success: true, count: saved.length, attachments: saved });
});

// @desc    List a lesson's attachments (optionally ?type=pdf)
// @route   GET /api/courses/:courseId/lessons/:lessonId/attachments
const getAttachments = asyncHandler(async (req, res) => {
  await assertLessonAccess(req, res, { write: false });
  const params = { lessonId: req.params.lessonId };
  let extra = '';
  if (req.query.type) { extra = 'AND file_type = :type'; params.type = req.query.type; }
  const [rows] = await pool.execute(
    `SELECT * FROM lesson_attachments WHERE lesson_id = :lessonId ${extra} ORDER BY created_at ASC`,
    params
  );
  res.json({ success: true, count: rows.length, attachments: rows });
});

// @desc    Delete an attachment (and the file on disk)
// @route   DELETE /api/courses/:courseId/lessons/:lessonId/attachments/:attachmentId
const deleteAttachment = asyncHandler(async (req, res) => {
  await assertLessonAccess(req, res, { write: true });
  const [rows] = await pool.execute(
    'SELECT * FROM lesson_attachments WHERE attachment_id = :id AND lesson_id = :lessonId',
    { id: req.params.attachmentId, lessonId: req.params.lessonId }
  );
  if (!rows.length) {
    res.status(404);
    throw new Error('Attachment not found');
  }
  await pool.execute('DELETE FROM lesson_attachments WHERE attachment_id = :id', { id: req.params.attachmentId });
  removeFileQuietly(rows[0].file_url);
  res.json({ success: true, message: 'Attachment deleted' });
});

module.exports = { uploadAttachments, getAttachments, deleteAttachment };
