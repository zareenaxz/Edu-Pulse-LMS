require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { testConnection } = require('./src/config/db');
const { notFound, errorHandler } = require('./src/middleware/error');

testConnection();

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  '/api/courses/:courseId/modules',
  require('./src/routes/moduleRoutes')
);
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'EduPulse API is running' }));

app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/instructor-applications', require('./src/routes/instructorApplicationRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/courses', require('./src/routes/courseRoutes'));
app.use('/api/courses/:courseId/lessons', require('./src/routes/lessonRoutes'));
app.use('/api/courses/:courseId/reviews', require('./src/routes/reviewRoutes'));
app.use('/api/hub', require('./src/routes/hubRoutes'));
app.use('/api/enrollments', require('./src/routes/enrollmentRoutes'));
app.use('/api/progress', require('./src/routes/progressRoutes'));
app.use('/api/bookmarks', require('./src/routes/bookmarkRoutes'));
app.use('/api/assignments', require('./src/routes/assignmentRoutes'));
app.use('/api', require('./src/routes/submissionRoutes'));
app.use('/api/quizzes', require('./src/routes/quizRoutes'));
app.use('/api/discussions', require('./src/routes/discussionRoutes'));
app.use('/api/certificates', require('./src/routes/certificateRoutes'));
app.use('/api/badges', require('./src/routes/badgeRoutes'));
app.use('/api/analytics', require('./src/routes/analyticsRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`EduPulse API listening on port ${PORT}`));
