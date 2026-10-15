import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
} from 'react-router-dom';

// Public Core
import LandingPage from './pages/LandingPage';
import SupportPage from './pages/SupportPage';
import TermsPage from './pages/TermsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Complete Student Suite
import StudentDashboard from './pages/StudentDashboard';
import StudentCoursesPage from './pages/StudentCoursesPage';
import StudentCourseDetailPage from './pages/StudentCourseDetailPage';
import StudentCoursePlayerPage from './pages/StudentCoursePlayerPage';
import StudentCatalogPage from './pages/StudentCatalogPage';
import StudentAssignmentsPage from './pages/StudentAssignmentsPage';
import StudentAssignmentDetailPage from './pages/StudentAssignmentDetailPage';
import StudentBadgesPage from './pages/StudentBadgesPage';
import StudentBookmarksPage from './pages/StudentBookmarksPage';
import StudentSettingsPage from './pages/StudentSettingsPage';
import StudentNotificationsPage from './pages/StudentNotificationsPage';
import StudentQuizzesPage from './pages/StudentQuizzesPage';
import StudentQuizPage from './pages/StudentQuizPage';

// Instructor Suite
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorCoursesPage from './pages/InstructorCoursesPage';
import InstructorCourseDetailPage from './pages/InstructorCourseDetailPage';
import InstructorCreateCoursePage from './pages/InstructorCreateCoursePage';
import InstructorLessonEditorPage from './pages/InstructorLessonEditorPage';
import InstructorCreateAssignmentPage from './pages/InstructorCreateAssignmentPage';
import InstructorAssignmentsHub from './pages/InstructorAssignmentsHub';
import InstructorAssignmentDedicatedPage from './pages/InstructorAssignmentDedicatedPage';
import InstructorAnalyticsPage from './pages/InstructorAnalyticsPage';
import InstructorCourseStatsPage from './pages/InstructorCourseStatsPage';
import InstructorSubmissionsHubPage from './pages/InstructorSubmissionsHubPage';
import InstructorSettingsPage from './pages/InstructorSettingsPage';
import InstructorNotificationsPage from './pages/InstructorNotificationsPage';
import InstructorCreateQuizPage from './pages/InstructorCreateQuizPage';
import InstructorQuizManagementPage from './pages/InstructorQuizManagementPage';

// NEW: Assignment Submission Tracker
import InstructorAssignmentStatusPage from './pages/InstructorAssignmentStatusPage';

// Admin Suite
import AdminDashboard from './pages/AdminDashboard';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminCoursesPage from './pages/AdminCoursesPage';
import AdminInstructorsPage from './pages/AdminInstructorsPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminNotificationsPage from './pages/AdminNotificationsPage';

export default function App() {
  return (
    <BrowserRouter>

      

      <Routes>

        {/* =====================================================
            CORE & AUTH
        ===================================================== */}

        <Route
          path="/"
          element={<LandingPage />}
        />

        <Route
          path="/support"
          element={<SupportPage />}
        />

        <Route
          path="/terms"
          element={<TermsPage />}
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />


        {/* =====================================================
            COMPLETE STUDENT SUITE
        ===================================================== */}

        <Route
          path="/dashboard/student"
          element={<StudentDashboard />}
        />

        <Route
          path="/student/courses"
          element={<StudentCoursesPage />}
        />

        <Route
          path="/student/course/:courseId"
          element={<StudentCourseDetailPage />}
        />

        <Route
          path="/student/learn/:courseId"
          element={<StudentCoursePlayerPage />}
        />

        <Route
          path="/student/catalog"
          element={<StudentCatalogPage />}
        />

        <Route
          path="/student/assignments"
          element={<StudentAssignmentsPage />}
        />

        <Route
          path="/student/assignments/:courseId/:asgnId"
          element={<StudentAssignmentDetailPage />}
        />
        <Route
  path="/student/quizzes"
  element={<StudentQuizzesPage />}
/>

<Route
  path="/student/quiz/:quizId"
  element={<StudentQuizPage />}
/>

        <Route
          path="/student/badges"
          element={<StudentBadgesPage />}
        />

        <Route
          path="/student/bookmarks"
          element={<StudentBookmarksPage />}
        />

        <Route
          path="/student/settings"
          element={<StudentSettingsPage />}
        />

        <Route
          path="/student/notifications"
          element={<StudentNotificationsPage />}
        />


        {/* =====================================================
            INSTRUCTOR SUITE
        ===================================================== */}

        <Route
          path="/dashboard/instructor"
          element={<InstructorDashboard />}
        />

        <Route
          path="/instructor/courses"
          element={<InstructorCoursesPage />}
        />

        <Route
          path="/instructor/quizzes"
          element={<InstructorQuizManagementPage />}
        />

        <Route
          path="/instructor/quizzes/:quizId"
          element={<InstructorQuizManagementPage />}
        />

        <Route
          path="/instructor/courses/:courseId"
          element={<InstructorCourseDetailPage />}
        />

        {/* COURSE STATS */}

        <Route
          path="/instructor/courses/:courseId/stats"
          element={<InstructorCourseStatsPage />}
        />

        {/* ALL SUBMISSIONS */}

        <Route
          path="/instructor/courses/:courseId/submissions"
          element={<InstructorSubmissionsHubPage />}
        />

        {/* =====================================================
            NEW: ASSIGNMENT SUBMISSION TRACKER
        ===================================================== */}

        <Route
          path="/instructor/courses/:courseId/assignment-status"
          element={<InstructorAssignmentStatusPage />}
        />

        {/* =====================================================
            CREATE COURSE
        ===================================================== */}

        <Route
          path="/instructor/create-course"
          element={<InstructorCreateCoursePage />}
        />

        {/* =====================================================
            LESSON EDITOR
        ===================================================== */}

        <Route
          path="/instructor/lesson-editor"
          element={<InstructorLessonEditorPage />}
        />

        {/* =====================================================
            CREATE ASSIGNMENT
        ===================================================== */}

        <Route
          path="/instructor/create-assignment"
          element={<InstructorCreateAssignmentPage />}
        />

        <Route
          path="/instructor/create-quiz"
          element={<InstructorCreateQuizPage />}
        />

        <Route
          path="/instructor/quizzes/create"
          element={<InstructorCreateQuizPage />}
        />

        {/* =====================================================
            ASSIGNMENTS HUB
        ===================================================== */}

        <Route
          path="/instructor/assignments"
          element={<InstructorAssignmentsHub />}
        />

        {/* =====================================================
            ASSIGNMENT DEDICATED PAGE
        ===================================================== */}

        <Route
          path="/instructor/assignments/:courseId/:asgnId"
          element={<InstructorAssignmentDedicatedPage />}
        />

        {/* =====================================================
            ANALYTICS
        ===================================================== */}

        <Route
          path="/instructor/analytics"
          element={<InstructorAnalyticsPage />}
        />

        {/* =====================================================
            INSTRUCTOR SETTINGS
        ===================================================== */}

        <Route
          path="/instructor/settings"
          element={<InstructorSettingsPage />}
        />

        {/* =====================================================
            INSTRUCTOR NOTIFICATIONS
        ===================================================== */}

        <Route
          path="/instructor/notifications"
          element={<InstructorNotificationsPage />}
        />


        {/* =====================================================
            ADMIN SUITE
        ===================================================== */}

        <Route
          path="/dashboard/admin"
          element={<AdminDashboard />}
        />

        <Route
          path="/admin/users"
          element={<AdminUsersPage />}
        />

        <Route
          path="/admin/courses"
          element={<AdminCoursesPage />}
        />

        <Route
          path="/admin/instructors"
          element={<AdminInstructorsPage />}
        />

        <Route
          path="/admin/reports"
          element={<AdminReportsPage />}
        />

        <Route
          path="/admin/settings"
          element={<AdminSettingsPage />}
        />

        <Route
          path="/admin/notifications"
          element={<AdminNotificationsPage />}
        />

      </Routes>

    </BrowserRouter>
  );
}