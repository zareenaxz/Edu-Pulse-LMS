import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardSidebar from '../components/InstructorSidebar';
import { ArrowLeft, Users, CheckCircle2, AlertTriangle, Star, ChevronDown, ChevronUp, Check, Circle } from 'lucide-react';
import { useApi } from '../api/useApi';

const HEALTH = {
  completed: ['Completed', 'bg-emerald-50 text-emerald-700'],
  on_track: ['On track', 'bg-blue-50 text-blue-700'],
  inactive: ['Inactive', 'bg-amber-50 text-amber-700'],
  at_risk: ['At risk', 'bg-rose-50 text-rose-700'],
};

function StudentDetail({ courseId, studentId }) {
  const { data, loading, error } = useApi(`/analytics/course/${courseId}/students/${studentId}`);
  if (loading) return <p className="text-xs text-slate-400 p-4">Loading…</p>;
  if (error) return <p className="text-xs text-rose-600 p-4">{error}</p>;
  return (
    <div className="grid md:grid-cols-3 gap-4 p-4 bg-slate-50 text-xs">
      <div>
        <h4 className="font-bold text-slate-800 mb-2">Lessons ({data.progress_percent}%)</h4>
        <ul className="space-y-1">
          {data.lessons.map((l) => (
            <li key={l.lesson_id} className="flex items-center gap-1.5">
              {l.completed ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Circle className="w-3.5 h-3.5 text-slate-300" />}
              <span className={l.completed ? 'text-slate-700' : 'text-slate-400'}>{l.lesson_order}. {l.title}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="font-bold text-slate-800 mb-2">Assignments</h4>
        <ul className="space-y-1">
          {data.assignments.map((a) => (
            <li key={a.assignment_id} className="flex justify-between gap-2">
              <span className="truncate">{a.title}</span>
              <span className={`font-bold ${a.submission_id ? 'text-slate-800' : 'text-rose-500'}`}>
                {a.submission_id ? (a.marks !== null ? `${a.marks}/${a.max_marks}` : a.status) : 'Not submitted'}
                {a.previous_versions > 0 && <span className="text-slate-400 font-medium"> · {a.previous_versions + 1} versions</span>}
              </span>
            </li>
          ))}
          {!data.assignments.length && <li className="text-slate-400">None</li>}
        </ul>
      </div>
      <div>
        <h4 className="font-bold text-slate-800 mb-2">Quizzes</h4>
        <ul className="space-y-1">
          {data.quizzes.map((q) => (
            <li key={q.quiz_id} className="flex justify-between gap-2">
              <span className="truncate">{q.title}</span>
              <span className="font-bold">{q.attempts ? `${q.best_score}/${q.total_marks} · ${q.attempts} tries` : 'Not attempted'}</span>
            </li>
          ))}
          {!data.quizzes.length && <li className="text-slate-400">None</li>}
        </ul>
      </div>
    </div>
  );
}

export default function InstructorCourseStatsPage() {
  const { courseId } = useParams();
  const { data, loading, error } = useApi(`/analytics/course/${courseId}`);
  const [openStudent, setOpenStudent] = useState(null);

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <DashboardSidebar role="instructor" title="EduPulse" />
      <main className="flex-1 p-8 overflow-y-auto space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
          <Link to={`/instructor/courses/${courseId}`} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded">Course statistics</span>
            <h1 className="text-xl font-bold text-slate-900 mt-1">{data ? data.course.title : 'Loading…'}</h1>
          </div>
          <Link to={`/instructor/courses/${courseId}/submissions`} className="ml-auto px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700">View all submissions</Link>
        </div>

        {loading && <p className="text-xs text-slate-400">Loading statistics…</p>}
        {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 rounded-xl px-3 py-2">{error}</p>}

        {data && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {[
                { l: 'Students', v: data.overview.students, i: Users },
                { l: 'Finished course', v: data.overview.completed_students, i: CheckCircle2 },
                { l: 'At risk', v: data.overview.at_risk_students, i: AlertTriangle },
                { l: 'Avg progress', v: `${data.overview.avg_progress_percent}%` },
                { l: 'Avg quiz', v: data.overview.avg_quiz_percent !== null ? `${data.overview.avg_quiz_percent}%` : '—' },
                { l: 'Rating', v: data.overview.avg_rating ? `${data.overview.avg_rating} (${data.overview.review_count})` : '—', i: Star },
              ].map((c) => (
                <div key={c.l} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs">
                  <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">{c.i && <c.i className="w-3.5 h-3.5" />}{c.l}</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">{c.v}</div>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Segment completion — which lessons are done / not done</h2>
                <p className="text-[11px] text-slate-400">Green = completed · Amber = started · Grey = not started (out of {data.overview.students} students)</p>
              </div>
              <div className="space-y-3">
                {data.lessons.map((l) => {
                  const n = data.overview.students || 1;
                  return (
                    <div key={l.lesson_id} className="text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold text-slate-800">{l.lesson_order}. {l.title}</span>
                        <span className="text-slate-500"><b className="text-emerald-600">{l.completed_count}</b> done · <b className="text-amber-600">{l.in_progress_count}</b> started · <b>{l.not_started_count}</b> not started · <b className="text-slate-900">{l.completion_rate}%</b></span>
                      </div>
                      <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100">
                        <div className="bg-emerald-500" style={{ width: `${(l.completed_count / n) * 100}%` }} />
                        <div className="bg-amber-400" style={{ width: `${(l.in_progress_count / n) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
                {!data.lessons.length && <p className="text-xs text-slate-400">No lessons yet.</p>}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="p-6 pb-3"><h2 className="text-sm font-bold text-slate-900">Student progress</h2></div>
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase text-slate-400 bg-slate-50">
                  <tr><th className="px-6 py-2">Student</th><th className="w-44">Progress</th><th>Assignments</th><th>Assign. avg</th><th>Quizzes</th><th>Quiz avg</th><th>Last active</th><th>Status</th><th /></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.students.map((s) => (
                    <React.Fragment key={s.student_id}>
                      <tr className="hover:bg-slate-50 cursor-pointer" onClick={() => setOpenStudent(openStudent === s.student_id ? null : s.student_id)}>
                        <td className="px-6 py-3"><div className="font-bold text-slate-800">{s.name}</div><div className="text-[10px] text-slate-400">{s.email}</div></td>
                        <td><div className="flex items-center gap-2"><div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-brand-600" style={{ width: `${s.progress_percent}%` }} /></div><b className="w-9">{s.progress_percent}%</b></div><div className="text-[10px] text-slate-400">{s.completed_lessons}/{s.total_lessons} lessons</div></td>
                        <td>{s.assignments_submitted}/{s.assignments_total}</td>
                        <td>{s.assignment_avg_percent !== null ? `${s.assignment_avg_percent}%` : '—'}</td>
                        <td>{s.quizzes_attempted}/{s.quizzes_total}</td>
                        <td>{s.quiz_avg_percent !== null ? `${s.quiz_avg_percent}%` : '—'}</td>
                        <td className="text-slate-500">{s.last_active ? String(s.last_active).slice(0, 10) : 'Never'}</td>
                        <td><span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${HEALTH[s.health][1]}`}>{HEALTH[s.health][0]}</span></td>
                        <td className="pr-4 text-slate-400">{openStudent === s.student_id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</td>
                      </tr>
                      {openStudent === s.student_id && <tr><td colSpan={9} className="p-0"><StudentDetail courseId={courseId} studentId={s.student_id} /></td></tr>}
                    </React.Fragment>
                  ))}
                  {!data.students.length && <tr><td colSpan={9} className="px-6 py-6 text-slate-400">No students enrolled yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
