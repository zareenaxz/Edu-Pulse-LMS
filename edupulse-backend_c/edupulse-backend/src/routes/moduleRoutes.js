const express = require('express');
const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

const {
  getModules,
  createModule,
  updateModule,
  deleteModule
} = require('../controllers/moduleController');


// Get modules
router.get('/', protect, getModules);

// Create module
router.post(
  '/',
  protect,
  authorize('instructor'),
  createModule
);

// Update module
router.patch(
  '/:moduleId',
  protect,
  authorize('instructor'),
  updateModule
);

// Delete module
router.delete(
  '/:moduleId',
  protect,
  authorize('instructor'),
  deleteModule
);

module.exports = router;