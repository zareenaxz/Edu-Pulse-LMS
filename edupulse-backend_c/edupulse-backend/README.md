# EduPulse LMS — Backend API (Node.js + Express + MySQL)

Built directly on top of `schema.sql` (your supplied MySQL 8 schema, included **unmodified**).
Every table in that schema has matching endpoints; column names are used as-is (`user_id`, `course_id`, ...).

## Setup
```bash
npm install
cp .env.example .env        # set DB_USER / DB_PASSWORD / JWT secrets
npm run migrate              # runs schema.sql (creates DB, tables, initial categories + badges)
npm run seed                 # optional demo data (password: password123)
npm run dev                  # http://localhost:5000
```
Health check: `GET /api/health`

## Demo accounts (after `npm run seed`, password `password123`)
admin@edupulse.io · sarah.anderson@edupulse.io · david.kim@edupulse.io · elena@rustlabs.io (pending instructor)
· s.chen@university.edu · a.johnson@university.edu · m.rodriguez@university.edu · jane@watson.co (blocked)

## Auth
JWT via `Authorization: Bearer <token>` (also set as httpOnly cookie). Roles: `student`, `instructor`, `admin`
(lowercase, matching the schema ENUM). Blocked users can't log in; new instructors are `pending` until an
admin approves their `instructor_applications` row.

Password reset is stateless (schema has no reset-token table): a short-lived JWT bound to the current
password hash is returned as `devResetToken` in non-production; email it in production.

## Endpoints
| Area | Routes |
|---|---|
| Auth `/api/auth` | POST `register/student` (name,email,password) · POST `register/instructor` (multipart `profile_image`; name,email,password,qualification,experience) · POST `login` · POST `logout` · GET `me` · POST `reset-password/request` · POST `reset-password/confirm` |
| Users `/api/users` | PATCH `me`, `me/password` · admin: GET `/?search&role&status`, POST `/`, GET/PATCH/DELETE `/:id`, PATCH `/:id/block` |
| Instructor applications `/api/instructor-applications` | admin GET `/?status=` · instructor GET `/me` · admin PATCH `/:id/review` `{decision:'approved'\|'rejected'}` |
| Categories `/api/categories` | GET · admin POST/PATCH/DELETE |
| Courses `/api/courses` | GET `catalog?search&category_id` · GET `/` (role-scoped) · POST (instructor, starts `pending`) · GET/PATCH/DELETE `/:id` (admin PATCH `status:'published'` stamps `published_at`) |
| Lessons `/api/courses/:courseId/lessons` | GET, POST, GET/PATCH/DELETE `/:lessonId` (auto `lesson_order`) |
| Enrollments `/api/enrollments` | POST `{course_id}` · GET `me` · GET `course/:courseId` (roster + progress) · PATCH `/:id/status` · DELETE `/:id` |
| Progress `/api/progress` | POST `lessons/:id/complete` · POST `lessons/:id/access` · GET `courses/:courseId` |
| Bookmarks `/api/bookmarks` | GET · POST `{lesson_id}` · DELETE `/:id` |
| Assignments `/api/assignments` | GET `?course_id=` · POST · GET/PATCH/DELETE `/:id` |
| Submissions `/api` | POST `assignments/:id/submissions` (multipart `file` or `submission_text`; auto `late`) · GET `assignments/:id/submissions` · GET `.../me` · PATCH `submissions/:id/grade` `{marks,feedback}` |
| Quizzes `/api/quizzes` | GET, POST (with optional `questions[]`), GET/PATCH/DELETE `/:id`, POST `/:id/questions`, PATCH/DELETE `questions/:qid`, POST `/:id/attempts`, POST `attempts/:attemptId/submit` `{answers:[{question_id,selected_answer}]}` (auto-graded), GET `attempts/me`, GET `/:id/attempts` |
| Discussions `/api/discussions` | GET `?course_id=` · POST · GET/DELETE `/:id` · POST `/:id/replies` · DELETE `replies/:replyId` |
| Certificates `/api/certificates` | GET `verify/:code` (public) · GET `me` · admin GET `/` |
| Badges `/api/badges` | GET · GET `me` · admin POST/PATCH/DELETE |
| Analytics `/api/analytics` | GET `student` · `instructor` · `admin` |

## Automatic behaviour
When a student completes a lesson (`POST /api/progress/lessons/:id/complete`) the server recomputes course
progress, awards every badge whose `percentage_required` is reached (Bronze 25 / Silver 50 / Gold 90 / Master 100),
and at 100% marks the enrollment `completed` and issues a certificate with a unique `certificate_code`.

## Notes / assumptions
- Registration takes a single `name` (schema has one `name` column). The current frontend form splits first/last
  name and collects extra fields (studentId, major, department…) that the schema has no columns for — send
  `name = firstName + ' ' + lastName`; the extra fields are not stored.
- The schema has no notifications, rubrics, settings or study-timer tables, so those frontend features have no
  endpoints yet. Add tables to `schema.sql` if you want them.
- Frontend currently has no API calls; replace mock `useState` data with fetches to the routes above.
