const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { pool } = require('../config/db');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized, token invalid or expired');
  }

  const [rows] = await pool.execute(
    'SELECT user_id, name, email, role, status, profile_image, created_at FROM users WHERE user_id = :id',
    { id: decoded.id }
  );
  const user = rows[0];
  if (!user) {
    res.status(401);
    throw new Error('Not authorized, user no longer exists');
  }
  if (user.status === 'blocked') {
    res.status(403);
    throw new Error('Your account has been blocked. Contact support.');
  }

  req.user = user;
  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403);
    throw new Error(`Role '${req.user ? req.user.role : 'guest'}' is not permitted to access this resource`);
  }
  next();
};

module.exports = { protect, authorize };
