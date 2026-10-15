import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import StudentSidebar from '../components/StudentSidebar';
import {
  Bell,
  CheckCircle2,
  Clock,
  FileText,
  Award,
  ArrowRight,
  Trash2,
  RefreshCw,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { api } from '../api/client';

// ============================================================
// HELPERS
// ============================================================

const toDate = (value) => {
  if (!value) return null;

  const date = new Date(
    String(value).replace(' ', 'T')
  );

  return Number.isNaN(date.getTime())
    ? null
    : date;
};

const timeAgo = (value) => {
  const date = toDate(value);

  if (!date) return 'Recently';

  const diff = Date.now() - date.getTime();

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return 'Just now';
  }

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatDate = (value) => {
  const date = toDate(value);

  if (!date) return 'No deadline';

  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const daysUntil = (value) => {
  const date = toDate(value);

  if (!date) return Infinity;

  return Math.ceil(
    (date.getTime() - Date.now()) / 86400000
  );
};

const isUpcoming = (value) => {
  const days = daysUntil(value);

  return days >= 0 && days <= 7;
};

const isGraded = (assignment) => {
  const submission = assignment?.my_submission;

  if (!submission) return false;

  return (
    submission.graded_at ||
    submission.marks !== null &&
    submission.marks !== undefined
  );
};

// ============================================================
// LOCAL STORAGE
// Used only for notification UI state.
// Actual notification data comes from backend.
// ============================================================

const READ_KEY = 'edupulse_student_notification_read';
const DISMISSED_KEY = 'edupulse_student_notification_dismissed';

const readStorage = (key) => {
  try {
    const value = JSON.parse(
      localStorage.getItem(key) || '[]'
    );

    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const writeStorage = (key, value) => {
  localStorage.setItem(
    key,
    JSON.stringify(value)
  );
};

// ============================================================
// COMPONENT
// ============================================================

export default function StudentNotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');

  const [assignments, setAssignments] = useState([]);
  const [badges, setBadges] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  const [readIds, setReadIds] = useState(() =>
    readStorage(READ_KEY)
  );

  const [dismissedIds, setDismissedIds] = useState(() =>
    readStorage(DISMISSED_KEY)
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  const loadNotificationsData = async (
    showRefresh = false
  ) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const [
        assignmentResponse,
        badgeResponse,
        enrollmentResponse,
      ] = await Promise.all([
        api.get('/assignments'),
        api.get('/badges/me'),
        api.get('/enrollments/me'),
      ]);

      setAssignments(
        Array.isArray(assignmentResponse?.assignments)
          ? assignmentResponse.assignments
          : []
      );

      setBadges(
        Array.isArray(badgeResponse?.badges)
          ? badgeResponse.badges
          : []
      );

      setEnrollments(
        Array.isArray(enrollmentResponse?.enrollments)
          ? enrollmentResponse.enrollments
          : []
      );
    } catch (error) {
      console.error(
        'Failed to load student notifications:',
        error
      );

      setError(
        error?.message ||
        'Could not load notifications.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotificationsData();
  }, []);

  // ==========================================================
  // BUILD DYNAMIC NOTIFICATIONS
  // ==========================================================

  const generatedNotifications = useMemo(() => {
    const result = [];

    // --------------------------------------------------------
    // 1. GRADED ASSIGNMENTS
    // --------------------------------------------------------

    assignments.forEach((assignment) => {
      const submission = assignment?.my_submission;

      if (!isGraded(assignment)) {
        return;
      }

      const marks =
        submission?.marks !== null &&
        submission?.marks !== undefined
          ? Number(submission.marks)
          : null;

      const maxMarks =
        Number(assignment.max_marks || 0);

      const gradeText =
        marks !== null && maxMarks
          ? `${marks}/${maxMarks}`
          : 'Graded';

      const gradedAt =
        submission?.graded_at ||
        submission?.submitted_at ||
        assignment?.updated_at ||
        assignment?.created_at;

      result.push({
        id: `grade-${assignment.assignment_id}-${submission.submission_id || 'submission'}`,

        type: 'grade',

        title: `${assignment.title} Graded`,

        course:
          assignment.course_title ||
          'Course',

        details:
          marks !== null
            ? `Your submission was graded: ${gradeText}.${
                submission?.feedback
                  ? ` Faculty feedback: "${submission.feedback}"`
                  : ''
              }`
            : 'Your instructor has graded this submission.',

        time: timeAgo(gradedAt),

        timestamp:
          toDate(gradedAt)?.getTime() ||
          0,

        read: readIds.includes(
          `grade-${assignment.assignment_id}-${submission.submission_id || 'submission'}`
        ),

        link: `/student/assignments/${assignment.course_id}/${assignment.assignment_id}`,
      });
    });

    // --------------------------------------------------------
    // 2. UPCOMING ASSIGNMENT DEADLINES
    // --------------------------------------------------------

    assignments.forEach((assignment) => {
      if (!assignment?.deadline) {
        return;
      }

      const days = daysUntil(
        assignment.deadline
      );

      // Only show assignments due within 7 days.
      if (days < 0 || days > 7) {
        return;
      }

      // Already submitted? No need to keep warning student.
      if (assignment?.my_submission) {
        return;
      }

      let deadlineText = '';

      if (days === 0) {
        deadlineText = 'is due today';
      } else if (days === 1) {
        deadlineText = 'is due tomorrow';
      } else {
        deadlineText = `is due in ${days} days`;
      }

      result.push({
        id: `deadline-${assignment.assignment_id}`,

        type: 'deadline',

        title: `Assignment Due Soon`,

        course:
          assignment.course_title ||
          'Course',

        details:
          `${assignment.title} ${deadlineText}. Deadline: ${formatDate(
            assignment.deadline
          )}.`,

        time:
          days === 0
            ? 'Due today'
            : days === 1
              ? 'Due tomorrow'
              : `Due in ${days} days`,

        timestamp:
          toDate(assignment.deadline)?.getTime() ||
          0,

        read: readIds.includes(
          `deadline-${assignment.assignment_id}`
        ),

        link: `/student/assignments/${assignment.course_id}/${assignment.assignment_id}`,
      });
    });

    // --------------------------------------------------------
    // 3. EARNED BADGES
    // --------------------------------------------------------

    badges.forEach((badge) => {
      const earnedAt =
        badge.earned_at ||
        badge.created_at;

      const id =
        `badge-${badge.student_badge_id || `${badge.badge_id}-${badge.course_id}`}`;

      result.push({
        id,

        type: 'badge',

        title:
          `New Achievement Unlocked!`,

        course:
          badge.course_title ||
          'EduPulse Achievements',

        details:
          `You earned the "${badge.badge_name}" badge${
            badge.course_title
              ? ` for ${badge.course_title}`
              : ''
          }. ${
            badge.description || ''
          }`,

        time: timeAgo(earnedAt),

        timestamp:
          toDate(earnedAt)?.getTime() ||
          0,

        read: readIds.includes(id),

        link: '/student/badges',
      });
    });

    // --------------------------------------------------------
    // 4. COURSE ENROLLMENT / COURSE UPDATE
    // --------------------------------------------------------

    enrollments.forEach((enrollment) => {
      const enrolledAt =
        enrollment.enrolled_at ||
        enrollment.created_at;

      const id =
        `enrollment-${enrollment.enrollment_id}`;

      result.push({
        id,

        type: 'announcement',

        title:
          'Course Enrollment Confirmed',

        course:
          enrollment.title ||
          'EduPulse Course',

        details:
          `You are enrolled in "${enrollment.title || 'this course'}". Start learning and track your progress from your course dashboard.`,

        time: timeAgo(enrolledAt),

        timestamp:
          toDate(enrolledAt)?.getTime() ||
          0,

        read: readIds.includes(id),

        link:
          `/student/course/${enrollment.course_id}`,
      });
    });

    // --------------------------------------------------------
    // SORT
    // Newest/relevant notifications first.
    // Deadline notifications are kept near the top when close.
    // --------------------------------------------------------

    result.sort(
      (a, b) => b.timestamp - a.timestamp
    );

    return result;
  }, [
    assignments,
    badges,
    enrollments,
    readIds,
  ]);

  // ==========================================================
  // REMOVE DISMISSED
  // ==========================================================

  const notifications = useMemo(() => {
    return generatedNotifications.filter(
      (notification) =>
        !dismissedIds.includes(
          notification.id
        )
    );
  }, [
    generatedNotifications,
    dismissedIds,
  ]);

  // ==========================================================
  // FILTER
  // ==========================================================

  const filtered = useMemo(() => {
    return notifications.filter(
      (notification) => {
        if (activeTab === 'grades') {
          return notification.type === 'grade';
        }

        if (activeTab === 'deadlines') {
          return notification.type === 'deadline';
        }

        if (activeTab === 'announcements') {
          return (
            notification.type === 'announcement' ||
            notification.type === 'badge'
          );
        }

        return true;
      }
    );
  }, [
    notifications,
    activeTab,
  ]);

  // ==========================================================
  // COUNTS
  // ==========================================================

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.read
    ).length;

  const gradeCount =
    notifications.filter(
      (notification) =>
        notification.type === 'grade'
    ).length;

  const deadlineCount =
    notifications.filter(
      (notification) =>
        notification.type === 'deadline'
    ).length;

  const announcementCount =
    notifications.filter(
      (notification) =>
        notification.type === 'announcement' ||
        notification.type === 'badge'
    ).length;

  // ==========================================================
  // MARK ONE AS READ
  // ==========================================================

  const handleMarkRead = (id) => {
    if (readIds.includes(id)) {
      return;
    }

    const updated = [
      ...readIds,
      id,
    ];

    setReadIds(updated);
    writeStorage(
      READ_KEY,
      updated
    );
  };

  // ==========================================================
  // MARK ALL AS READ
  // ==========================================================

  const handleMarkAllRead = () => {
    const allIds =
      notifications.map(
        (notification) =>
          notification.id
      );

    const merged = Array.from(
      new Set([
        ...readIds,
        ...allIds,
      ])
    );

    setReadIds(merged);

    writeStorage(
      READ_KEY,
      merged
    );
  };

  // ==========================================================
  // DISMISS
  // ==========================================================

  const handleDismiss = (id) => {
    const updated = [
      ...dismissedIds,
      id,
    ];

    setDismissedIds(updated);

    writeStorage(
      DISMISSED_KEY,
      updated
    );
  };

  // ==========================================================
  // RESTORE DISMISSED
  // ==========================================================

  const handleRestoreDismissed = () => {
    setDismissedIds([]);

    writeStorage(
      DISMISSED_KEY,
      []
    );
  };

  // ==========================================================
  // ICON
  // ==========================================================

  const getIcon = (type) => {
    if (type === 'grade') {
      return (
        <CheckCircle2 className="w-5 h-5" />
      );
    }

    if (type === 'deadline') {
      return (
        <Clock className="w-5 h-5" />
      );
    }

    if (type === 'badge') {
      return (
        <Award className="w-5 h-5" />
      );
    }

    if (type === 'announcement') {
      return (
        <BookOpen className="w-5 h-5" />
      );
    }

    return (
      <Bell className="w-5 h-5" />
    );
  };

  // ==========================================================
  // ICON STYLE
  // ==========================================================

  const getIconStyle = (type) => {
    if (type === 'grade') {
      return 'bg-emerald-50 text-emerald-600';
    }

    if (type === 'deadline') {
      return 'bg-rose-50 text-rose-600';
    }

    if (type === 'badge') {
      return 'bg-amber-50 text-amber-600';
    }

    return 'bg-blue-50 text-blue-600';
  };

  // ==========================================================
  // TAB STYLE
  // ==========================================================

  const tabClass = (tab) =>
    `pb-3 border-b-2 transition ${
      activeTab === tab
        ? 'border-brand-600 text-brand-600 font-bold'
        : 'border-transparent text-slate-400 hover:text-slate-600'
    }`;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <StudentSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-8">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

          <div>
            <div className="flex items-center gap-2.5">

              <h1 className="text-2xl font-extrabold text-slate-900">
                Student Notifications
              </h1>

              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-600 border border-brand-200">
                  {unreadCount} Unread
                </span>
              )}

            </div>

            <p className="text-xs text-slate-500 mt-1">
              Stay updated with graded assignments,
              course activity, achievements, and deadlines.
            </p>
          </div>

          <div className="flex items-center gap-2">

            <button
              onClick={() =>
                loadNotificationsData(true)
              }
              disabled={refreshing}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs flex items-center gap-2 disabled:opacity-60"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  refreshing
                    ? 'animate-spin'
                    : ''
                }`}
              />

              Refresh
            </button>

            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
            >
              Mark all as read
            </button>

          </div>
        </div>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700">

            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />

            <div className="flex-1">
              <p className="text-xs font-bold">
                Could not load notifications
              </p>

              <p className="text-xs mt-1">
                {error}
              </p>
            </div>

            <button
              onClick={() =>
                loadNotificationsData(true)
              }
              className="text-xs font-bold underline"
            >
              Retry
            </button>

          </div>
        )}

        {/* ====================================================
            CATEGORY TABS
        ==================================================== */}

        <div className="flex border-b border-slate-200 text-xs font-semibold gap-6 overflow-x-auto">

          <button
            onClick={() =>
              setActiveTab('all')
            }
            className={tabClass('all')}
          >
            All Updates ({notifications.length})
          </button>

          <button
            onClick={() =>
              setActiveTab('grades')
            }
            className={tabClass('grades')}
          >
            Grades & Feedback ({gradeCount})
          </button>

          <button
            onClick={() =>
              setActiveTab('deadlines')
            }
            className={tabClass('deadlines')}
          >
            Due Dates & Quizzes ({deadlineCount})
          </button>

          <button
            onClick={() =>
              setActiveTab('announcements')
            }
            className={tabClass('announcements')}
          >
            Announcements & Badges ({announcementCount})
          </button>

        </div>

        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading && (
          <div className="space-y-3">

            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="p-5 rounded-3xl border border-slate-100 bg-white animate-pulse"
              >
                <div className="flex gap-4">

                  <div className="w-11 h-11 rounded-2xl bg-slate-100" />

                  <div className="flex-1 space-y-3">

                    <div className="w-40 h-3 bg-slate-100 rounded" />

                    <div className="w-64 h-4 bg-slate-100 rounded" />

                    <div className="w-full max-w-xl h-3 bg-slate-100 rounded" />

                  </div>

                </div>
              </div>
            ))}

          </div>
        )}

        {/* ====================================================
            NOTIFICATION LIST
        ==================================================== */}

        {!loading && (
          <div className="space-y-3">

            {filtered.map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                  !item.read
                    ? 'bg-white border-brand-200 shadow-xs ring-1 ring-brand-100'
                    : 'bg-white/80 border-slate-100 opacity-80'
                }`}
              >

                {/* LEFT */}
                <div className="flex items-start gap-4">

                  {/* ICON */}
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${getIconStyle(
                      item.type
                    )}`}
                  >
                    {getIcon(item.type)}
                  </div>

                  {/* CONTENT */}
                  <div className="space-y-1">

                    <div className="flex flex-wrap items-center gap-2">

                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {item.course}
                      </span>

                      <span className="text-[11px] text-slate-400">
                        • {item.time}
                      </span>

                      {!item.read && (
                        <span className="px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-600 text-[9px] font-extrabold uppercase">
                          New
                        </span>
                      )}

                    </div>

                    <h3 className="text-sm font-bold text-slate-900">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                      {item.details}
                    </p>

                    {item.type === 'deadline' && (
                      <p className="text-[11px] text-rose-500 font-semibold pt-1">
                        Deadline: {formatDate(
                          assignments.find(
                            (a) =>
                              `deadline-${a.assignment_id}` ===
                              item.id
                          )?.deadline
                        )}
                      </p>
                    )}

                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-2 self-end md:self-center">

                  <Link
                    to={item.link}
                    onClick={() =>
                      handleMarkRead(item.id)
                    }
                    className="px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    View Details

                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {!item.read && (
                    <button
                      onClick={() =>
                        handleMarkRead(item.id)
                      }
                      className="p-2 text-slate-400 hover:text-emerald-600 transition rounded-xl hover:bg-emerald-50"
                      title="Mark as read"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() =>
                      handleDismiss(item.id)
                    }
                    className="p-2 text-slate-400 hover:text-rose-600 transition rounded-xl hover:bg-rose-50"
                    title="Dismiss notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>

              </div>
            ))}

            {/* =================================================
                EMPTY
            ================================================= */}

            {filtered.length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 p-8 space-y-3">

                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />

                <h3 className="text-sm font-bold text-slate-800">
                  You're all caught up!
                </h3>

                <p className="text-xs text-slate-400">
                  No active notifications in this category.
                </p>

                {dismissedIds.length > 0 && (
                  <button
                    onClick={
                      handleRestoreDismissed
                    }
                    className="mt-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                  >
                    Restore dismissed notifications
                  </button>
                )}

              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}