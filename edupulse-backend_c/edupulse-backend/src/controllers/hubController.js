const asyncHandler = require('express-async-handler');
const { pool } = require('../config/db');

/* ============================================================
   COMMON HELPERS
============================================================ */

const byNewest = (a, b) =>
  String(b.submitted_at || '').localeCompare(
    String(a.submitted_at || '')
  );

/* ============================================================
   ASSIGNMENT ITEMS
============================================================ */

const ASSIGNMENT_ITEMS = (extra) => `
  SELECT
    s.submission_id AS id,
    'assignment' AS item_type,
    s.assignment_id AS item_id,
    a.title,
    a.course_id,
    c.title AS course_title,
    s.student_id,
    u.name AS student_name,
    u.email AS student_email,
    s.submitted_at,
    s.status,
    s.marks AS score,
    a.max_marks AS max_score,
    s.file_url,
    s.submission_text,
    s.feedback,

    (
      SELECT COUNT(*)
      FROM submission_history h
      WHERE h.submission_id = s.submission_id
    ) AS previous_versions

  FROM submissions s

  JOIN assignments a
    ON a.assignment_id = s.assignment_id

  JOIN courses c
    ON c.course_id = a.course_id

  JOIN users u
    ON u.user_id = s.student_id

  WHERE ${extra}
`;

/* ============================================================
   QUIZ ITEMS
============================================================ */

const QUIZ_ITEMS = (extra) => `
  SELECT
    qa.attempt_id AS id,
    'quiz' AS item_type,
    qa.quiz_id AS item_id,
    q.title,
    q.course_id,
    c.title AS course_title,
    qa.student_id,
    u.name AS student_name,
    u.email AS student_email,
    qa.completed_at AS submitted_at,
    'graded' AS status,
    qa.score AS score,
    q.total_marks AS max_score,
    NULL AS file_url,
    NULL AS submission_text,
    NULL AS feedback,
    0 AS previous_versions

  FROM quiz_attempts qa

  JOIN quizzes q
    ON q.quiz_id = qa.quiz_id

  JOIN courses c
    ON c.course_id = q.course_id

  JOIN users u
    ON u.user_id = qa.student_id

  WHERE qa.completed_at IS NOT NULL
    AND ${extra}
`;

/* ============================================================
   INSTRUCTOR COURSE HUB
============================================================ */

/*
  GET /api/hub/course/:courseId

  Returns:
  - Assignment submissions
  - Quiz attempts
  - Summary
*/

const getCourseHub = asyncHandler(
  async (req, res) => {

    const [courseRows] =
      await pool.execute(
        `
        SELECT *
        FROM courses
        WHERE course_id = :id
        `,
        {
          id: req.params.courseId,
        }
      );

    const course = courseRows[0];

    if (!course) {
      res.status(404);

      throw new Error(
        'Course not found'
      );
    }

    /* --------------------------------------------------------
       Instructor ownership check
    -------------------------------------------------------- */

    if (
      req.user.role === 'instructor' &&
      Number(course.instructor_id) !==
        Number(req.user.user_id)
    ) {
      res.status(403);

      throw new Error(
        'You do not own this course'
      );
    }

    const {
      type = 'all',
      status,
      student_id,
      item_id,
    } = req.query;

    const params = {
      c: req.params.courseId,
    };

    let assignmentExtra =
      'a.course_id = :c';

    let quizExtra =
      'q.course_id = :c';

    if (student_id) {

      assignmentExtra +=
        ' AND s.student_id = :stu';

      quizExtra +=
        ' AND qa.student_id = :stu';

      params.stu = student_id;
    }

    if (item_id) {

      assignmentExtra +=
        ' AND s.assignment_id = :item';

      quizExtra +=
        ' AND qa.quiz_id = :item';

      params.item = item_id;
    }

    let items = [];

    /* --------------------------------------------------------
       ASSIGNMENTS
    -------------------------------------------------------- */

    if (
      type === 'all' ||
      type === 'assignment'
    ) {

      const [rows] =
        await pool.query(
          `
          ${ASSIGNMENT_ITEMS(
            assignmentExtra
          )}

          ORDER BY s.submitted_at DESC
          `,
          params
        );

      items = items.concat(rows);
    }

    /* --------------------------------------------------------
       QUIZZES
    -------------------------------------------------------- */

    if (
      type === 'all' ||
      type === 'quiz'
    ) {

      const [rows] =
        await pool.query(
          `
          ${QUIZ_ITEMS(
            quizExtra
          )}

          ORDER BY qa.completed_at DESC
          `,
          params
        );

      items = items.concat(rows);
    }

    /* --------------------------------------------------------
       STATUS FILTER
    -------------------------------------------------------- */

    if (status) {

      items = items.filter(
        (item) =>
          item.status === status
      );
    }

    items.sort(byNewest);

    /* --------------------------------------------------------
       SUMMARY
    -------------------------------------------------------- */

    const summary = {
      total: items.length,

      assignments:
        items.filter(
          (item) =>
            item.item_type ===
            'assignment'
        ).length,

      quizzes:
        items.filter(
          (item) =>
            item.item_type ===
            'quiz'
        ).length,

      needs_grading:
        items.filter(
          (item) =>
            item.item_type ===
              'assignment' &&
            item.status !==
              'graded'
        ).length,

      late:
        items.filter(
          (item) =>
            item.status ===
            'late'
        ).length,

      resubmitted:
        items.filter(
          (item) =>
            Number(
              item.previous_versions
            ) > 0
        ).length,
    };

    res.json({
      success: true,

      course: {
        course_id:
          course.course_id,

        title:
          course.title,
      },

      summary,

      items,
    });
  }
);

/* ============================================================
   STUDENT PERSONAL HUB
============================================================ */

/*
  GET /api/hub/me?course_id=
*/

const getMyHub = asyncHandler(
  async (req, res) => {

    const params = {
      stu: req.user.user_id,
    };

    let assignmentExtra =
      's.student_id = :stu';

    let quizExtra =
      'qa.student_id = :stu';

    if (req.query.course_id) {

      assignmentExtra +=
        ' AND a.course_id = :c';

      quizExtra +=
        ' AND q.course_id = :c';

      params.c =
        req.query.course_id;
    }

    const [assignments] =
      await pool.query(
        ASSIGNMENT_ITEMS(
          assignmentExtra
        ),
        params
      );

    const [quizzes] =
      await pool.query(
        QUIZ_ITEMS(
          quizExtra
        ),
        params
      );

    const items = [
      ...assignments,
      ...quizzes,
    ].sort(byNewest);

    res.json({
      success: true,

      count:
        items.length,

      items,
    });
  }
);

/* ============================================================
   SUBMISSION HISTORY
============================================================ */

/*
  GET /api/hub/submissions/:submissionId/history
*/

const getSubmissionHistory =
  asyncHandler(
    async (req, res) => {

      const [rows] =
        await pool.execute(
          `
          SELECT
            s.*,
            a.title AS assignment_title,
            a.max_marks,
            c.instructor_id,
            u.name AS student_name

          FROM submissions s

          JOIN assignments a
            ON a.assignment_id =
              s.assignment_id

          JOIN courses c
            ON c.course_id =
              a.course_id

          JOIN users u
            ON u.user_id =
              s.student_id

          WHERE s.submission_id =
            :id
          `,
          {
            id:
              req.params.submissionId,
          }
        );

      const submission =
        rows[0];

      if (!submission) {
        res.status(404);

        throw new Error(
          'Submission not found'
        );
      }

      const {
        role,
        user_id,
      } = req.user;

      const allowed =
        role === 'admin' ||
        (
          role === 'instructor' &&
          Number(
            submission.instructor_id
          ) ===
            Number(user_id)
        ) ||
        (
          role === 'student' &&
          Number(
            submission.student_id
          ) ===
            Number(user_id)
        );

      if (!allowed) {

        res.status(403);

        throw new Error(
          'Not allowed to view this submission'
        );
      }

      const [history] =
        await pool.execute(
          `
          SELECT
            history_id,
            submission_text,
            file_url,
            status,
            marks,
            feedback,
            submitted_at,
            archived_at

          FROM submission_history

          WHERE submission_id =
            :id

          ORDER BY
            archived_at DESC,
            history_id DESC
          `,
          {
            id:
              req.params.submissionId,
          }
        );

      res.json({
        success: true,

        assignment_title:
          submission.assignment_title,

        student_name:
          submission.student_name,

        max_marks:
          submission.max_marks,

        current: {
          submission_text:
            submission.submission_text,

          file_url:
            submission.file_url,

          status:
            submission.status,

          marks:
            submission.marks,

          feedback:
            submission.feedback,

          submitted_at:
            submission.submitted_at,
        },

        history,
      });
    }
  );

/* ============================================================
   ASSIGNMENT SUBMISSION STATUS TRACKER
============================================================ */

/*
  GET /api/hub/course/:courseId/assignment-status

  This endpoint returns:

  1. Course information
  2. All assignments
  3. All enrolled students
  4. Each student's status for every assignment
  5. Assignment-wise submission summary
  6. Overall summary
*/

const getCourseAssignmentStatus =
  asyncHandler(
    async (req, res) => {

      const courseId =
        req.params.courseId;

      /* ======================================================
         COURSE
      ====================================================== */

      const [courseRows] =
        await pool.execute(
          `
          SELECT
            course_id,
            title,
            instructor_id

          FROM courses

          WHERE course_id =
            :courseId
          `,
          {
            courseId,
          }
        );

      const course =
        courseRows[0];

      if (!course) {

        res.status(404);

        throw new Error(
          'Course not found'
        );
      }

      /* ======================================================
         INSTRUCTOR OWNERSHIP
      ====================================================== */

      if (
        req.user.role ===
          'instructor' &&
        Number(
          course.instructor_id
        ) !==
          Number(
            req.user.user_id
          )
      ) {

        res.status(403);

        throw new Error(
          'You do not own this course'
        );
      }

      /* ======================================================
         ALL ASSIGNMENTS
      ====================================================== */

      const [assignments] =
        await pool.execute(
          `
          SELECT
            assignment_id,
            title,
            deadline,
            max_marks

          FROM assignments

          WHERE course_id =
            :courseId

          ORDER BY
            deadline ASC,
            assignment_id ASC
          `,
          {
            courseId,
          }
        );

      /* ======================================================
         ALL ENROLLED STUDENTS
      ====================================================== */

      const [students] =
        await pool.execute(
          `
          SELECT
            e.enrollment_id,
            e.student_id,
            e.enrolled_at,
            e.status AS enrollment_status,

            u.name AS student_name,
            u.email AS student_email

          FROM enrollments e

          JOIN users u
            ON u.user_id =
              e.student_id

          WHERE e.course_id =
            :courseId

          ORDER BY
            u.name ASC
          `,
          {
            courseId,
          }
        );

      /* ======================================================
         ALL SUBMISSIONS
      ====================================================== */

      const [submissions] =
        await pool.execute(
          `
          SELECT
            s.submission_id,
            s.assignment_id,
            s.student_id,
            s.submitted_at,
            s.status,
            s.marks,
            s.graded_at

          FROM submissions s

          JOIN assignments a
            ON a.assignment_id =
              s.assignment_id

          WHERE a.course_id =
            :courseId
          `,
          {
            courseId,
          }
        );

      /* ======================================================
         CREATE FAST LOOKUP MAP

         studentId + assignmentId
         -> submission
      ====================================================== */

      const submissionMap =
        new Map();

      submissions.forEach(
        (submission) => {

          const key =
            `${submission.student_id}-${submission.assignment_id}`;

          submissionMap.set(
            key,
            submission
          );
        }
      );

      /* ======================================================
         BUILD STUDENT MATRIX
      ====================================================== */

      const studentRows =
        students.map(
          (student) => {

            const assignmentStatus =
              assignments.map(
                (assignment) => {

                  const key =
                    `${student.student_id}-${assignment.assignment_id}`;

                  const submission =
                    submissionMap.get(
                      key
                    );

                  /* ----------------------------------------
                     NO SUBMISSION
                  ---------------------------------------- */

                  if (!submission) {

                    return {
                      assignment_id:
                        assignment.assignment_id,

                      title:
                        assignment.title,

                      deadline:
                        assignment.deadline,

                      max_marks:
                        assignment.max_marks,

                      submitted:
                        false,

                      submission_id:
                        null,

                      submitted_at:
                        null,

                      status:
                        'not_submitted',

                      marks:
                        null,

                      graded_at:
                        null,
                    };
                  }

                  /* ----------------------------------------
                     SUBMISSION EXISTS
                  ---------------------------------------- */

                  return {
                    assignment_id:
                      assignment.assignment_id,

                    title:
                      assignment.title,

                    deadline:
                      assignment.deadline,

                    max_marks:
                      assignment.max_marks,

                    submitted:
                      true,

                    submission_id:
                      submission.submission_id,

                    submitted_at:
                      submission.submitted_at,

                    status:
                      submission.status ||
                      'submitted',

                    marks:
                      submission.marks ??
                      null,

                    graded_at:
                      submission.graded_at ||
                      null,
                  };
                }
              );

            /* =================================================
               STUDENT COUNTS
            ================================================= */

            const submittedCount =
              assignmentStatus.filter(
                (item) =>
                  item.submitted
              ).length;

            const notSubmittedCount =
              assignmentStatus.filter(
                (item) =>
                  !item.submitted
              ).length;

            const gradedCount =
              assignmentStatus.filter(
                (item) =>
                  item.status ===
                  'graded'
              ).length;

            const pendingCount =
              assignmentStatus.filter(
                (item) =>
                  item.submitted &&
                  item.status !==
                    'graded'
              ).length;

            return {
              enrollment_id:
                student.enrollment_id,

              student_id:
                student.student_id,

              name:
                student.student_name,

              email:
                student.student_email,

              student_name:
                student.student_name,

              student_email:
                student.student_email,

              enrolled_at:
                student.enrolled_at,

              enrollment_status:
                student.enrollment_status,

              submitted_count:
                submittedCount,

              missing_count:
                notSubmittedCount,

              not_submitted_count:
                notSubmittedCount,

              graded_count:
                gradedCount,

              pending_count:
                pendingCount,

              assignments:
                assignmentStatus.reduce(
                  (
                    result,
                    assignment
                  ) => {

                    result[
                      assignment.assignment_id
                    ] =
                      assignment;

                    return result;
                  },
                  {}
                ),
            };
          }
        );

      /* ======================================================
         ASSIGNMENT-WISE SUMMARY
      ====================================================== */

      const assignmentSummary =
        assignments.map(
          (assignment) => {

            const assignmentRows =
              studentRows.map(
                (student) =>
                  student.assignments[
                    assignment.assignment_id
                  ]
              );

            const submitted =
              assignmentRows.filter(
                (item) =>
                  item?.submitted
              ).length;

            const notSubmitted =
              assignmentRows.filter(
                (item) =>
                  !item?.submitted
              ).length;

            const graded =
              assignmentRows.filter(
                (item) =>
                  item?.status ===
                  'graded'
              ).length;

            const pending =
              assignmentRows.filter(
                (item) =>
                  item?.submitted &&
                  item?.status !==
                    'graded'
              ).length;

            return {
              assignment_id:
                assignment.assignment_id,

              title:
                assignment.title,

              deadline:
                assignment.deadline,

              max_marks:
                assignment.max_marks,

              submitted_count:
                submitted,

              not_submitted_count:
                notSubmitted,

              graded_count:
                graded,

              pending_count:
                pending,

              total_students:
                assignmentRows.length,
            };
          }
        );

      /* ======================================================
         OVERALL SUMMARY
      ====================================================== */

      const totalStudents =
        studentRows.length;

      const totalAssignments =
        assignments.length;

      const totalPossibleSubmissions =
        totalStudents *
        totalAssignments;

      const totalSubmissions =
        studentRows.reduce(
          (total, student) =>
            total +
            Number(
              student.submitted_count ||
                0
            ),
          0
        );

      const totalNotSubmitted =
        studentRows.reduce(
          (total, student) =>
            total +
            Number(
              student.not_submitted_count ||
                0
            ),
          0
        );

      const totalGraded =
        studentRows.reduce(
          (total, student) =>
            total +
            Number(
              student.graded_count ||
                0
            ),
          0
        );

      const totalPending =
        studentRows.reduce(
          (total, student) =>
            total +
            Number(
              student.pending_count ||
                0
            ),
          0
        );

      /* ======================================================
         RESPONSE
      ====================================================== */

      res.json({

        success: true,

        course: {
          course_id:
            course.course_id,

          title:
            course.title,
        },

        summary: {

          total_students:
            totalStudents,

          total_assignments:
            totalAssignments,

          total_possible_submissions:
            totalPossibleSubmissions,

          total_submissions:
            totalSubmissions,

          total_not_submitted:
            totalNotSubmitted,

          total_graded:
            totalGraded,

          total_pending:
            totalPending,
        },

        assignment_summary:
          assignmentSummary,

        students:
          studentRows,
      });
    }
  );

/* ============================================================
   EXPORTS
============================================================ */

module.exports = {
  getCourseHub,
  getMyHub,
  getSubmissionHistory,
  getCourseAssignmentStatus,
};