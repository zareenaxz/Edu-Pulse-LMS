const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const { pool } = require('../config/db');

const USER_COLUMNS =
  'user_id, name, email, role, status, profile_image, created_at';


// ======================================================
// STUDENT / CURRENT USER
// ======================================================

// @desc    Get current logged-in user's profile
// @route   GET /api/users/me
const getMe = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT ${USER_COLUMNS}
     FROM users
     WHERE user_id = :id`,
    {
      id: req.user.user_id,
    }
  );

  if (!rows.length) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({
    success: true,
    user: rows[0],
  });
});


// @desc    Update current user's profile
// @route   PATCH /api/users/me
const updateMe = asyncHandler(async (req, res) => {
  const { name } = req.body;

  const profileImage = req.file
    ? `/uploads/${req.file.filename}`
    : undefined;

  const fields = [];
  const params = {
    id: req.user.user_id,
  };

  if (name !== undefined) {
    fields.push('name = :name');
    params.name = name.trim();
  }

  if (profileImage !== undefined) {
    fields.push('profile_image = :profileImage');
    params.profileImage = profileImage;
  }

  if (fields.length > 0) {
    await pool.execute(
      `UPDATE users
       SET ${fields.join(', ')}
       WHERE user_id = :id`,
      params
    );
  }

  const [rows] = await pool.execute(
    `SELECT ${USER_COLUMNS}
     FROM users
     WHERE user_id = :id`,
    {
      id: req.user.user_id,
    }
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: rows[0],
  });
});


// ======================================================
// PASSWORD
// ======================================================

// @desc    Change current user's password
// @route   PATCH /api/users/me/password
const changeMyPassword = asyncHandler(async (req, res) => {
  const {
    currentPassword,
    newPassword,
  } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error(
      'Current password and new password are required'
    );
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error(
      'New password must be at least 6 characters'
    );
  }

  const [rows] = await pool.execute(
    `SELECT password
     FROM users
     WHERE user_id = :id`,
    {
      id: req.user.user_id,
    }
  );

  if (!rows.length) {
    res.status(404);
    throw new Error('User not found');
  }

  const match = await bcrypt.compare(
    currentPassword,
    rows[0].password
  );

  if (!match) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  await pool.execute(
    `UPDATE users
     SET password = :password
     WHERE user_id = :id`,
    {
      password: hashed,
      id: req.user.user_id,
    }
  );

  res.json({
    success: true,
    message: 'Password updated successfully',
  });
});


// ======================================================
// ADMIN
// ======================================================

// @desc    List users
// @route   GET /api/users
const getUsers = asyncHandler(async (req, res) => {
  const {
    search,
    role,
    status,
  } = req.query;

  const clauses = [];
  const params = {};

  if (role && role !== 'ALL') {
    clauses.push('role = :role');
    params.role = role;
  }

  if (status && status !== 'ALL') {
    clauses.push('status = :status');
    params.status = status;
  }

  if (search) {
    clauses.push(
      '(name LIKE :search OR email LIKE :search)'
    );

    params.search = `%${search}%`;
  }

  const where = clauses.length
    ? `WHERE ${clauses.join(' AND ')}`
    : '';

  const [users] = await pool.query(
    `SELECT
       ${USER_COLUMNS},

       (
         SELECT COUNT(*)
         FROM enrollments e
         WHERE e.student_id = users.user_id
       ) AS student_courses_count,

       (
         SELECT COUNT(*)
         FROM courses c
         WHERE c.instructor_id = users.user_id
       ) AS instructor_courses_count

     FROM users
     ${where}
     ORDER BY created_at DESC`,
    params
  );

  const result = users.map((u) => ({
    ...u,
    coursesCount:
      u.role === 'student'
        ? u.student_courses_count
        : u.role === 'instructor'
        ? u.instructor_courses_count
        : 0,
  }));

  res.json({
    success: true,
    count: result.length,
    users: result,
  });
});


// @desc    Get single user
// @route   GET /api/users/:id
const getUserById = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT ${USER_COLUMNS}
     FROM users
     WHERE user_id = :id`,
    {
      id: req.params.id,
    }
  );

  if (!rows.length) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({
    success: true,
    user: rows[0],
  });
});


// @desc    Create user
// @route   POST /api/users
const createUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    status,
  } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error(
      'name, email and password are required'
    );
  }

  const hashed = await bcrypt.hash(password, 10);

  const [result] = await pool.execute(
    `INSERT INTO users
      (name, email, password, role, status)
     VALUES
      (:name, :email, :password, :role, :status)`,
    {
      name,
      email,
      password: hashed,
      role: role || 'student',
      status: status || 'active',
    }
  );

  const [rows] = await pool.execute(
    `SELECT ${USER_COLUMNS}
     FROM users
     WHERE user_id = :id`,
    {
      id: result.insertId,
    }
  );

  res.status(201).json({
    success: true,
    user: rows[0],
  });
});


// @desc    Admin update user
// @route   PATCH /api/users/:id
const updateUser = asyncHandler(async (req, res) => {
  const {
    name,
    role,
    status,
  } = req.body;

  const fields = [];
  const params = {
    id: req.params.id,
  };

  if (name !== undefined) {
    fields.push('name = :name');
    params.name = name;
  }

  if (role !== undefined) {
    fields.push('role = :role');
    params.role = role;
  }

  if (status !== undefined) {
    fields.push('status = :status');
    params.status = status;
  }

  if (!fields.length) {
    res.status(400);
    throw new Error(
      'No updatable fields provided'
    );
  }

  const [result] = await pool.execute(
    `UPDATE users
     SET ${fields.join(', ')}
     WHERE user_id = :id`,
    params
  );

  if (!result.affectedRows) {
    res.status(404);
    throw new Error('User not found');
  }

  const [rows] = await pool.execute(
    `SELECT ${USER_COLUMNS}
     FROM users
     WHERE user_id = :id`,
    {
      id: req.params.id,
    }
  );

  res.json({
    success: true,
    user: rows[0],
  });
});


// @desc    Block/unblock user
// @route   PATCH /api/users/:id/block
const toggleBlock = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT status
     FROM users
     WHERE user_id = :id`,
    {
      id: req.params.id,
    }
  );

  if (!rows.length) {
    res.status(404);
    throw new Error('User not found');
  }

  const newStatus =
    rows[0].status === 'blocked'
      ? 'active'
      : 'blocked';

  await pool.execute(
    `UPDATE users
     SET status = :status
     WHERE user_id = :id`,
    {
      status: newStatus,
      id: req.params.id,
    }
  );

  const [updated] = await pool.execute(
    `SELECT ${USER_COLUMNS}
     FROM users
     WHERE user_id = :id`,
    {
      id: req.params.id,
    }
  );

  res.json({
    success: true,
    user: updated[0],
  });
});


// @desc    Delete user
// @route   DELETE /api/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const [result] = await pool.execute(
    `DELETE FROM users
     WHERE user_id = :id`,
    {
      id: req.params.id,
    }
  );

  if (!result.affectedRows) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({
    success: true,
    message: 'User deleted',
  });
});


module.exports = {
  getMe,
  updateMe,
  changeMyPassword,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleBlock,
  deleteUser,
};