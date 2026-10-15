const asyncHandler = require('express-async-handler');
const { pool } = require('../config/db');

// ============================================================
// GET ALL BOOKMARKS FOR LOGGED-IN STUDENT
// GET /api/bookmarks
// ============================================================

const getBookmarks = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT
        b.bookmark_id,
        b.created_at,
        l.lesson_id,
        l.title AS lesson_title,
        c.course_id,
        c.title AS course_title
     FROM bookmarks b
     JOIN lessons l
       ON l.lesson_id = b.lesson_id
     JOIN courses c
       ON c.course_id = l.course_id
     WHERE b.student_id = :student_id
     ORDER BY b.created_at DESC`,
    {
      student_id: req.user.user_id
    }
  );

  res.json({
    success: true,
    count: rows.length,
    bookmarks: rows
  });
});

// ============================================================
// ADD BOOKMARK
// POST /api/bookmarks
// Body: { lesson_id }
// ============================================================

const addBookmark = asyncHandler(async (req, res) => {
  const lessonId = Number(req.body?.lesson_id);

  if (!Number.isInteger(lessonId) || lessonId <= 0) {
    res.status(400);
    throw new Error('A valid lesson_id is required');
  }

  // ----------------------------------------------------------
  // Check whether lesson exists
  // ----------------------------------------------------------

  const [lessons] = await pool.execute(
    `SELECT lesson_id
     FROM lessons
     WHERE lesson_id = :lesson_id
     LIMIT 1`,
    {
      lesson_id: lessonId
    }
  );

  if (lessons.length === 0) {
    res.status(404);
    throw new Error('Lesson not found');
  }

  // ----------------------------------------------------------
  // Check duplicate bookmark
  // ----------------------------------------------------------

  const [existing] = await pool.execute(
    `SELECT bookmark_id
     FROM bookmarks
     WHERE student_id = :student_id
       AND lesson_id = :lesson_id
     LIMIT 1`,
    {
      student_id: req.user.user_id,
      lesson_id: lessonId
    }
  );

  if (existing.length > 0) {
    return res.status(200).json({
      success: true,
      alreadyBookmarked: true,
      bookmark_id: existing[0].bookmark_id,
      message: 'Lesson is already bookmarked'
    });
  }

  // ----------------------------------------------------------
  // Insert bookmark
  // ----------------------------------------------------------

  const [result] = await pool.execute(
    `INSERT INTO bookmarks
      (student_id, lesson_id)
     VALUES
      (:student_id, :lesson_id)`,
    {
      student_id: req.user.user_id,
      lesson_id: lessonId
    }
  );

  res.status(201).json({
    success: true,
    alreadyBookmarked: false,
    bookmark_id: result.insertId,
    message: 'Lesson bookmarked'
  });
});

// ============================================================
// REMOVE BOOKMARK
// DELETE /api/bookmarks/:id
// ============================================================

const removeBookmark = asyncHandler(async (req, res) => {
  const bookmarkId = Number(req.params.id);

  if (!Number.isInteger(bookmarkId) || bookmarkId <= 0) {
    res.status(400);
    throw new Error('Invalid bookmark id');
  }

  const [result] = await pool.execute(
    `DELETE FROM bookmarks
     WHERE bookmark_id = :bookmark_id
       AND student_id = :student_id`,
    {
      bookmark_id: bookmarkId,
      student_id: req.user.user_id
    }
  );

  if (result.affectedRows === 0) {
    res.status(404);
    throw new Error('Bookmark not found');
  }

  res.json({
    success: true,
    message: 'Bookmark removed'
  });
});

module.exports = {
  getBookmarks,
  addBookmark,
  removeBookmark
};