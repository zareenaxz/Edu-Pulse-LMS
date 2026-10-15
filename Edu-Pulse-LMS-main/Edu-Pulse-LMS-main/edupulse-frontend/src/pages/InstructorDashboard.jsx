import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '../components/InstructorSidebar';
import InstructorLiveInsights from '../components/InstructorLiveInsights';
import {
  Plus, AlertCircle, ChevronRight, Users,
  BookOpen, Clock, TrendingUp,
  Bell, ArrowUpRight, FileText, CheckCircle2, UserX
} from 'lucide-react';
import { api, getUser } from '../api/client';

export default function InstructorDashboard() {
  const [activeRange, setActiveRange] = useState('Weekly');
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const notificationMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setShowNotificationMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError('');
        const data = await api.get('/analytics/instructor');

        if (mounted) {
          setDashboard(data || {});
        }
      } catch (err) {
        console.error('Instructor dashboard load failed:', err);
        if (mounted) {
          setError(err?.message || 'Could not load instructor dashboard data.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const user = getUser() || {};
  const instructorName = user.name || user.full_name || 'Instructor';

  const courses = dashboard?.courses || [];
  const weeklyActivity = dashboard?.weeklyActivity || [];
  const recentSubmissions = dashboard?.recentSubmissions || [];
  const atRiskStudents = dashboard?.atRiskStudents || [];
  const topStudents = dashboard?.topStudents || [];

  const publishedCourses = courses.filter((course) => course.status === 'published');
  const draftingCourses = courses.filter((course) => course.status !== 'published');

  const averageGrade = useMemo(() => {
    const graded = courses.filter((course) => course.avg_grade_percent !== null && course.avg_grade_percent !== undefined);
    if (!graded.length) return null;

    const totalStudents = graded.reduce((sum, course) => sum + Number(course.students || 0), 0);

    if (totalStudents > 0) {
      const weighted = graded.reduce(
        (sum, course) => sum + Number(course.avg_grade_percent || 0) * Number(course.students || 0),
        0
      );
      return Math.round((weighted / totalStudents) * 10) / 10;
    }

    return Math.round(
      (graded.reduce((sum, course) => sum + Number(course.avg_grade_percent || 0), 0) / graded.length) * 10
    ) / 10;
  }, [courses]);

  const totalStudents = Number(dashboard?.totalStudents || 0);
  const totalCourses = Number(dashboard?.totalCourses || courses.length || 0);
  const pendingGrading = Number(dashboard?.pendingGrading || 0);
  const avgRating = Number(dashboard?.avgRating || 0);

  const notifications = recentSubmissions.slice(0, 4).map((item) => ({
    id: `${item.item_type}-${item.id}`,
    studentName: item.student_name || 'Student',
    courseTitle: item.course_title || 'Course',
    title: item.title || 'Submission',
    time: item.submitted_at
      ? new Date(item.submitted_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
      : 'Recently',
    pending: item.item_type === 'assignment' && (item.score === null || item.score === undefined),
  }));

  const unreadCount = pendingGrading;

  const chartMax = Math.max(
    1,
    ...weeklyActivity.map((d) => Math.max(Number(d.lesson_completions || 0), Number(d.submissions || 0)))
  );

  const getInitials = (name) =>
    String(name || 'Student')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();

  const formatDateTime = (value) => {
    if (!value) return '—';
    const dt = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(dt.getTime())) return String(value);
    return dt.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stats = [
    {
      label: 'Active Enrolled Students',
      val: loading ? '—' : totalStudents.toLocaleString(),
      change: 'Across your courses',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'Courses Currently Live',
      val: loading ? '—' : publishedCourses.length.toString(),
      change: `${draftingCourses.length} pending/draft`,
      icon: BookOpen,
      color: 'text-brand-600',
      bg: 'bg-brand-50'
    },
    {
      label: 'Pending Submissions',
      val: loading ? '—' : pendingGrading.toLocaleString(),
      change: pendingGrading ? 'Needs grading' : 'Nothing waiting',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
    {
      label: 'Overall Average Grade',
      val: loading ? '—' : averageGrade === null ? '—' : `${averageGrade}%`,
      change: avgRating ? `${avgRating.toFixed(1)}★ course rating` : 'No ratings yet',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <DashboardSidebar role="instructor" title="EduPulse" />

      <main className="flex-1 p-8 overflow-y-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[11px] font-bold text-brand-600 uppercase tracking-widest bg-brand-50 px-2.5 py-1 rounded-full">
              Instructor Portal • 2026
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1.5">
              Welcome back, {instructorName}
            </h1>
            <p className="text-xs text-slate-500">
              Here is your current breakdown across courses, grading, and student activity.
            </p>
          </div>

          <div className="flex items-center gap-3 relative" ref={notificationMenuRef}>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotificationMenu((value) => !value)}
                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition relative shadow-xs"
                title={`${pendingGrading} pending submissions`}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white absolute top-2 right-2" />
                )}
              </button>

              {showNotificationMenu && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-3xl p-4 shadow-2xl border border-slate-100 z-50 space-y-3">
                  <div className="flex justify-between items-center px-1 border-b border-slate-100 pb-2.5">
                    <span className="text-xs font-bold text-slate-900">Recent Activity</span>
                    <Link
                      to="/instructor/assignments"
                      onClick={() => setShowNotificationMenu(false)}
                      className="text-[11px] font-bold text-brand-600 hover:underline"
                    >
                      View Assignments
                    </Link>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {notifications.length ? notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <span className="text-xs font-bold text-slate-800">
                            {notif.studentName}
                          </span>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {notif.time}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500">
                          {notif.pending ? 'Submitted ' : 'Activity in '}
                          <strong className="text-slate-700">{notif.title}</strong>
                          {' '}for {notif.courseTitle}
                        </p>

                        {notif.pending && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                            <Clock className="w-3 h-3" /> Awaiting grading
                          </span>
                        )}
                      </div>
                    )) : (
                      <div className="p-5 text-center text-xs text-slate-400">
                        No recent activity.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/instructor/create-course"
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center gap-2 shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5 text-brand-600" /> New Course
            </Link>

            <Link
              to="/instructor/create-assignment"
              className="px-4 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 flex items-center gap-2 shadow-md shadow-brand-500/20 transition"
            >
              <FileText className="w-3.5 h-3.5" /> Create Assignment
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((s) => {
            const Icon = s.icon;

            return (
              <div
                key={s.label}
                className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-2 hover:shadow-md transition"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500">{s.label}</span>
                  <div className={`w-8 h-8 rounded-xl ${s.bg} ${s.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="text-2xl font-extrabold text-slate-900">{s.val}</div>

                <div className="text-[11px] font-semibold text-slate-500">
                  {s.change}
                </div>
              </div>
            );
          })}
        </div>

        {/* Activity & Attention */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Classroom Engagement & Submissions
                </h3>
                <p className="text-[11px] text-slate-400">
                  Last 7 days: lesson completions vs assignment submissions
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
                {['Daily', 'Weekly', 'Monthly'].map((range) => (
                  <button
                    key={range}
                    type="button"
                    disabled={range !== 'Weekly'}
                    onClick={() => setActiveRange(range)}
                    className={`px-3 py-1 rounded-lg transition ${
                      activeRange === range
                        ? 'bg-white text-brand-600 shadow-xs'
                        : range === 'Weekly'
                          ? 'hover:text-slate-900'
                          : 'text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-56 flex items-end justify-between px-4 pt-4 border-b border-slate-100">
              {weeklyActivity.length ? weeklyActivity.map((d, index) => {
                const completion = Number(d.lesson_completions || 0);
                const submissions = Number(d.submissions || 0);

                return (
                  <div key={d.date || index} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="flex items-end gap-1.5 h-full">
                      <div
                        style={{ height: `${Math.max(4, (completion / chartMax) * 100)}%` }}
                        className="w-6 rounded-t-lg transition-all bg-brand-600 group-hover:bg-brand-700"
                        title={`${completion} lesson completions`}
                      />
                      <div
                        style={{ height: `${Math.max(4, (submissions / chartMax) * 100)}%` }}
                        className="w-3 rounded-t-md bg-amber-400 opacity-80 group-hover:opacity-100 transition-all"
                        title={`${submissions} submissions`}
                      />
                    </div>

                    <span className="text-[11px] font-semibold text-slate-400">
                      {d.day}
                    </span>
                  </div>
                );
              }) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                  No activity recorded in the last 7 days.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-brand-600" /> Lesson Completion
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-amber-400" /> Submissions
                </span>
              </div>

              <Link
                to="/instructor/analytics"
                className="font-bold text-brand-600 hover:underline flex items-center gap-1"
              >
                Full Metrics <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                  <AlertCircle className="w-4 h-4" /> Attention Required
                </div>

                <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">
                  {pendingGrading + atRiskStudents.length} Flags
                </span>
              </div>

              <div className="space-y-3">
                {pendingGrading > 0 && (
                  <Link
                    to="/instructor/assignments"
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 block hover:border-brand-200 transition group"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-brand-600">
                        Pending grading
                      </span>
                      <span className="text-[10px] font-bold text-rose-500">
                        {pendingGrading} unchecked
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Student submissions are waiting for evaluation.
                    </p>
                  </Link>
                )}

                {atRiskStudents.slice(0, 2).map((student) => (
                  <div
                    key={`${student.student_id}-${student.course_id}`}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        {student.name}
                      </span>
                      <span className="text-[10px] font-bold text-amber-600">
                        {student.progress_percent}% progress
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {student.course_title} • inactive for {student.idle_days} days
                    </p>
                  </div>
                ))}

                {!pendingGrading && !atRiskStudents.length && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    No current attention items.
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight">Course Overview</h4>
                  <p className="text-xs text-brand-100 mt-0.5">
                    {totalCourses} total course{totalCourses === 1 ? '' : 's'} • {publishedCourses.length} published
                  </p>
                </div>
              </div>

              <Link
                to="/instructor/courses"
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-brand-600 rounded-xl text-xs font-bold hover:bg-brand-50 transition"
              >
                Manage Courses <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Real submission queue */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Submissions Ready For Evaluation</h3>
              <p className="text-xs text-slate-400">
                Latest assignment submissions from your courses
              </p>
            </div>

            <Link
              to="/instructor/assignments"
              className="text-xs font-bold text-brand-600 hover:underline"
            >
              View All {pendingGrading} In Queue →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-3">Student Name</th>
                  <th className="pb-3">Associated Course</th>
                  <th className="pb-3">Assignment / Activity</th>
                  <th className="pb-3">Submitted At</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {recentSubmissions.length ? recentSubmissions.map((item) => {
                  const pending = item.item_type === 'assignment' &&
                    (item.score === null || item.score === undefined);

                  return (
                    <tr key={`${item.item_type}-${item.id}`}>
                      <td className="py-3.5 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                            {getInitials(item.student_name)}
                          </span>
                          {item.student_name || 'Student'}
                        </div>
                      </td>

                      <td className="py-3.5 text-slate-600">
                        {item.course_title || '—'}
                      </td>

                      <td className="py-3.5 text-slate-600">
                        {item.title || '—'}
                      </td>

                      <td className="py-3.5 text-slate-400">
                        {formatDateTime(item.submitted_at)}
                      </td>

                      <td className="py-3.5 text-right">
                        {pending ? (
                          <Link
                            to="/instructor/assignments"
                            className="font-bold text-brand-600 hover:underline"
                          >
                            Grade Submission →
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {item.item_type === 'quiz' ? 'Completed' : 'Graded'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-slate-400">
                      No recent submissions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Existing real-data insights component */}
        <InstructorLiveInsights />
      </main>
    </div>
  );
}
