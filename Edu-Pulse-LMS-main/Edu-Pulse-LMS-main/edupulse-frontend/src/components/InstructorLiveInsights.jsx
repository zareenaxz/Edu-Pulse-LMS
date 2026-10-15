import React from 'react';
import { Link } from 'react-router-dom';
import { Star, FileText, HelpCircle, AlertTriangle, Trophy, MessageSquare, BarChart3 } from 'lucide-react';
import { useApi } from '../api/useApi';
import { fileUrl } from '../api/client';
import { Stars } from './CourseRating';

const Card = ({ title, icon: Icon, children, className = '' }) => (
  <div className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4 ${className}`}>
    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><Icon className="w-4 h-4 text-brand-600" /> {title}</h3>
    {children}
  </div>
);
const Bar = ({ pct }) => (
  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-brand-600 rounded-full" style={{ width: `${pct}%` }} /></div>
);

// Live data from GET /api/analytics/instructor
export default function InstructorLiveInsights() {
  const { data, loading, error } = useApi('/analytics/instructor');
  if (loading) return <p className="text-xs text-slate-400">Loading live dashboard data…</p>;
  if (error) return (
    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-700 font-semibold">
      Live data unavailable ({error}). <Link to="/login" className="underline">Sign in</Link> as an instructor and make sure the backend is running.
    </div>
  );

  const maxAct = Math.max(1, ...data.weeklyActivity.map((d) => Math.max(d.lesson_completions, d.submissions)));
  const stats = [
    { label: 'My Courses', val: data.totalCourses },
    { label: 'Total Students', val: data.totalStudents },
    { label: 'Awaiting Grading', val: data.pendingGrading },
    { label: 'Average Rating', val: data.avgRating ? `${data.avgRating.toFixed(1)} ★` : '—', sub: `${data.totalReviews} reviews` },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-widest">Live data</span>
        <h2 className="text-lg font-extrabold text-slate-900">Course Performance Overview</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">{s.label}</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{s.val}</div>
            {s.sub && <div className="text-[11px] text-slate-400">{s.sub}</div>}
          </div>
        ))}
      </div>

      <Card title="My Courses — progress, grade & rating" icon={BarChart3}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
              <tr><th className="py-2">Course</th><th>Students</th><th className="w-40">Avg progress</th><th>Avg grade</th><th>Rating</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.courses.map((c) => (
                <tr key={c.course_id}>
                  <td className="py-3 font-bold text-slate-800">{c.title}<div className="text-[10px] font-medium text-slate-400 capitalize">{c.status}</div></td>
                  <td>{c.students}</td>
                  <td><div className="flex items-center gap-2"><Bar pct={c.avg_progress_percent} /><span className="font-bold w-9">{c.avg_progress_percent}%</span></div></td>
                  <td>{c.avg_grade_percent ? `${c.avg_grade_percent}%` : '—'}</td>
                  <td>{c.avg_rating ? <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500 fill-amber-500" />{c.avg_rating} <span className="text-slate-400">({c.review_count})</span></span> : '—'}</td>
                  <td className="text-right whitespace-nowrap">
                    <Link to={`/instructor/courses/${c.course_id}/stats`} className="text-brand-600 font-bold hover:underline mr-3">Stats</Link>
                    <Link to={`/instructor/courses/${c.course_id}/submissions`} className="text-brand-600 font-bold hover:underline">Submissions</Link>
                  </td>
                </tr>
              ))}
              {!data.courses.length && <tr><td colSpan={6} className="py-4 text-slate-400">No courses yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Last 7 days — lesson completions vs submissions" icon={BarChart3}>
          <div className="flex items-end gap-3 h-32">
            {data.weeklyActivity.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-1 h-24 w-full justify-center">
                  <div className="w-3 bg-brand-600 rounded-t" title={`${d.lesson_completions} completions`} style={{ height: `${(d.lesson_completions / maxAct) * 100}%`, minHeight: d.lesson_completions ? 3 : 0 }} />
                  <div className="w-3 bg-amber-400 rounded-t" title={`${d.submissions} submissions`} style={{ height: `${(d.submissions / maxAct) * 100}%`, minHeight: d.submissions ? 3 : 0 }} />
                </div>
                <span className="text-[10px] text-slate-400">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-[10px] text-slate-500"><span><i className="inline-block w-2.5 h-2.5 rounded-sm bg-brand-600 mr-1" />Lesson completions</span><span><i className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-400 mr-1" />Submissions</span></div>
        </Card>

        <Card title="Recent submissions (assignments + quizzes)" icon={FileText}>
          <div className="space-y-2.5">
            {data.recentSubmissions.map((s) => (
              <div key={`${s.item_type}-${s.id}`} className="flex items-center justify-between text-xs gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 truncate flex items-center gap-1.5">
                    {s.item_type === 'quiz' ? <HelpCircle className="w-3.5 h-3.5 text-purple-500" /> : <FileText className="w-3.5 h-3.5 text-brand-600" />}
                    {s.title}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{s.student_name} · {s.course_title}</div>
                </div>
                <div className="text-right shrink-0">
                  {s.file_url && <a href={fileUrl(s.file_url)} target="_blank" rel="noreferrer" className="text-brand-600 font-bold mr-2">File</a>}
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${s.status === 'graded' ? 'bg-emerald-50 text-emerald-700' : s.status === 'late' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                    {s.score !== null && s.score !== undefined ? `${s.score}/${s.max_score}` : s.status}
                  </span>
                </div>
              </div>
            ))}
            {!data.recentSubmissions.length && <p className="text-xs text-slate-400">Nothing submitted yet.</p>}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card title="Top students" icon={Trophy}>
          {data.topStudents.map((s) => (
            <div key={`${s.student_id}-${s.course_id}`} className="text-xs space-y-1">
              <div className="flex justify-between"><span className="font-bold text-slate-800">{s.name}</span><span className="font-bold text-brand-600">{s.progress_percent}%</span></div>
              <Bar pct={s.progress_percent} /><div className="text-[10px] text-slate-400">{s.course_title}</div>
            </div>
          ))}
          {!data.topStudents.length && <p className="text-xs text-slate-400">No enrolled students yet.</p>}
        </Card>

        <Card title="Needs attention" icon={AlertTriangle}>
          {data.atRiskStudents.map((s) => (
            <div key={`${s.student_id}-${s.course_id}`} className="text-xs flex justify-between gap-2">
              <div><div className="font-bold text-slate-800">{s.name}</div><div className="text-[10px] text-slate-400">{s.course_title}</div></div>
              <div className="text-right text-rose-600 font-bold">{s.progress_percent}%<div className="text-[10px] font-medium">{s.idle_days} days idle</div></div>
            </div>
          ))}
          {!data.atRiskStudents.length && <p className="text-xs text-slate-400">Nobody is falling behind. 🎉</p>}
        </Card>

        <Card title="Latest reviews" icon={MessageSquare}>
          {data.recentReviews.map((r) => (
            <div key={r.review_id} className="text-xs space-y-0.5">
              <div className="flex justify-between"><span className="font-bold text-slate-800">{r.student_name}</span><Stars value={r.rating} size="w-3 h-3" /></div>
              <div className="text-[10px] text-slate-400">{r.course_title}</div>
              {r.comment && <p className="text-slate-600">{r.comment}</p>}
            </div>
          ))}
          {!data.recentReviews.length && <p className="text-xs text-slate-400">No reviews yet.</p>}
        </Card>
      </div>
    </section>
  );
}
