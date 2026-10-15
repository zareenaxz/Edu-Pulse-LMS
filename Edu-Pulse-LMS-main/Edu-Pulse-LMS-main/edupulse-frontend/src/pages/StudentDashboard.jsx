import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StudentSidebar from '../components/StudentSidebar';
import UserAvatar from '../components/useravatar';
import {
  Search, Bell, Flame, Award, Calendar,
  Star, Zap, Trophy, Shield,
  PlayCircle, Timer, Pause, Play, BarChart2, ExternalLink, Lock
} from 'lucide-react';
import { api, fileUrl, getUser } from '../api/client';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80';
const BADGE_STYLES = [
  { icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
  { icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
];

const toDate = (value) => (value ? new Date(String(value).replace(' ', 'T')) : null);

const timeAgo = (value) => {
  const d = toDate(value);
  if (!d || Number.isNaN(d.getTime())) return '';
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
};

const dueLabel = (value) => {
  const d = toDate(value);
  if (!d || Number.isNaN(d.getTime())) return '';
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export default function StudentDashboard() {
  const user = getUser() || { name: 'Student', role: 'student' };
  const firstName = String(user.name || 'Student').split(' ')[0];

  const [data, setData] = useState(null);
  const [allBadges, setAllBadges] = useState([]);
  const [myBadges, setMyBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showNotifs, setShowNotifs] = useState(false);
  const [notifsRead, setNotifsRead] = useState(false);
  const notifRef = useRef(null);

  // Study timer state (client-side Pomodoro)
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(1500); // 25 min default

  useEffect(() => {
    const load = async () => {
      try {
        const [summary, badges, mine] = await Promise.all([
          api.get('/analytics/student'),
          api.get('/badges'),
          api.get('/badges/me'),
        ]);
        setData(summary);
        setAllBadges(badges.badges);
        setMyBadges(mine.badges);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    let interval = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds((prev) => prev - 1), 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifs(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ---------- derived values ----------
  const courses = data ? data.courses : [];
  const upcoming = data ? data.upcomingAssignments : [];
  const weekly = data ? data.weeklyActivity : [];
  const weeklyGoal = data ? data.weeklyGoal : 4;
  const weeklyDone = data ? data.weeklyDone : 0;
  const goalPct = Math.min(100, Math.round((weeklyDone / weeklyGoal) * 100));
  const maxBar = Math.max(weeklyGoal, ...weekly.map((d) => d.lessons), 1);
  const bestProgress = courses.reduce((m, c) => Math.max(m, c.progress_percent), 0);

  // notifications are built from real events: new grades + deadlines in the next 3 days
  const notifications = [];
  if (data) {
    data.recentGrades.slice(0, 3).forEach((g) =>
      notifications.push({
        id: `g${g.submission_id}`,
        title: `${g.title} graded: ${Number(g.marks)}/${g.max_marks}`,
        subtitle: g.course_title,
        time: timeAgo(g.graded_at),
      })
    );
    upcoming
      .filter((a) => {
        const d = toDate(a.deadline);
        return d && d.getTime() - Date.now() < 3 * 86400000;
      })
      .forEach((a) =>
        notifications.push({
          id: `d${a.assignment_id}`,
          title: `${a.title} is due ${dueLabel(a.deadline).toLowerCase()}`,
          subtitle: a.course_title,
          time: '',
        })
      );
  }
  const unreadCount = notifsRead ? 0 : notifications.length;

  const resumeCourse = courses.find((c) => c.progress_percent < 100 && c.next_lesson_title);
  let heroText = 'Enroll in a course from the catalog to start learning.';
  if (courses.length) {
    const streakText = data.streakDays > 0
      ? `You are on a ${data.streakDays}-day study streak.`
      : 'Complete a lesson today to start a study streak.';
    heroText = resumeCourse
      ? `${streakText} Continue "${resumeCourse.next_lesson_title}" in ${resumeCourse.title} to keep your momentum.`
      : `${streakText} You have finished every lesson in your courses. Great work!`;
  }

  const badgeCards = allBadges.slice(0, 4).map((b, i) => {
    const earned = myBadges.some((m) => m.badge_id === b.badge_id);
    const required = Number(b.percentage_required) || 100;
    const progress = earned ? 100 : Math.min(100, Math.round((bestProgress / required) * 100));
    return { ...b, earned, progress, style: BADGE_STYLES[i % BADGE_STYLES.length] };
  });

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <StudentSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-8">

        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses, lessons, notes..."
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-none shadow-xs"
            />
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center" ref={notifRef}>
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowNotifs(!showNotifs); setNotifsRead(true); }}
                className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition shadow-xs relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white absolute top-2 right-2 animate-pulse" />
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-3xl p-4 shadow-2xl border border-slate-100 z-50 space-y-3">
                  <div className="flex justify-between items-center px-1 border-b border-slate-100 pb-2.5">
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    <Link to="/student/notifications" className="text-[11px] font-bold text-brand-600 hover:underline">
                      View All
                    </Link>
                  </div>

                  <div className="space-y-2">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-800 gap-2">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-slate-400 font-normal shrink-0">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">{n.subtitle}</p>
                      </div>
                    ))}
                    {notifications.length === 0 && <p className="text-xs text-slate-400 px-1">You are all caught up.</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Tag */}
            <div className="flex items-center gap-3 bg-white pl-2 pr-4 py-1.5 rounded-2xl border border-slate-200 shadow-xs">
              <UserAvatar user={user} className="w-8 h-8 rounded-xl text-[11px]" />
              <div className="text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">{user.name}</div>
                <div className="text-[10px] text-slate-400 font-semibold capitalize">{user.role || 'student'}</div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
            {error} — <Link to="/login" className="underline">Sign in again</Link>
          </p>
        )}
        {loading && <p className="text-xs text-slate-400">Loading your dashboard…</p>}

        {/* Hero Progress Banner */}
        <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 text-white rounded-3xl p-8 shadow-xl shadow-brand-500/15 relative overflow-hidden flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="space-y-4 max-w-xl text-center lg:text-left z-10">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-brand-100">
              Academic Dashboard
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
              Welcome back, {firstName}!
            </h1>
            <p className="text-xs sm:text-sm text-brand-100 leading-relaxed">{heroText}</p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-1">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-bold">
                  <Flame className="w-5 h-5 fill-slate-900" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-bold uppercase text-brand-200">Streak</span>
                  <p className="text-sm font-black">{data ? data.streakDays : 0} Days</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15">
                <div className="w-8 h-8 rounded-xl bg-white text-brand-600 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-bold uppercase text-brand-200">Points</span>
                  <p className="text-sm font-black">{data ? data.points.toLocaleString() : 0} XP</p>
                </div>
              </div>
            </div>
          </div>

          {/* Goal Ring Card */}
          <div className="bg-white text-slate-800 p-6 rounded-3xl shadow-xl flex flex-col items-center justify-center shrink-0 w-52 border border-slate-100 z-10">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-brand-600"
                  strokeDasharray={`${goalPct}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xl font-black text-brand-600">{goalPct}%</span>
            </div>
            <span className="text-xs font-bold text-slate-800 mt-2">Weekly Goal</span>
            <span className="text-[10px] text-slate-400 mt-0.5">{weeklyDone} of {weeklyGoal} lessons finished</span>
          </div>
        </div>

        {/* Quick stats */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Courses Enrolled', value: data.coursesEnrolled },
              { label: 'Average Grade', value: data.avgGradePercent !== null ? `${data.avgGradePercent}%` : '—' },
              { label: 'Badges Earned', value: data.badgesEarned },
              { label: 'Certificates', value: data.certificatesEarned },
            ].map((s) => (
              <div key={s.label} className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase">{s.label}</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Study Timer & Weekly Activity */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-12 gap-6 items-center">
          {/* Focus Timer Card (4 cols) */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Timer className="w-4 h-4 text-brand-600" /> Focus Pomodoro Session
              </span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">25 Mins</span>
            </div>

            <div className="text-center py-2">
              <div className="text-4xl font-black text-slate-900 tracking-tight font-mono">{formatTime(timerSeconds)}</div>
              <p className="text-[11px] text-slate-400 mt-1">Deep study without distractions</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                  timerRunning ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-brand-600 text-white hover:bg-brand-700'
                }`}
              >
                {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {timerRunning ? 'Pause Session' : 'Start Focus Timer'}
              </button>
              <button
                onClick={() => { setTimerRunning(false); setTimerSeconds(1500); }}
                className="px-3 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Weekly Lessons Bar Graph (8 cols) */}
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-brand-600" /> Weekly Learning Activity
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{weeklyDone} lessons completed in the last 7 days</p>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                {goalPct}% of weekly goal
              </span>
            </div>

            <div className="h-28 flex items-end justify-between px-2 pt-2 border-b border-slate-100">
              {weekly.map((item, i) => {
                const active = i === weekly.length - 1; // today
                return (
                  <div key={item.date} className="flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-bold text-slate-500">{item.lessons}</span>
                    <div
                      style={{ height: `${Math.max((item.lessons / maxBar) * 100, 4)}%` }}
                      className={`w-8 rounded-t-xl transition-all ${active ? 'bg-brand-600' : 'bg-brand-100 hover:bg-brand-200'}`}
                    />
                    <span className={`text-[10px] font-bold ${active ? 'text-brand-600' : 'text-slate-400'}`}>{item.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Enrolled Courses & Sidebar Section */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Courses (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-extrabold text-slate-900">Active Coursework</h2>
              <Link to="/student/courses" className="text-xs font-bold text-brand-600 hover:underline">
                View All Enrolled →
              </Link>
            </div>

            {data && courses.length === 0 && (
              <div className="p-8 bg-white rounded-3xl border border-slate-100 text-center space-y-3">
                <p className="text-sm font-bold text-slate-800">You are not enrolled in any course yet.</p>
                <Link to="/student/catalog" className="inline-block px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700">
                  Browse the Course Catalog
                </Link>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-5">
              {courses.slice(0, 4).map((course, i) => {
                const accent = i % 2 === 0 ? 'text-brand-600' : 'text-purple-600';
                const bar = i % 2 === 0 ? 'bg-brand-600' : 'bg-purple-600';
                return (
                  <div key={course.course_id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4 hover:shadow-md transition group">
                    <div className="h-40 rounded-2xl bg-slate-900 relative overflow-hidden">
                      <img
                        src={course.thumbnail ? fileUrl(course.thumbnail) : FALLBACK_IMAGE}
                        alt={course.title}
                        onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-80"
                      />
                      <span className={`absolute top-3 left-3 bg-white/95 ${accent} text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm uppercase`}>
                        {course.category_name}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition">{course.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-1">
                        {course.progress_percent >= 100
                          ? 'All lessons completed'
                          : course.next_lesson_title
                            ? `Next: ${course.next_lesson_title}`
                            : 'No lessons published yet'}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-500">
                        <span>Course Progress</span>
                        <span className={accent}>{course.progress_percent}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${bar} rounded-full`} style={{ width: `${course.progress_percent}%` }} />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        to={`/student/learn/${course.course_id}`}
                        className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition flex items-center justify-center gap-1.5 shadow-sm shadow-brand-500/20"
                      >
                        <PlayCircle className="w-4 h-4" /> {course.progress_percent > 0 ? 'Resume' : 'Start'}
                      </Link>
                      <Link
                        to={`/student/course/${course.course_id}`}
                        className="p-2.5 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50"
                        title="Course details"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Achievements & Deadlines (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Badges Milestone Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm">Academic Badges</h3>
                <Link to="/student/badges" className="text-[11px] font-bold text-brand-600 hover:underline">
                  All Badges →
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {badgeCards.map((b) => {
                  const Icon = b.earned ? b.style.icon : Lock;
                  return (
                    <div key={b.badge_id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                      <div className={`w-9 h-9 rounded-xl ${b.earned ? `${b.style.bg} ${b.style.color}` : 'bg-slate-100 text-slate-400'} flex items-center justify-center mb-1.5`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-slate-800 leading-tight">{b.badge_name}</div>
                      <span className="text-[10px] text-slate-400 mt-0.5">{b.percentage_required}% course progress</span>
                      <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
                        <div style={{ width: `${b.progress}%` }} className="bg-brand-600 h-full rounded-full" />
                      </div>
                    </div>
                  );
                })}
                {badgeCards.length === 0 && <p className="col-span-2 text-xs text-slate-400">No badges are available yet.</p>}
              </div>
            </div>

            {/* Upcoming Deadlines Widget */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Upcoming Deadlines</h3>
                <Calendar className="w-4 h-4 text-slate-400" />
              </div>

              <div className="space-y-3 text-xs">
                {upcoming.map((a) => {
                  const label = dueLabel(a.deadline);
                  const urgent = label === 'Today' || label === 'Tomorrow';
                  return (
                    <Link
                      key={a.assignment_id}
                      to={`/student/assignments/${a.course_id}/${a.assignment_id}`}
                      className={`block p-3.5 rounded-2xl border space-y-1 hover:shadow-xs transition ${urgent ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}
                    >
                      <div className="flex justify-between font-bold text-slate-800 gap-2">
                        <span>{a.title}</span>
                        <span className={`shrink-0 ${urgent ? 'text-rose-600 font-extrabold' : 'text-slate-500'}`}>{label}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {a.course_title} • {toDate(a.deadline).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </Link>
                  );
                })}
                {data && upcoming.length === 0 && <p className="text-slate-400">No upcoming deadlines. 🎉</p>}
              </div>

              <Link
                to="/student/assignments"
                className="block text-center w-full py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
              >
                View Full Assignments Schedule
              </Link>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}