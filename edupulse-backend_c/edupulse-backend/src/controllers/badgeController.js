const asyncHandler = require('express-async-handler');
const { pool } = require('../config/db');

// @route GET /api/badges
const getBadges = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM badges ORDER BY percentage_required ASC');
  res.json({ success: true, badges: rows });
});

// @desc    My earned badges (per course)
// @route   GET /api/badges/me
const getMyBadges = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT sb.*, b.badge_name, b.description, b.percentage_required, b.badge_image, c.title AS course_title
     FROM student_badges sb
     JOIN badges b ON b.badge_id = sb.badge_id
     JOIN courses c ON c.course_id = sb.course_id
     WHERE sb.student_id = :s ORDER BY sb.earned_at DESC`,
    { s: req.user.user_id }
  );
  res.json({ success: true, count: rows.length, badges: rows });
});

// @route POST /api/badges   (admin)
const createBadge = asyncHandler(async (req, res) => {
  const { badge_name, description, percentage_required, badge_image } = req.body;
  if (!badge_name || percentage_required === undefined) {
    res.status(400);
    throw new Error('badge_name and percentage_required are required');
  }
  const [result] = await pool.execute(
    `INSERT INTO badges (badge_name, description, percentage_required, badge_image)
     VALUES (:n, :d, :p, :i)`,
    { n: badge_name, d: description || null, p: percentage_required, i: badge_image || null }
  );
  const [rows] = await pool.execute('SELECT * FROM badges WHERE badge_id = :id', { id: result.insertId });
  res.status(201).json({ success: true, badge: rows[0] });
});

// @route PATCH /api/badges/:id   (admin)
const updateBadge = asyncHandler(async (req, res) => {
  const { badge_name, description, percentage_required, badge_image } = req.body;
  const fields = [];
  const params = { id: req.params.id };
  if (badge_name !== undefined) { fields.push('badge_name = :n'); params.n = badge_name; }
  if (description !== undefined) { fields.push('description = :d'); params.d = description; }
  if (percentage_required !== undefined) { fields.push('percentage_required = :p'); params.p = percentage_required; }
  if (badge_image !== undefined) { fields.push('badge_image = :i'); params.i = badge_image; }
  if (!fields.length) {
    res.status(400);
    throw new Error('No updatable fields provided');
  }
  const [r] = await pool.execute(`UPDATE badges SET ${fields.join(', ')} WHERE badge_id = :id`, params);
  if (!r.affectedRows) {
    res.status(404);
    throw new Error('Badge not found');
  }
  const [rows] = await pool.execute('SELECT * FROM badges WHERE badge_id = :id', { id: req.params.id });
  res.json({ success: true, badge: rows[0] });
});

// @route DELETE /api/badges/:id   (admin)
const deleteBadge = asyncHandler(async (req, res) => {
  const [r] = await pool.execute('DELETE FROM badges WHERE badge_id = :id', { id: req.params.id });
  if (!r.affectedRows) {
    res.status(404);
    throw new Error('Badge not found');
  }
  res.json({ success: true, message: 'Badge deleted' });
});

module.exports = { getBadges, getMyBadges, createBadge, updateBadge, deleteBadge };
