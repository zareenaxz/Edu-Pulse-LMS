const express = require('express');
const router = express.Router();

const { cvUpload } = require('../middleware/upload');
const { protect } = require('../middleware/auth');

const {
  registerStudent,
  registerInstructor,
  login,
  logout,
  getMe,
  requestPasswordReset,
  confirmPasswordReset
} = require('../controllers/authController');

// ====================================================
// STUDENT SIGNUP
// ====================================================

router.post(
  '/register/student',
  registerStudent
);

// ====================================================
// INSTRUCTOR SIGNUP
// CV is uploaded as "cv"
// ====================================================

router.post(
  '/register/instructor',
  cvUpload.single('cv'),
  registerInstructor
);

// ====================================================
// LOGIN
// ====================================================

router.post(
  '/login',
  login
);

// ====================================================
// LOGOUT
// ====================================================

router.post(
  '/logout',
  logout
);

// ====================================================
// CURRENT LOGGED-IN USER
// ====================================================

router.get(
  '/me',
  protect,
  getMe
);

// ====================================================
// PASSWORD RESET
// ====================================================

router.post(
  '/reset-password/request',
  requestPasswordReset
);

router.post(
  '/reset-password/confirm',
  confirmPasswordReset
);

module.exports = router;