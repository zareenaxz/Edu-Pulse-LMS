const asyncHandler = require('express-async-handler');
const { pool } = require('../config/db');

// @desc    Admin: list instructor applications (optionally filtered by status)
// @route   GET /api/instructor-applications?status=pending
const getApplications = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const clauses = [];
  const params = {};
  if (status && status !== 'ALL') { clauses.push('ia.application_status = :status'); params.status = status; }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT ia.*, u.name, u.email, u.status AS user_status, u.profile_image
     FROM instructor_applications ia
     JOIN users u ON u.user_id = ia.user_id
     ${where}
     ORDER BY ia.applied_at DESC`,
    params
  );
  res.json({ success: true, count: rows.length, applications: rows });
});

// @desc    Get my own instructor application
// @route   GET /api/instructor-applications/me
const getMyApplication = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT * FROM instructor_applications WHERE user_id = :id ORDER BY applied_at DESC LIMIT 1',
    { id: req.user.user_id }
  );
  res.json({ success: true, application: rows[0] || null });
});

// @desc    Admin: approve or reject an application
// @route   PATCH /api/instructor-applications/:id/review
// body: { decision: 'approved' | 'rejected' }
const reviewApplication = asyncHandler(async (req, res) => {
  const { decision } = req.body;
  if (!['approved', 'rejected'].includes(decision)) {
    res.status(400);
    throw new Error("decision must be 'approved' or 'rejected'");
  }

  const [rows] = await pool.execute('SELECT * FROM instructor_applications WHERE application_id = :id', {
    id: req.params.id,
  });
  const application = rows[0];
  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  await pool.execute(
    `UPDATE instructor_applications
     SET application_status = :decision, reviewed_by = :reviewer, reviewed_at = NOW()
     WHERE application_id = :id`,
    { decision, reviewer: req.user.user_id, id: req.params.id }
  );

  await pool.execute('UPDATE users SET status = :status WHERE user_id = :userId', {
    status: decision === 'approved' ? 'active' : 'blocked',
    userId: application.user_id,
  });

  res.json({ success: true, message: `Application ${decision}` });
});

module.exports = { getApplications, getMyApplication, reviewApplication };
