const asyncHandler = require('express-async-handler');
const { pool } = require('../config/db');

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const getQuiz = async (quizId) => {
  const [rows] = await pool.execute(
    `
      SELECT
        q.*,
        c.title AS course_title,
        c.instructor_id
      FROM quizzes q
      JOIN courses c
        ON c.course_id = q.course_id
      WHERE q.quiz_id = :id
    `,
    {
      id: quizId,
    }
  );

  return rows[0] || null;
};

/*
|--------------------------------------------------------------------------
| CHECK QUIZ ACCESS
|--------------------------------------------------------------------------
*/

const ensureQuizAccess = async (
  req,
  res,
  quizId
) => {
  const quiz =
    await getQuiz(quizId);

  if (!quiz) {
    res.status(404);
    throw new Error(
      'Quiz not found'
    );
  }

  /*
   * Instructor can only manage
   * quizzes from their own courses.
   */
  if (
    req.user.role === 'instructor' &&
    Number(quiz.instructor_id) !==
      Number(req.user.user_id)
  ) {
    res.status(403);
    throw new Error(
      'You do not own this course'
    );
  }

  /*
   * Students must be enrolled
   * in the quiz course.
   */
  if (
    req.user.role === 'student'
  ) {
    const [enrollment] =
      await pool.execute(
        `
          SELECT enrollment_id
          FROM enrollments
          WHERE student_id = :studentId
            AND course_id = :courseId
          LIMIT 1
        `,
        {
          studentId:
            req.user.user_id,

          courseId:
            quiz.course_id,
        }
      );

    if (!enrollment.length) {
      res.status(403);

      throw new Error(
        'You are not enrolled in this course'
      );
    }
  }

  return quiz;
};

/*
|--------------------------------------------------------------------------
| RECALCULATE TOTAL MARKS
|--------------------------------------------------------------------------
*/

const recalculateTotalMarks =
  async (quizId, connection = pool) => {
    await connection.execute(
      `
        UPDATE quizzes
        SET total_marks = (
          SELECT COALESCE(
            SUM(marks),
            0
          )
          FROM quiz_questions
          WHERE quiz_id = :quizId
        )
        WHERE quiz_id = :quizId
      `,
      {
        quizId,
      }
    );
  };

/*
|--------------------------------------------------------------------------
| GET QUIZZES
|
| GET /api/quizzes?course_id=17
|--------------------------------------------------------------------------
*/

const getQuizzes =
  asyncHandler(async (req, res) => {
    const clauses = [];
    const params = {};

    /*
     * Course filter
     */
    if (req.query.course_id) {
      clauses.push(
        'q.course_id = :courseId'
      );

      params.courseId =
        req.query.course_id;
    }

    /*
     * Instructor:
     * only own course quizzes
     */
    if (
      req.user.role ===
      'instructor'
    ) {
      clauses.push(
        'c.instructor_id = :instructorId'
      );

      params.instructorId =
        req.user.user_id;
    }

    /*
     * Student:
     * only quizzes from enrolled courses
     */
    if (
      req.user.role ===
      'student'
    ) {
      clauses.push(`
        q.course_id IN (
          SELECT course_id
          FROM enrollments
          WHERE student_id = :studentId
        )
      `);

      params.studentId =
        req.user.user_id;
    }

    const where =
      clauses.length > 0
        ? `WHERE ${clauses.join(
            ' AND '
          )}`
        : '';

    const [rows] =
      await pool.query(
        `
          SELECT
            q.*,

            c.title AS course_title,

            (
              SELECT COUNT(*)
              FROM quiz_questions qq
              WHERE qq.quiz_id =
                q.quiz_id
            ) AS questions_count,

            (
              SELECT COUNT(*)
              FROM quiz_attempts qa
              WHERE qa.quiz_id =
                q.quiz_id
            ) AS attempts_count

          FROM quizzes q

          JOIN courses c
            ON c.course_id =
              q.course_id

          ${where}

          ORDER BY
            q.created_at DESC
        `,
        params
      );

    res.json({
      success: true,
      count: rows.length,
      quizzes: rows,
    });
  });

/*
|--------------------------------------------------------------------------
| GET SINGLE QUIZ
|
| GET /api/quizzes/:id
|--------------------------------------------------------------------------
*/

const getQuizById =
  asyncHandler(async (req, res) => {
    const quiz =
      await ensureQuizAccess(
        req,
        res,
        req.params.id
      );

    /*
     * Students must never receive
     * correct answers.
     */
    const questionColumns =
      req.user.role ===
      'student'
        ? `
            question_id,
            quiz_id,
            question_text,
            option_a,
            option_b,
            option_c,
            option_d,
            marks
          `
        : '*';

    const [questions] =
      await pool.query(
        `
          SELECT
            ${questionColumns}
          FROM quiz_questions
          WHERE quiz_id = ?
          ORDER BY question_id ASC
        `,
        [req.params.id]
      );

    res.json({
      success: true,

      quiz: {
        ...quiz,

        instructor_id:
          undefined,
      },

      questions,
    });
  });

/*
|--------------------------------------------------------------------------
| CREATE QUIZ
|
| POST /api/quizzes
|--------------------------------------------------------------------------
*/

const createQuiz =
  asyncHandler(async (req, res) => {
    const {
      course_id,
      lesson_id,
      title,
      description,
      questions,
    } = req.body;

    /*
     * Basic validation
     */
    if (
      !course_id ||
      !title ||
      !String(title).trim()
    ) {
      res.status(400);

      throw new Error(
        'course_id and title are required'
      );
    }

    if (
      !Array.isArray(
        questions
      ) ||
      questions.length === 0
    ) {
      res.status(400);

      throw new Error(
        'At least one quiz question is required'
      );
    }

    /*
     * Verify course
     */
    const [courses] =
      await pool.execute(
        `
          SELECT
            course_id,
            instructor_id
          FROM courses
          WHERE course_id = :courseId
          LIMIT 1
        `,
        {
          courseId:
            course_id,
        }
      );

    if (!courses.length) {
      res.status(404);

      throw new Error(
        'Course not found'
      );
    }

    /*
     * Only course owner can
     * create the quiz.
     */
    if (
      Number(
        courses[0].instructor_id
      ) !==
      Number(req.user.user_id)
    ) {
      res.status(403);

      throw new Error(
        'You do not own this course'
      );
    }

    /*
     * If a lesson is provided,
     * make sure it belongs to
     * the same course.
     */
    if (lesson_id) {
      const [lessonRows] =
        await pool.execute(
          `
            SELECT lesson_id
            FROM lessons
            WHERE lesson_id = :lessonId
              AND course_id = :courseId
            LIMIT 1
          `,
          {
            lessonId:
              lesson_id,

            courseId:
              course_id,
          }
        );

      if (!lessonRows.length) {
        res.status(400);

        throw new Error(
          'Selected lesson does not belong to this course'
        );
      }
    }

    /*
     * Validate all questions BEFORE
     * opening transaction.
     */
    const cleanQuestions =
      questions.map(
        (question, index) => {
          const questionText =
            String(
              question.question_text ||
                ''
            ).trim();

          const optionA =
            String(
              question.option_a ||
                ''
            ).trim();

          const optionB =
            String(
              question.option_b ||
                ''
            ).trim();

          const optionC =
            String(
              question.option_c ||
                ''
            ).trim();

          const optionD =
            String(
              question.option_d ||
                ''
            ).trim();

          const correctAnswer =
            String(
              question.correct_answer ||
                ''
            ).toUpperCase();

          const marks =
            Number(
              question.marks || 1
            );

          if (!questionText) {
            throw new Error(
              `Question ${
                index + 1
              }: question text is required`
            );
          }

          if (!optionA) {
            throw new Error(
              `Question ${
                index + 1
              }: Option A is required`
            );
          }

          if (!optionB) {
            throw new Error(
              `Question ${
                index + 1
              }: Option B is required`
            );
          }

          if (!optionC) {
            throw new Error(
              `Question ${
                index + 1
              }: Option C is required`
            );
          }

          if (!optionD) {
            throw new Error(
              `Question ${
                index + 1
              }: Option D is required`
            );
          }

          if (
            ![
              'A',
              'B',
              'C',
              'D',
            ].includes(
              correctAnswer
            )
          ) {
            throw new Error(
              `Question ${
                index + 1
              }: correct answer must be A, B, C or D`
            );
          }

          if (
            !Number.isFinite(
              marks
            ) ||
            marks <= 0
          ) {
            throw new Error(
              `Question ${
                index + 1
              }: marks must be greater than 0`
            );
          }

          return {
            question_text:
              questionText,

            option_a:
              optionA,

            option_b:
              optionB,

            option_c:
              optionC,

            option_d:
              optionD,

            correct_answer:
              correctAnswer,

            marks,
          };
        }
      );

    /*
     * TRANSACTION
     *
     * Quiz + all questions are saved
     * together.
     *
     * If any question fails,
     * the entire quiz creation
     * is rolled back.
     */
    const connection =
      await pool.getConnection();

    try {
      await connection.beginTransaction();

      /*
       * Create quiz
       */
      const [
        quizResult,
      ] =
        await connection.execute(
          `
            INSERT INTO quizzes
            (
              course_id,
              lesson_id,
              title,
              description,
              total_marks
            )
            VALUES
            (
              :courseId,
              :lessonId,
              :title,
              :description,
              0
            )
          `,
          {
            courseId:
              course_id,

            lessonId:
              lesson_id ||
              null,

            title:
              String(
                title
              ).trim(),

            description:
              description
                ? String(
                    description
                  ).trim()
                : null,
          }
        );

      const quizId =
        quizResult.insertId;

      /*
       * Insert questions
       */
      for (
        const question of
          cleanQuestions
      ) {
        await connection.execute(
          `
            INSERT INTO quiz_questions
            (
              quiz_id,
              question_text,
              option_a,
              option_b,
              option_c,
              option_d,
              correct_answer,
              marks
            )
            VALUES
            (
              :quizId,
              :questionText,
              :optionA,
              :optionB,
              :optionC,
              :optionD,
              :correctAnswer,
              :marks
            )
          `,
          {
            quizId,

            questionText:
              question.question_text,

            optionA:
              question.option_a,

            optionB:
              question.option_b,

            optionC:
              question.option_c,

            optionD:
              question.option_d,

            correctAnswer:
              question.correct_answer,

            marks:
              question.marks,
          }
        );
      }

      /*
       * Calculate total marks
       */
      await recalculateTotalMarks(
        quizId,
        connection
      );

      /*
       * Everything succeeded.
       */
      await connection.commit();

      /*
       * Return complete quiz
       */
      const [
        quizRows,
      ] =
        await connection.execute(
          `
            SELECT *
            FROM quizzes
            WHERE quiz_id = :quizId
          `,
          {
            quizId,
          }
        );

      const [
        questionRows,
      ] =
        await connection.execute(
          `
            SELECT *
            FROM quiz_questions
            WHERE quiz_id = :quizId
            ORDER BY question_id ASC
          `,
          {
            quizId,
          }
        );

      res.status(201).json({
        success: true,

        message:
          'Quiz created successfully',

        quiz:
          quizRows[0],

        questions:
          questionRows,
      });

    } catch (error) {
      /*
       * Rollback everything if
       * any database operation fails.
       */
      await connection.rollback();

      console.error(
        'Quiz creation transaction failed:',
        error
      );

      throw error;

    } finally {
      connection.release();
    }
  });

/*
|--------------------------------------------------------------------------
| UPDATE QUIZ
|
| PATCH /api/quizzes/:id
|--------------------------------------------------------------------------
*/

const updateQuiz =
  asyncHandler(async (req, res) => {
    await ensureQuizAccess(
      req,
      res,
      req.params.id
    );

    const {
      title,
      description,
      lesson_id,
    } = req.body;

    const fields = [];
    const params = {
      id: req.params.id,
    };

    if (
      title !== undefined
    ) {
      if (
        !String(title).trim()
      ) {
        res.status(400);

        throw new Error(
          'Quiz title cannot be empty'
        );
      }

      fields.push(
        'title = :title'
      );

      params.title =
        String(title).trim();
    }

    if (
      description !==
      undefined
    ) {
      params.description =
        description
          ? String(
              description
            ).trim()
          : null;

      fields.push(
        'description = :description'
      );
    }

    if (
      lesson_id !==
      undefined
    ) {
      /*
       * Validate lesson
       */
      if (lesson_id) {
        const quiz =
          await getQuiz(
            req.params.id
          );

        const [
          lessonRows,
        ] =
          await pool.execute(
            `
              SELECT lesson_id
              FROM lessons
              WHERE lesson_id = :lessonId
                AND course_id = :courseId
              LIMIT 1
            `,
            {
              lessonId:
                lesson_id,

              courseId:
                quiz.course_id,
            }
          );

        if (!lessonRows.length) {
          res.status(400);

          throw new Error(
            'Selected lesson does not belong to this course'
          );
        }
      }

      fields.push(
        'lesson_id = :lessonId'
      );

      params.lessonId =
        lesson_id || null;
    }

    if (!fields.length) {
      res.status(400);

      throw new Error(
        'No updatable fields provided'
      );
    }

    await pool.execute(
      `
        UPDATE quizzes
        SET ${fields.join(', ')}
        WHERE quiz_id = :id
      `,
      params
    );

    const [
      rows,
    ] =
      await pool.execute(
        `
          SELECT *
          FROM quizzes
          WHERE quiz_id = :id
        `,
        {
          id:
            req.params.id,
        }
      );

    res.json({
      success: true,
      quiz: rows[0],
    });
  });

/*
|--------------------------------------------------------------------------
| DELETE QUIZ
|
| DELETE /api/quizzes/:id
|--------------------------------------------------------------------------
*/

const deleteQuiz =
  asyncHandler(async (req, res) => {
    await ensureQuizAccess(
      req,
      res,
      req.params.id
    );

    await pool.execute(
      `
        DELETE FROM quizzes
        WHERE quiz_id = :id
      `,
      {
        id:
          req.params.id,
      }
    );

    res.json({
      success: true,

      message:
        'Quiz deleted successfully',
    });
  });

/*
|--------------------------------------------------------------------------
| ADD QUESTION
|
| POST /api/quizzes/:id/questions
|--------------------------------------------------------------------------
*/

const addQuestion =
  asyncHandler(async (req, res) => {
    await ensureQuizAccess(
      req,
      res,
      req.params.id
    );

    const {
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      marks,
    } = req.body;

    if (
      !question_text ||
      !String(
        question_text
      ).trim()
    ) {
      res.status(400);

      throw new Error(
        'question_text is required'
      );
    }

    const correct =
      String(
        correct_answer || ''
      ).toUpperCase();

    if (
      ![
        'A',
        'B',
        'C',
        'D',
      ].includes(correct)
    ) {
      res.status(400);

      throw new Error(
        'correct_answer must be A, B, C or D'
      );
    }

    const questionMarks =
      Number(
        marks || 1
      );

    if (
      !Number.isFinite(
        questionMarks
      ) ||
      questionMarks <= 0
    ) {
      res.status(400);

      throw new Error(
        'marks must be greater than 0'
      );
    }

    const [
      result,
    ] =
      await pool.execute(
        `
          INSERT INTO quiz_questions
          (
            quiz_id,
            question_text,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_answer,
            marks
          )
          VALUES
          (
            :quizId,
            :questionText,
            :optionA,
            :optionB,
            :optionC,
            :optionD,
            :correctAnswer,
            :marks
          )
        `,
        {
          quizId:
            req.params.id,

          questionText:
            String(
              question_text
            ).trim(),

          optionA:
            option_a ||
            null,

          optionB:
            option_b ||
            null,

          optionC:
            option_c ||
            null,

          optionD:
            option_d ||
            null,

          correctAnswer:
            correct,

          marks:
            questionMarks,
        }
      );

    await recalculateTotalMarks(
      req.params.id
    );

    const [
      rows,
    ] =
      await pool.execute(
        `
          SELECT *
          FROM quiz_questions
          WHERE question_id = :id
        `,
        {
          id:
            result.insertId,
        }
      );

    res.status(201).json({
      success: true,

      question:
        rows[0],
    });
  });

/*
|--------------------------------------------------------------------------
| UPDATE QUESTION
|
| PATCH /api/quizzes/questions/:questionId
|--------------------------------------------------------------------------
*/

const updateQuestion =
  asyncHandler(async (req, res) => {
    const [
      quizQuestionRows,
    ] =
      await pool.execute(
        `
          SELECT quiz_id
          FROM quiz_questions
          WHERE question_id = :id
        `,
        {
          id:
            req.params
              .questionId,
        }
      );

    if (
      !quizQuestionRows.length
    ) {
      res.status(404);

      throw new Error(
        'Question not found'
      );
    }

    const quizId =
      quizQuestionRows[0]
        .quiz_id;

    await ensureQuizAccess(
      req,
      res,
      quizId
    );

    const allowedFields = [
      'question_text',
      'option_a',
      'option_b',
      'option_c',
      'option_d',
      'correct_answer',
      'marks',
    ];

    const fields = [];
    const params = {
      id:
        req.params
          .questionId,
    };

    for (
      const field of
        allowedFields
    ) {
      if (
        req.body[field] !==
        undefined
      ) {
        fields.push(
          `${field} = :${field}`
        );

        params[field] =
          req.body[field];
      }
    }

    if (!fields.length) {
      res.status(400);

      throw new Error(
        'No updatable fields provided'
      );
    }

    if (
      req.body.correct_answer !==
      undefined
    ) {
      const answer =
        String(
          req.body
            .correct_answer
        ).toUpperCase();

      if (
        ![
          'A',
          'B',
          'C',
          'D',
        ].includes(answer)
      ) {
        res.status(400);

        throw new Error(
          'correct_answer must be A, B, C or D'
        );
      }

      params.correct_answer =
        answer;
    }

    if (
      req.body.marks !==
      undefined
    ) {
      const questionMarks =
        Number(
          req.body.marks
        );

      if (
        !Number.isFinite(
          questionMarks
        ) ||
        questionMarks <= 0
      ) {
        res.status(400);

        throw new Error(
          'marks must be greater than 0'
        );
      }

      params.marks =
        questionMarks;
    }

    await pool.execute(
      `
        UPDATE quiz_questions
        SET ${fields.join(', ')}
        WHERE question_id = :id
      `,
      params
    );

    await recalculateTotalMarks(
      quizId
    );

    const [
      rows,
    ] =
      await pool.execute(
        `
          SELECT *
          FROM quiz_questions
          WHERE question_id = :id
        `,
        {
          id:
            req.params
              .questionId,
        }
      );

    res.json({
      success: true,

      question:
        rows[0],
    });
  });

/*
|--------------------------------------------------------------------------
| DELETE QUESTION
|
| DELETE /api/quizzes/questions/:questionId
|--------------------------------------------------------------------------
*/

const deleteQuestion =
  asyncHandler(async (req, res) => {
    const [
      questionRows,
    ] =
      await pool.execute(
        `
          SELECT quiz_id
          FROM quiz_questions
          WHERE question_id = :id
        `,
        {
          id:
            req.params
              .questionId,
        }
      );

    if (
      !questionRows.length
    ) {
      res.status(404);

      throw new Error(
        'Question not found'
      );
    }

    const quizId =
      questionRows[0]
        .quiz_id;

    await ensureQuizAccess(
      req,
      res,
      quizId
    );

    await pool.execute(
      `
        DELETE FROM quiz_questions
        WHERE question_id = :id
      `,
      {
        id:
          req.params
            .questionId,
      }
    );

    await recalculateTotalMarks(
      quizId
    );

    res.json({
      success: true,

      message:
        'Question deleted successfully',
    });
  });

/*
|--------------------------------------------------------------------------
| START QUIZ ATTEMPT
|
| POST /api/quizzes/:id/attempts
|--------------------------------------------------------------------------
*/

const startAttempt =
  asyncHandler(async (req, res) => {
    const quiz =
      await ensureQuizAccess(
        req,
        res,
        req.params.id
      );

    if (
      req.user.role !==
      'student'
    ) {
      res.status(403);

      throw new Error(
        'Only students can attempt quizzes'
      );
    }

    const [
      result,
    ] =
      await pool.execute(
        `
          INSERT INTO quiz_attempts
          (
            quiz_id,
            student_id
          )
          VALUES
          (
            :quizId,
            :studentId
          )
        `,
        {
          quizId:
            quiz.quiz_id,

          studentId:
            req.user.user_id,
        }
      );

    res.status(201).json({
      success: true,

      attempt_id:
        result.insertId,
    });
  });

/*
|--------------------------------------------------------------------------
| SUBMIT QUIZ
|
| POST /api/quizzes/attempts/:attemptId/submit
|--------------------------------------------------------------------------
*/

const submitAttempt =
  asyncHandler(async (req, res) => {
    const [
      attemptRows,
    ] =
      await pool.execute(
        `
          SELECT *
          FROM quiz_attempts
          WHERE attempt_id = :id
            AND student_id = :studentId
        `,
        {
          id:
            req.params
              .attemptId,

          studentId:
            req.user.user_id,
        }
      );

    const attempt =
      attemptRows[0];

    if (!attempt) {
      res.status(404);

      throw new Error(
        'Attempt not found'
      );
    }

    if (
      attempt.completed_at
    ) {
      res.status(409);

      throw new Error(
        'This attempt has already been submitted'
      );
    }

    const [
      questions,
    ] =
      await pool.execute(
        `
          SELECT *
          FROM quiz_questions
          WHERE quiz_id = :quizId
          ORDER BY question_id
        `,
        {
          quizId:
            attempt.quiz_id,
        }
      );

    const answers =
      Array.isArray(
        req.body.answers
      )
        ? req.body.answers
        : [];

    const answersByQuestion =
      Object.fromEntries(
        answers.map(
          (answer) => [
            answer.question_id,
            String(
              answer.selected_answer ||
                ''
            ).toUpperCase(),
          ]
        )
      );

    let score = 0;

    for (
      const question of
        questions
    ) {
      const selected =
        answersByQuestion[
          question.question_id
        ] || null;

      const isCorrect =
        selected !== null &&
        selected ===
          question.correct_answer;

      if (isCorrect) {
        score +=
          Number(
            question.marks
          );
      }

      await pool.execute(
        `
          INSERT INTO quiz_answers
          (
            attempt_id,
            question_id,
            selected_answer,
            is_correct
          )
          VALUES
          (
            :attemptId,
            :questionId,
            :selectedAnswer,
            :isCorrect
          )
          ON DUPLICATE KEY UPDATE
            selected_answer =
              VALUES(selected_answer),
            is_correct =
              VALUES(is_correct)
        `,
        {
          attemptId:
            attempt.attempt_id,

          questionId:
            question.question_id,

          selectedAnswer:
            selected,

          isCorrect:
            isCorrect ? 1 : 0,
        }
      );
    }

    await pool.execute(
      `
        UPDATE quiz_attempts
        SET
          score = :score,
          completed_at = NOW()
        WHERE attempt_id = :attemptId
      `,
      {
        score,

        attemptId:
          attempt.attempt_id,
      }
    );

    const [
      quizRows,
    ] =
      await pool.execute(
        `
          SELECT
            total_marks
          FROM quizzes
          WHERE quiz_id = :quizId
        `,
        {
          quizId:
            attempt.quiz_id,
        }
      );

    const totalMarks =
      Number(
        quizRows[0]
          ?.total_marks || 0
      );

    const percentage =
      totalMarks > 0
        ? Number(
            (
              (score /
                totalMarks) *
              100
            ).toFixed(2)
          )
        : 0;

    res.json({
      success: true,

      score,

      total_marks:
        totalMarks,

      percentage,
    });
  });

/*
|--------------------------------------------------------------------------
| STUDENT — MY ATTEMPTS
|
| GET /api/quizzes/attempts/me
|--------------------------------------------------------------------------
*/

const getMyAttempts =
  asyncHandler(async (req, res) => {
    const params = {
      studentId:
        req.user.user_id,
    };

    let extra = '';

    if (
      req.query.quiz_id
    ) {
      extra =
        'AND qa.quiz_id = :quizId';

      params.quizId =
        req.query.quiz_id;
    }

    const [
      rows,
    ] =
      await pool.query(
        `
          SELECT
            qa.*,

            q.title,

            q.total_marks,

            c.title AS course_title

          FROM quiz_attempts qa

          JOIN quizzes q
            ON q.quiz_id =
              qa.quiz_id

          JOIN courses c
            ON c.course_id =
              q.course_id

          WHERE
            qa.student_id =
              :studentId

            ${extra}

          ORDER BY
            qa.started_at DESC
        `,
        params
      );

    res.json({
      success: true,

      count:
        rows.length,

      attempts:
        rows,
    });
  });

/*
|--------------------------------------------------------------------------
| INSTRUCTOR — QUIZ ATTEMPTS
|
| GET /api/quizzes/:id/attempts
|--------------------------------------------------------------------------
*/

const getQuizAttempts =
  asyncHandler(async (req, res) => {
    await ensureQuizAccess(
      req,
      res,
      req.params.id
    );

    if (
      req.user.role !==
      'instructor'
    ) {
      res.status(403);

      throw new Error(
        'Only instructors can view quiz attempts'
      );
    }

    const [
      rows,
    ] =
      await pool.execute(
        `
          SELECT
            qa.*,

            u.name AS student_name,

            u.email AS student_email

          FROM quiz_attempts qa

          JOIN users u
            ON u.user_id =
              qa.student_id

          WHERE
            qa.quiz_id =
              :quizId

          ORDER BY
            qa.started_at DESC
        `,
        {
          quizId:
            req.params.id,
        }
      );

    res.json({
      success: true,

      count:
        rows.length,

      attempts:
        rows,
    });
  });

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  getQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,

  addQuestion,
  updateQuestion,
  deleteQuestion,

  startAttempt,
  submitAttempt,

  getMyAttempts,
  getQuizAttempts,
};