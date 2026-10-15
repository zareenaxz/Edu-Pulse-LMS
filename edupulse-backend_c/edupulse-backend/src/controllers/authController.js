const jwt = require('jsonwebtoken');

const bcrypt = require('bcryptjs');

const asyncHandler = require('express-async-handler');

const { pool } = require('../config/db');

const generateToken = require('../utils/generateToken');



// ----------------------------------------------------
// USER RESPONSE
// ----------------------------------------------------


const getSafeUser = async (userId) => {

  const [rows] = await pool.execute(
    `SELECT
      user_id,
      name,
      email,
      role,
      status,
      profile_image,
      created_at
     FROM users
     WHERE user_id = :id`,
    { id: userId }
  );


  return rows[0] || null;
};



// ----------------------------------------------------
// SEND AUTH RESPONSE
// ----------------------------------------------------


const sendAuthResponse = async (
  res,
  userId,
  statusCode = 200
) => {

  const user = await getSafeUser(userId);


  if (!user) {

    res.status(404);

    throw new Error('User not found');
  }


  const token = generateToken(
    user.user_id,
    user.role
  );


  res.cookie('token', token, {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });


  res.status(statusCode).json({
    success: true,
    token,
    user
  });
};



// ====================================================
// STUDENT SIGN UP
// ====================================================


const registerStudent = asyncHandler(
  async (req, res) => {

    const {
      name,
      email,
      password
    } = req.body;


    if (!name || !email || !password) {

      res.status(400);

      throw new Error(
        'Name, email and password are required'
      );
    }


    if (password.length < 8) {

      res.status(400);

      throw new Error(
        'Password must be at least 8 characters'
      );
    }


    const normalizedEmail =
      email.trim().toLowerCase();


    const [existing] =
      await pool.execute(
        `SELECT user_id
         FROM users
         WHERE email = :email`,
        {
          email: normalizedEmail
        }
      );


    if (existing.length > 0) {

      res.status(409);

      throw new Error(
        'An account with this email already exists'
      );
    }


    const hashedPassword =
      await bcrypt.hash(password, 10);


    const [result] =
      await pool.execute(
        `INSERT INTO users
        (
          name,
          email,
          password,
          role,
          status
        )
        VALUES
        (
          :name,
          :email,
          :password,
          'student',
          'active'
        )`,
        {
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword
        }
      );


    await sendAuthResponse(
      res,
      result.insertId,
      201
    );
  }
);



// ====================================================
// INSTRUCTOR SIGN UP
// ====================================================


const registerInstructor = asyncHandler(
  async (req, res) => {

    const {
      name,
      email,
      password,
      qualification,
      experience
    } = req.body;


    if (!name || !email || !password) {

      res.status(400);

      throw new Error(
        'Name, email and password are required'
      );
    }


    if (password.length < 8) {

      res.status(400);

      throw new Error(
        'Password must be at least 8 characters'
      );
    }


    // ------------------------------------------------
    // Validate CV
    // ------------------------------------------------


    if (!req.file) {

      res.status(400);

      throw new Error(
        'CV is required. Please upload your CV in PDF format.'
      );
    }


    if (req.file.mimetype !== 'application/pdf') {

      res.status(400);

      throw new Error(
        'Only PDF CV files are allowed.'
      );
    }


    // 25 MB limit

    if (req.file.size > 25 * 1024 * 1024) {

      res.status(400);

      throw new Error(
        'CV file must be smaller than 25 MB.'
      );
    }


    const normalizedEmail =
      email.trim().toLowerCase();


    // ------------------------------------------------
    // Check duplicate email
    // ------------------------------------------------


    const [existing] =
      await pool.execute(
        `SELECT user_id
         FROM users
         WHERE email = :email`,
        {
          email: normalizedEmail
        }
      );


    if (existing.length > 0) {

      res.status(409);

      throw new Error(
        'An account with this email already exists'
      );
    }


    // ------------------------------------------------
    // Hash password
    // ------------------------------------------------


    const hashedPassword =
      await bcrypt.hash(password, 10);


    // ------------------------------------------------
    // Profile image
    // ------------------------------------------------


    const profileImage = null;


    // ------------------------------------------------
    // Create instructor account
    // ------------------------------------------------


    const [result] =
      await pool.execute(
        `INSERT INTO users
        (
          name,
          email,
          password,
          role,
          status,
          profile_image
        )
        VALUES
        (
          :name,
          :email,
          :password,
          'instructor',
          'pending',
          :profileImage
        )`,
        {
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          profileImage
        }
      );


    // ------------------------------------------------
    // Save instructor application + CV
    // ------------------------------------------------


    await pool.execute(
      `INSERT INTO instructor_applications
      (
        user_id,
        qualification,
        experience,
        application_status,
        cv_file_name,
        cv_mime_type,
        cv_data
      )
      VALUES
      (
        :userId,
        :qualification,
        :experience,
        'pending',
        :cvFileName,
        :cvMimeType,
        :cvData
      )`,
      {
        userId: result.insertId,

        qualification:
          qualification || null,

        experience:
          experience || null,

        cvFileName:
          req.file.originalname,

        cvMimeType:
          req.file.mimetype,

        cvData:
          req.file.buffer.toString('base64')
      }
    );


    // ------------------------------------------------
    // Do NOT automatically login pending instructor
    // ------------------------------------------------
    //
    // The instructor account remains pending.
    // They can log in manually.
    // Publishing will be restricted until admin approval.
    // ------------------------------------------------


    const user =
      await getSafeUser(result.insertId);


    res.status(201).json({

      success: true,

      pending: true,

      message:
        'Instructor application submitted successfully. Please wait for admin approval.',

      user
    });
  }
);



// ====================================================
// LOGIN
// ====================================================


const login = asyncHandler(
  async (req, res) => {

    const {
      email,
      password
    } = req.body;


    if (!email || !password) {

      res.status(400);

      throw new Error(
        'Email and password are required'
      );
    }


    const normalizedEmail =
      email.trim().toLowerCase();


    const [rows] =
      await pool.execute(
        `SELECT *
         FROM users
         WHERE email = :email`,
        {
          email: normalizedEmail
        }
      );


    const user = rows[0];


    if (
      !user ||
      !(await bcrypt.compare(
        password,
        user.password
      ))
    ) {

      res.status(401);

      throw new Error(
        'Invalid email or password'
      );
    }


    // Blocked users cannot login

    if (user.status === 'blocked') {

      res.status(403);

      throw new Error(
        'Your account has been blocked. Contact support.'
      );
    }


    // ------------------------------------------------
    // IMPORTANT:
    // Pending instructors ARE allowed to login.
    //
    // Their account approval is required only before
    // they can publish a course.
    // ------------------------------------------------


    // Other pending accounts remain blocked from login

    if (
      user.status === 'pending' &&
      user.role !== 'instructor'
    ) {

      res.status(403);

      throw new Error(
        'Your account is pending approval.'
      );
    }


    await sendAuthResponse(
      res,
      user.user_id
    );
  }
);



// ====================================================
// LOGOUT
// ====================================================


const logout = asyncHandler(
  async (req, res) => {

    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'lax',
      secure:
        process.env.NODE_ENV === 'production'
    });


    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
);



// ====================================================
// CURRENT USER
// ====================================================


const getMe = asyncHandler(
  async (req, res) => {

    res.json({
      success: true,
      user: req.user
    });
  }
);



// ====================================================
// PASSWORD RESET REQUEST
// ====================================================


const requestPasswordReset =
  asyncHandler(async (req, res) => {

    const { email } = req.body;


    const [rows] =
      await pool.execute(
        `SELECT user_id, password
         FROM users
         WHERE email = :email`,
        { email }
      );


    const user = rows[0];


    if (!user) {

      return res.json({
        success: true,
        message:
          'If that email exists, a reset link has been sent.'
      });
    }


    const resetToken = jwt.sign(
      {
        id: user.user_id,
        pwdFingerprint:
          user.password.slice(-12)
      },
      process.env.RESET_TOKEN_SECRET,
      {
        expiresIn:
          process.env.RESET_TOKEN_EXPIRES_IN ||
          '30m'
      }
    );


    res.json({
      success: true,
      message:
        'If that email exists, a reset link has been sent.',

      devResetToken:
        process.env.NODE_ENV !== 'production'
          ? resetToken
          : undefined
    });

  });



// ====================================================
// PASSWORD RESET CONFIRM
// ====================================================


const confirmPasswordReset =
  asyncHandler(async (req, res) => {

    const {
      token,
      newPassword
    } = req.body;


    if (!token || !newPassword) {

      res.status(400);

      throw new Error(
        'Token and new password are required'
      );
    }


    if (newPassword.length < 8) {

      res.status(400);

      throw new Error(
        'Password must be at least 8 characters'
      );
    }


    let decoded;


    try {

      decoded = jwt.verify(
        token,
        process.env.RESET_TOKEN_SECRET
      );

    } catch {

      res.status(400);

      throw new Error(
        'Reset token is invalid or has expired'
      );
    }


    const [rows] =
      await pool.execute(
        `SELECT user_id, password
         FROM users
         WHERE user_id = :id`,
        {
          id: decoded.id
        }
      );


    const user = rows[0];


    if (
      !user ||
      user.password.slice(-12) !==
        decoded.pwdFingerprint
    ) {

      res.status(400);

      throw new Error(
        'Reset token is invalid or has already been used'
      );
    }


    const hashed =
      await bcrypt.hash(
        newPassword,
        10
      );


    await pool.execute(
      `UPDATE users
       SET password = :password
       WHERE user_id = :id`,
      {
        password: hashed,
        id: user.user_id
      }
    );


    res.json({
      success: true,
      message:
        'Password has been reset. You can now log in.'
    });

  });



// ====================================================
// EXPORTS
// ====================================================


module.exports = {

  registerStudent,

  registerInstructor,

  login,

  logout,

  getMe,

  requestPasswordReset,

  confirmPasswordReset

};