const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getMyCertificates, verifyCertificate, getAllCertificates } = require('../controllers/certificateController');

router.get('/verify/:code', verifyCertificate); // public
router.get('/me', protect, authorize('student'), getMyCertificates);
router.get('/', protect, authorize('admin'), getAllCertificates);

module.exports = router;
