const express = require('express');

const router = express.Router();

const {
  getCourseHub,
  getMyHub,
  getSubmissionHistory,
  getCourseAssignmentStatus,
} = require('../controllers/hubController');

const {
  protect,
  authorize,
} = require('../middleware/auth');

/* ============================================================
   PERSONAL HUB
============================================================ */

/*
  Student's own submissions / quiz attempts

  GET /api/hub/me
  GET /api/hub/me?course_id=5
*/

router.get(
  '/me',
  protect,
  authorize('student'),
  getMyHub
);


/* ============================================================
   COURSE HUB
============================================================ */

/*
  Instructor/Admin course submission hub

  GET /api/hub/course/:courseId
*/

router.get(
  '/course/:courseId',
  protect,
  authorize(
    'instructor',
    'admin'
  ),
  getCourseHub
);


/* ============================================================
   ASSIGNMENT SUBMISSION TRACKER
============================================================ */

/*
  Shows:

  - All enrolled students
  - All assignments
  - Submitted / Not Submitted
  - Graded / Pending
  - Assignment-wise counts
  - Overall counts

  GET /api/hub/course/:courseId/assignment-status
*/

router.get(
  '/course/:courseId/assignment-status',
  protect,
  authorize(
    'instructor',
    'admin'
  ),
  getCourseAssignmentStatus
);


/* ============================================================
   SUBMISSION HISTORY
============================================================ */

/*
  GET
  /api/hub/submissions/:submissionId/history

  Used to view the current submission and
  previous submission versions.
*/

router.get(
  '/submissions/:submissionId/history',
  protect,
  authorize(
    'student',
    'instructor',
    'admin'
  ),
  getSubmissionHistory
);


/* ============================================================
   EXPORT ROUTER
============================================================ */

module.exports = router;