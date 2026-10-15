const asyncHandler = require('express-async-handler');
const { pool } = require('../config/db');

// Students must be enrolled; instructors must own the course; admins always allowed
const assertCourseParticipant = async (req, res, courseId) => {
  if (req.user.role === 'admin') return;
  if (req.user.role === 'instructor') {
    const [c] = await pool.execute('SELECT instructor_id FROM courses WHERE course_id = :id', { id: courseId });
    if (!c.length || c[0].instructor_id !== req.user.user_id) {
      res.status(403);
      throw new Error('You are not part of this course');
    }
    return;
  }
  const [e] = await pool.execute(
    'SELECT enrollment_id FROM enrollments WHERE student_id = :s AND course_id = :c',
    { s: req.user.user_id, c: courseId }
  );
  if (!e.length) {
    res.status(403);
    throw new Error('You are not enrolled in this course');
  }
};

// @route GET /api/discussions?course_id=
const getDiscussions = asyncHandler(async (req, res) => {
  const { course_id } = req.query;
  if (!course_id) {
    res.status(400);
    throw new Error('course_id query parameter is required');
  }
  await assertCourseParticipant(req, res, course_id);
  const [rows] = await pool.execute(
    `SELECT d.*, u.name AS author_name, u.role AS author_role,
       (SELECT COUNT(*) FROM discussion_replies r WHERE r.discussion_id = d.discussion_id) AS replies_count
     FROM discussions d JOIN users u ON u.user_id = d.user_id
     WHERE d.course_id = :c ORDER BY d.created_at DESC`,
    { c: course_id }
  );
  res.json({ success: true, count: rows.length, discussions: rows });
});

// @route GET /api/discussions/:id   (thread with replies)
const getDiscussionById = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT d.*, u.name AS author_name, u.role AS author_role
     FROM discussions d JOIN users u ON u.user_id = d.user_id WHERE d.discussion_id = :id`,
    { id: req.params.id }
  );
  if (!rows.length) {
    res.status(404);
    throw new Error('Discussion not found');
  }
  await assertCourseParticipant(req, res, rows[0].course_id);
  const [replies] = await pool.execute(
    `SELECT r.*, u.name AS author_name, u.role AS author_role
     FROM discussion_replies r JOIN users u ON u.user_id = r.user_id
     WHERE r.discussion_id = :id ORDER BY r.created_at ASC`,
    { id: req.params.id }
  );
  res.json({ success: true, discussion: rows[0], replies });
});

// @route POST /api/discussions   body: { course_id, title, content }
const createDiscussion = asyncHandler(async (req, res) => {
  const { course_id, title, content } = req.body;
  if (!course_id || !title || !content) {
    res.status(400);
    throw new Error('course_id, title and content are required');
  }
  await assertCourseParticipant(req, res, course_id);
  const [result] = await pool.execute(
    'INSERT INTO discussions (course_id, user_id, title, content) VALUES (:c, :u, :t, :body)',
    { c: course_id, u: req.user.user_id, t: title, body: content }
  );
  const [rows] = await pool.execute('SELECT * FROM discussions WHERE discussion_id = :id', { id: result.insertId });
  res.status(201).json({ success: true, discussion: rows[0] });
});

// @route DELETE /api/discussions/:id   (author or admin)
const deleteDiscussion = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM discussions WHERE discussion_id = :id', { id: req.params.id });
  if (!rows.length) {
    res.status(404);
    throw new Error('Discussion not found');
  }
  if (req.user.role !== 'admin' && rows[0].user_id !== req.user.user_id) {
    res.status(403);
    throw new Error('Not authorized to delete this discussion');
  }
  await pool.execute('DELETE FROM discussions WHERE discussion_id = :id', { id: req.params.id });
  res.json({ success: true, message: 'Discussion deleted' });
});

// @route POST /api/discussions/:id/replies   body: { content }
const addReply = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    res.status(400);
    throw new Error('content is required');
  }
  const [rows] = await pool.execute('SELECT course_id FROM discussions WHERE discussion_id = :id', { id: req.params.id });
  if (!rows.length) {
    res.status(404);
    throw new Error('Discussion not found');
  }
  await assertCourseParticipant(req, res, rows[0].course_id);
  const [result] = await pool.execute(
    'INSERT INTO discussion_replies (discussion_id, user_id, content) VALUES (:d, :u, :c)',
    { d: req.params.id, u: req.user.user_id, c: content }
  );
  const [reply] = await pool.execute('SELECT * FROM discussion_replies WHERE reply_id = :id', { id: result.insertId });
  res.status(201).json({ success: true, reply: reply[0] });
});

// @route DELETE /api/discussions/replies/:replyId   (author or admin)
const deleteReply = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM discussion_replies WHERE reply_id = :id', { id: req.params.replyId });
  if (!rows.length) {
    res.status(404);
    throw new Error('Reply not found');
  }
  if (req.user.role !== 'admin' && rows[0].user_id !== req.user.user_id) {
    res.status(403);
    throw new Error('Not authorized to delete this reply');
  }
  await pool.execute('DELETE FROM discussion_replies WHERE reply_id = :id', { id: req.params.replyId });
  res.json({ success: true, message: 'Reply deleted' });
});

module.exports = { getDiscussions, getDiscussionById, createDiscussion, deleteDiscussion, addReply, deleteReply };
