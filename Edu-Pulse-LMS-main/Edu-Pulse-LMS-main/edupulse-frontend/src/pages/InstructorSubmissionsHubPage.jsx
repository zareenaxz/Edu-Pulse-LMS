import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardSidebar from '../components/InstructorSidebar';
import { ArrowLeft, FileText, HelpCircle, History, Download } from 'lucide-react';
import { useApi } from '../api/useApi';
import { api, fileUrl } from '../api/client';

const STATUS = { graded: 'bg-emerald-50 text-emerald-700', late: 'bg-rose-50 text-rose-700', submitted: 'bg-amber-50 text-amber-700' };

function HistoryPanel({ submissionId }) {
  const { data, loading, error } = useApi(`/hub/submissions/${submissionId}/history`);
  if (loading) return <p className="p-4 text-xs text-slate-400">Loading versions…</p>;
  if (error) return <p className="p-4 text-xs text-rose-600">{error}</p>;
  const versions = [{ ...data.current, label: 'Current' }, ...data.history.map((h, i) => ({ ...h, label: `Version ${data.history.length - i}` }))];
  return (
    <div className="p-4 bg-slate-50 space-y-2 text-xs">
      <h4 className="font-bold text-slate-800">All versions submitted by {data.student_name}</h4>
      {versions.map((v, i) => (
        <div key={i} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2 gap-3">
          <div>
            <span className="font-bold text-slate-800">{v.label}</span>
            <span className="text-slate-400"> · {v.submitted_at}</span>
            {v.submission_text && <p className="text-slate-500 mt-0.5 line-clamp-2">{v.submission_text}</p>}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-bold">{v.marks !== null && v.marks !== undefined ? `${v.marks}/${data.max_marks}` : 'ungraded'}</span>
            {v.file_url && <a href={fileUrl(v.file_url)} target="_blank" rel="noreferrer" className="text-brand-600 font-bold flex items-center gap-1"><Download className="w-3.5 h-3.5" />File</a>}
          </div>
        </div>
      ))}
    </div>
  );
}

function GradeForm({ item, onDone }) {
  const [marks, setMarks] = useState(item.score ?? '');
  const [feedback, setFeedback] = useState(item.feedback || '');
  const [err, setErr] = useState('');
  const save = async (e) => {
    e.preventDefault();
    setErr('');
    try { await api.patch(`/submissions/${item.id}/grade`, { marks: Number(marks), feedback }); onDone(); }
    catch (ex) { setErr(ex.message); }
  };
  return (
    <form onSubmit={save} className="p-4 bg-slate-50 flex flex-wrap items-center gap-3 text-xs">
      <input type="number" step="0.5" min="0" max={item.max_score} value={marks} onChange={(e) => setMarks(e.target.value)} placeholder={`Marks / ${item.max_score}`} className="w-32 p-2 rounded-xl border border-slate-200" required />
      <input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Feedback for the student" className="flex-1 min-w-48 p-2 rounded-xl border border-slate-200" />
      <button className="px-4 py-2 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700">Save grade</button>
      {err && <span className="text-rose-600 font-semibold">{err}</span>}
    </form>
  );
}

export default function InstructorSubmissionsHubPage() {
  const { courseId } = useParams();
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('');
  const [student, setStudent] = useState('');
  const [panel, setPanel] = useState(null); // { key, kind: 'history' | 'grade' }

  const qs = new URLSearchParams({ type, ...(status && { status }), ...(student && { student_id: student }) }).toString();
  const { data, loading, error, reload } = useApi(`/hub/course/${courseId}?${qs}`);
  const { data: all } = useApi(`/hub/course/${courseId}`); // unfiltered, only to fill the student dropdown
  const students = useMemo(() => {
    const m = new Map();
    (all ? all.items : []).forEach((i) => m.set(i.student_id, i.student_name));
    return [...m.entries()];
  }, [all]);

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <DashboardSidebar role="instructor" title="EduPulse" />
      <main className="flex-1 p-8 overflow-y-auto space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
          <Link to={`/instructor/courses/${courseId}`} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded">Submissions hub</span>
            <h1 className="text-xl font-bold text-slate-900 mt-1">{data ? data.course.title : 'Loading…'}</h1>
            <p className="text-[11px] text-slate-400">Assignments + quizzes, including every earlier submission, in one place.</p>
          </div>
          <Link to={`/instructor/courses/${courseId}/stats`} className="ml-auto px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50">Course statistics</Link>
        </div>

        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[['Total', data.summary.total], ['Assignments', data.summary.assignments], ['Quizzes', data.summary.quizzes], ['Needs grading', data.summary.needs_grading], ['Re-submitted', data.summary.resubmitted]].map(([l, v]) => (
              <div key={l} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs"><div className="text-[11px] font-semibold text-slate-500">{l}</div><div className="text-xl font-extrabold text-slate-900">{v}</div></div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex rounded-xl bg-slate-100 p-1">
            {[['all', 'All'], ['assignment', 'Assignments'], ['quiz', 'Quizzes']].map(([k, l]) => (
              <button key={k} onClick={() => setType(k)} className={`px-3 py-1.5 rounded-lg font-bold ${type === k ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-500'}`}>{l}</button>
            ))}
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="p-2 rounded-xl border border-slate-200 bg-white font-semibold">
            <option value="">Any status</option><option value="submitted">Submitted</option><option value="late">Late</option><option value="graded">Graded</option>
          </select>
          <select value={student} onChange={(e) => setStudent(e.target.value)} className="p-2 rounded-xl border border-slate-200 bg-white font-semibold">
            <option value="">All students</option>
            {students.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </div>

        {loading && <p className="text-xs text-slate-400">Loading…</p>}
        {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 rounded-xl px-3 py-2">{error}</p>}

        {data && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] uppercase text-slate-400 bg-slate-50">
                <tr><th className="px-6 py-2">Type</th><th>Title</th><th>Student</th><th>Submitted</th><th>Status</th><th>Score</th><th>Work</th><th /></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.items.map((i) => {
                  const key = `${i.item_type}-${i.id}`;
                  return (
                    <React.Fragment key={key}>
                      <tr>
                        <td className="px-6 py-3">{i.item_type === 'quiz' ? <span className="inline-flex items-center gap-1 text-purple-600 font-bold"><HelpCircle className="w-3.5 h-3.5" />Quiz</span> : <span className="inline-flex items-center gap-1 text-brand-600 font-bold"><FileText className="w-3.5 h-3.5" />Assignment</span>}</td>
                        <td className="font-bold text-slate-800">{i.title}</td>
                        <td>{i.student_name}</td>
                        <td className="text-slate-500">{i.submitted_at}</td>
                        <td><span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${STATUS[i.status]}`}>{i.status}</span></td>
                        <td className="font-bold">{i.score !== null ? `${i.score}/${i.max_score}` : '—'}</td>
                        <td>{i.file_url ? <a href={fileUrl(i.file_url)} target="_blank" rel="noreferrer" className="text-brand-600 font-bold flex items-center gap-1"><Download className="w-3.5 h-3.5" />Open file</a> : i.submission_text ? <span className="text-slate-500 line-clamp-1 max-w-48 inline-block">{i.submission_text}</span> : '—'}</td>
                        <td className="pr-4 text-right whitespace-nowrap">
                          {i.item_type === 'assignment' && (
                            <>
                              {i.previous_versions > 0 && <button onClick={() => setPanel(panel && panel.key === key && panel.kind === 'history' ? null : { key, kind: 'history' })} className="mr-3 text-slate-500 font-bold inline-flex items-center gap-1"><History className="w-3.5 h-3.5" />{i.previous_versions + 1} versions</button>}
                              <button onClick={() => setPanel(panel && panel.key === key && panel.kind === 'grade' ? null : { key, kind: 'grade' })} className="text-brand-600 font-bold">{i.status === 'graded' ? 'Regrade' : 'Grade'}</button>
                            </>
                          )}
                        </td>
                      </tr>
                      {panel && panel.key === key && (
                        <tr><td colSpan={8} className="p-0">{panel.kind === 'history' ? <HistoryPanel submissionId={i.id} /> : <GradeForm item={i} onDone={() => { setPanel(null); reload(); }} />}</td></tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {!data.items.length && <tr><td colSpan={8} className="px-6 py-6 text-slate-400">No submissions match these filters.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
