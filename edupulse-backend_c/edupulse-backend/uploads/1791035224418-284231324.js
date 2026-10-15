const asyncHandler = require('express-async-handler');
const { pool } = require('../config/db');

// @route GET /api/certificates/me
const getMyCertificates = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT ce.*, c.title AS course_title FROM certificates ce
     JOIN courses c ON c.course_id = ce.course_id
     WHERE ce.student_id = :s ORDER BY ce.issued_at DESC`,
    { s: req.user.user_id }
  );
  res.json({ success: true, count: rows.length, certificates: rows });
});

// @desc    Public verification of a certificate code
// @route   GET /api/certificates/verify/:code
const verifyCertificate = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT ce.certificate_code, ce.issued_at, u.name AS student_name, c.title AS course_title
     FROM certificates ce
     JOIN users u ON u.user_id = ce.student_id
     JOIN courses c ON c.course_id = ce.course_id
     WHERE ce.certificate_code = :code`,
    { code: req.params.code }
  );
  if (!rows.length) {
    res.status(404);
    throw new Error('Certificate not found');
  }
  res.json({ success: true, valid: true, certificate: rows[0] });
});

// @desc    Admin: list all issued certificates
// @route   GET /api/certificates
const getAllCertificates = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT ce.*, u.name AS student_name, c.title AS course_title FROM certificates ce
     JOIN users u ON u.user_id = ce.student_id
     JOIN courses c ON c.course_id = ce.course_id ORDER BY ce.issued_at DESC`
  );
  res.json({ success: true, count: rows.length, certificates: rows });
});

module.exports = { getMyCertificates, verifyCertificate, getAllCertificates };
