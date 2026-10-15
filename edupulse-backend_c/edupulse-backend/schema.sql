-- =========================================================
-- EDUPULSE LMS DATABASE
-- MySQL 8+
-- =========================================================

CREATE DATABASE IF NOT EXISTS edupulse;

USE edupulse;


-- =========================================================
-- 1. USERS
-- =========================================================

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'instructor', 'admin') NOT NULL DEFAULT 'student',
    status ENUM('active', 'pending', 'blocked') NOT NULL DEFAULT 'active',
    profile_image VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 2. INSTRUCTOR APPLICATIONS
-- =========================================================

CREATE TABLE instructor_applications (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    qualification VARCHAR(255),
    experience TEXT,
    application_status ENUM('pending', 'approved', 'rejected')
        NOT NULL DEFAULT 'pending',
    reviewed_by INT NULL,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME NULL,

    CONSTRAINT fk_application_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_application_reviewer
        FOREIGN KEY (reviewed_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);


-- =========================================================
-- 3. CATEGORIES
-- =========================================================

CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 4. COURSES
-- =========================================================

CREATE TABLE courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    instructor_id INT NOT NULL,

    title VARCHAR(200) NOT NULL,
    description TEXT,
    thumbnail VARCHAR(255),

    difficulty ENUM('Beginner', 'Intermediate', 'Advanced')
        DEFAULT 'Beginner',

    status ENUM('draft', 'pending', 'published', 'archived')
        DEFAULT 'draft',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME NULL,

    CONSTRAINT fk_course_category
        FOREIGN KEY (category_id)
        REFERENCES categories(category_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_course_instructor
        FOREIGN KEY (instructor_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


-- =========================================================
-- 5. LESSONS
-- =========================================================

CREATE TABLE lessons (
    lesson_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,

    title VARCHAR(200) NOT NULL,
    description TEXT,
    content LONGTEXT,
    video_url VARCHAR(500),

    lesson_order INT NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_lesson_course
        FOREIGN KEY (course_id)
        REFERENCES courses(course_id)
        ON DELETE CASCADE,

    UNIQUE(course_id, lesson_order)
);


-- =========================================================
-- 6. ENROLLMENTS
-- =========================================================

CREATE TABLE enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,
    course_id INT NOT NULL,

    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completion_date DATETIME NULL,

    status ENUM('active', 'completed', 'dropped')
        DEFAULT 'active',

    CONSTRAINT fk_enrollment_student
        FOREIGN KEY (student_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_enrollment_course
        FOREIGN KEY (course_id)
        REFERENCES courses(course_id)
        ON DELETE CASCADE,

    UNIQUE(student_id, course_id)
);


-- =========================================================
-- 7. LESSON PROGRESS
-- =========================================================

CREATE TABLE lesson_progress (
    progress_id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,
    lesson_id INT NOT NULL,

    completed BOOLEAN DEFAULT FALSE,

    completed_at DATETIME NULL,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_progress_student
        FOREIGN KEY (student_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_progress_lesson
        FOREIGN KEY (lesson_id)
        REFERENCES lessons(lesson_id)
        ON DELETE CASCADE,

    UNIQUE(student_id, lesson_id)
);


-- =========================================================
-- 8. BOOKMARKS
-- =========================================================

CREATE TABLE bookmarks (
    bookmark_id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,
    lesson_id INT NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bookmark_student
        FOREIGN KEY (student_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_bookmark_lesson
        FOREIGN KEY (lesson_id)
        REFERENCES lessons(lesson_id)
        ON DELETE CASCADE,

    UNIQUE(student_id, lesson_id)
);


-- =========================================================
-- 9. ASSIGNMENTS
-- =========================================================

CREATE TABLE assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,

    course_id INT NOT NULL,
    lesson_id INT NULL,

    title VARCHAR(200) NOT NULL,
    description TEXT,

    deadline DATETIME,
    max_marks INT NOT NULL DEFAULT 100,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_assignment_course
        FOREIGN KEY (course_id)
        REFERENCES courses(course_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_assignment_lesson
        FOREIGN KEY (lesson_id)
        REFERENCES lessons(lesson_id)
        ON DELETE SET NULL
);


-- =========================================================
-- 10. SUBMISSIONS
-- =========================================================

CREATE TABLE submissions (
    submission_id INT AUTO_INCREMENT PRIMARY KEY,

    assignment_id INT NOT NULL,
    student_id INT NOT NULL,

    submission_text TEXT,
    file_url VARCHAR(500),

    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    marks DECIMAL(5,2) NULL,
    feedback TEXT,

    graded_by INT NULL,
    graded_at DATETIME NULL,

    status ENUM('submitted', 'graded', 'late')
        DEFAULT 'submitted',

    CONSTRAINT fk_submission_assignment
        FOREIGN KEY (assignment_id)
        REFERENCES assignments(assignment_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_submission_student
        FOREIGN KEY (student_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_submission_grader
        FOREIGN KEY (graded_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);


-- =========================================================
-- 11. QUIZZES
-- =========================================================

CREATE TABLE quizzes (
    quiz_id INT AUTO_INCREMENT PRIMARY KEY,

    course_id INT NOT NULL,
    lesson_id INT NULL,

    title VARCHAR(200) NOT NULL,
    description TEXT,

    total_marks INT NOT NULL DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_quiz_course
        FOREIGN KEY (course_id)
        REFERENCES courses(course_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_quiz_lesson
        FOREIGN KEY (lesson_id)
        REFERENCES lessons(lesson_id)
        ON DELETE SET NULL
);


-- =========================================================
-- 12. QUIZ QUESTIONS
-- =========================================================

CREATE TABLE quiz_questions (
    question_id INT AUTO_INCREMENT PRIMARY KEY,

    quiz_id INT NOT NULL,

    question_text TEXT NOT NULL,

    option_a VARCHAR(500),
    option_b VARCHAR(500),
    option_c VARCHAR(500),
    option_d VARCHAR(500),

    correct_answer ENUM('A', 'B', 'C', 'D') NOT NULL,

    marks INT NOT NULL DEFAULT 1,

    CONSTRAINT fk_question_quiz
        FOREIGN KEY (quiz_id)
        REFERENCES quizzes(quiz_id)
        ON DELETE CASCADE
);


-- =========================================================
-- 13. QUIZ ATTEMPTS
-- =========================================================

CREATE TABLE quiz_attempts (
    attempt_id INT AUTO_INCREMENT PRIMARY KEY,

    quiz_id INT NOT NULL,
    student_id INT NOT NULL,

    score DECIMAL(5,2) DEFAULT 0,

    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,

    CONSTRAINT fk_attempt_quiz
        FOREIGN KEY (quiz_id)
        REFERENCES quizzes(quiz_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_attempt_student
        FOREIGN KEY (student_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


-- =========================================================
-- 14. QUIZ ANSWERS
-- =========================================================

CREATE TABLE quiz_answers (
    answer_id INT AUTO_INCREMENT PRIMARY KEY,

    attempt_id INT NOT NULL,
    question_id INT NOT NULL,

    selected_answer ENUM('A', 'B', 'C', 'D') NULL,
    is_correct BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_answer_attempt
        FOREIGN KEY (attempt_id)
        REFERENCES quiz_attempts(attempt_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_answer_question
        FOREIGN KEY (question_id)
        REFERENCES quiz_questions(question_id)
        ON DELETE CASCADE,

    UNIQUE(attempt_id, question_id)
);


-- =========================================================
-- 15. DISCUSSIONS
-- =========================================================

CREATE TABLE discussions (
    discussion_id INT AUTO_INCREMENT PRIMARY KEY,

    course_id INT NOT NULL,
    user_id INT NOT NULL,

    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_discussion_course
        FOREIGN KEY (course_id)
        REFERENCES courses(course_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_discussion_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


-- =========================================================
-- 16. DISCUSSION REPLIES
-- =========================================================

CREATE TABLE discussion_replies (
    reply_id INT AUTO_INCREMENT PRIMARY KEY,

    discussion_id INT NOT NULL,
    user_id INT NOT NULL,

    content TEXT NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reply_discussion
        FOREIGN KEY (discussion_id)
        REFERENCES discussions(discussion_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reply_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


-- =========================================================
-- 17. CERTIFICATES
-- =========================================================

CREATE TABLE certificates (
    certificate_id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,
    course_id INT NOT NULL,

    certificate_code VARCHAR(100) NOT NULL UNIQUE,

    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    certificate_url VARCHAR(500),

    CONSTRAINT fk_certificate_student
        FOREIGN KEY (student_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_certificate_course
        FOREIGN KEY (course_id)
        REFERENCES courses(course_id)
        ON DELETE CASCADE,

    UNIQUE(student_id, course_id)
);


-- =========================================================
-- 18. BADGES
-- =========================================================

CREATE TABLE badges (
    badge_id INT AUTO_INCREMENT PRIMARY KEY,

    badge_name VARCHAR(100) NOT NULL UNIQUE,

    description TEXT,

    percentage_required INT NOT NULL,

    badge_image VARCHAR(255)
);


-- =========================================================
-- 19. STUDENT BADGES
-- =========================================================

CREATE TABLE student_badges (
    student_badge_id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,
    badge_id INT NOT NULL,
    course_id INT NOT NULL,

    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_student_badge_student
        FOREIGN KEY (student_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_student_badge_badge
        FOREIGN KEY (badge_id)
        REFERENCES badges(badge_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_student_badge_course
        FOREIGN KEY (course_id)
        REFERENCES courses(course_id)
        ON DELETE CASCADE,

    UNIQUE(student_id, badge_id, course_id)
);


-- =========================================================
-- INITIAL CATEGORIES
-- =========================================================

INSERT INTO categories
(category_name, description)
VALUES
('Programming', 'Programming languages and programming fundamentals'),
('Web Development', 'HTML, CSS, JavaScript and web technologies'),
('Database', 'Database management and SQL'),
('Cybersecurity', 'Cybersecurity and information security'),
('Data Science', 'Data analysis, machine learning and statistics'),
('Networking', 'Computer networking and network technologies');


-- =========================================================
-- INITIAL BADGES
-- =========================================================

INSERT INTO badges
(badge_name, description, percentage_required)
VALUES
('Bronze', 'Complete 25% of a course', 25),
('Silver', 'Complete 50% of a course', 50),
('Gold', 'Complete 90% of a course', 90),
('Master', 'Complete 100% of a course', 100);

-- 20. LESSON ATTACHMENTS  (pdf / doc / slides / video / audio / ... per lesson)
CREATE TABLE IF NOT EXISTS lesson_attachments (
    attachment_id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_id INT NOT NULL,
    uploaded_by INT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type ENUM('video','audio','pdf','document','slide','spreadsheet','image','archive','other')
        NOT NULL DEFAULT 'other',
    mime_type VARCHAR(150),
    file_size BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_attachment_lesson FOREIGN KEY (lesson_id)
        REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    CONSTRAINT fk_attachment_user FOREIGN KEY (uploaded_by)
        REFERENCES users(user_id) ON DELETE SET NULL
);

-- 21. COURSE REVIEWS  (1 rating per student per course)
CREATE TABLE IF NOT EXISTS course_reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    student_id INT NOT NULL,
    rating TINYINT NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT fk_review_course FOREIGN KEY (course_id)
        REFERENCES courses(course_id) ON DELETE CASCADE,
    CONSTRAINT fk_review_student FOREIGN KEY (student_id)
        REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(course_id, student_id)
);

-- 22. SUBMISSION HISTORY  (old versions are archived here when a student re-submits)
CREATE TABLE IF NOT EXISTS submission_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    submission_text TEXT,
    file_url VARCHAR(500),
    status ENUM('submitted','graded','late') DEFAULT 'submitted',
    marks DECIMAL(5,2) NULL,
    feedback TEXT,
    submitted_at DATETIME NULL,
    archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_history_submission FOREIGN KEY (submission_id)
        REFERENCES submissions(submission_id) ON DELETE CASCADE,
    INDEX idx_history_assignment_student (assignment_id, student_id)
);

-- =========================================================
-- END OF DATABASE
-- =========================================================