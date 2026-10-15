const express = require('express');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const {
  getMe,
  updateMe,
  changeMyPassword,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleBlock,
  deleteUser,
} = require('../controllers/userController');


// ======================================================
// CURRENT LOGGED-IN USER
// ======================================================

// Get my profile
router.get('/me', protect, getMe);

// Update my profile + optional profile picture
router.patch(
  '/me',
  protect,
  upload.single('profile_image'),
  updateMe
);

// Change my password
router.patch(
  '/me/password',
  protect,
  changeMyPassword
);


// ======================================================
// ADMIN USER MANAGEMENT
// ======================================================

router.get(
  '/',
  protect,
  authorize('admin'),
  getUsers
);

router.post(
  '/',
  protect,
  authorize('admin'),
  createUser
);

router.get(
  '/:id',
  protect,
  authorize('admin'),
  getUserById
);

router.patch(
  '/:id',
  protect,
  authorize('admin'),
  updateUser
);

router.patch(
  '/:id/block',
  protect,
  authorize('admin'),
  toggleBlock
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  deleteUser
);

module.exports = router;