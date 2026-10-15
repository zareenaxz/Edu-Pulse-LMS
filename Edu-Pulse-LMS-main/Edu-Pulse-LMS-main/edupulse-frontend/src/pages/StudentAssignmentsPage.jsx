import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StudentSidebar from '../components/StudentSidebar';
import { CheckSquare, Calendar, Clock, Award, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';

// pending (not submitted) | submitted (waiting for the instructor) | graded
const statusOf = (a) => {
  const s = a.my_submission;
  if (!s) return 'pending';
  if (s.graded_at || s.marks !== null) return 'graded';
  return 'submitted';
};

const formatDate = (value) => {
  if (!value) return 'No deadline';
  const d = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};

const letter = (p) => (p >= 90 ? 'A' : p >= 80 ? 'B' : p >= 70 ? 'C' : p >= 60 ? 'D' : 'F');

export default function StudentAssignmentsPage() {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'submitted' | 'graded'
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/assignments')
      .then((d) => setRows(d.assignments))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const assignments = rows.map((a) => ({ ...a, status: statusOf(a) }));

  const courseOptions = [];
  assignments.forEach((a) => {
    if (!courseOptions.find((c) => c.id === a.course_id)) courseOptions.push({ id: a.course_id, title: a.course_title });
  });

  const filtered = assignments.filter((a) => {
    const matchesTab = activeTab === 'all' || a.status === activeTab;
    const matchesCourse = selectedCourse === 'all' || String(a.course_id) === String(selectedCourse);
    return matchesTab && matchesCourse;
  });

  const pendingCount = assignments.filter((a) => a.status === 'pending').length;
  const submittedCount = assignments.filter((a) => a.status === 'submitted').length;
  const gradedList = assignments.filter((a) => a.status === 'graded');
  const gradedCount = gradedList.length;
  const avgPercent = gradedList.length
    ? gradedList.reduce((sum, a) => sum + (Number(a.my_submission.marks) / Number(a.max_marks)) * 100, 0) / gradedList.length
    : null;

  const tabClass = (tab) =>
    `pb-3 border-b-2 transition ${activeTab === tab ? 'border-brand-600 text-brand-600 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'}`;

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <StudentSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Assignments & Problem Sets</h1>
            <p className="text-xs text-slate-500 mt-0.5">Submit homework solutions, inspect official rubrics, and view faculty feedback.</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none shadow-xs"
            >
              <option value="all">All Enrolled Courses</option>
              {courseOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">{error}</p>}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Pending Submissions</span>
              <div className="text-2xl font-black text-rose-600 mt-1">{pendingCount} Action Required</div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Evaluated & Graded</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{gradedCount} Problem Sets</div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Cumulative Assignment Grade</span>
              <div className="text-2xl font-black text-brand-600 mt-1">
                {avgPercent === null ? '—' : `${avgPercent.toFixed(1)}% (Grade ${letter(avgPercent)})`}
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex border-b border-slate-200 text-xs font-semibold gap-6">
          <button onClick={() => setActiveTab('all')} className={tabClass('all')}>All Coursework ({assignments.length})</button>
          <button onClick={() => setActiveTab('pending')} className={tabClass('pending')}>Due Soon / Pending ({pendingCount})</button>
          <button onClick={() => setActiveTab('submitted')} className={tabClass('submitted')}>Under Review ({submittedCount})</button>
          <button onClick={() => setActiveTab('graded')} className={tabClass('graded')}>Graded & Reviewed ({gradedCount})</button>
        </div>

        {loading && <p className="text-xs text-slate-400">Loading assignments…</p>}

        {/* Assignments Cards List */}
        <div className="space-y-4">
          {filtered.map((asgn) => (
            <div
              key={asgn.assignment_id}
              className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-5 hover:border-brand-200 transition"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  asgn.status === 'graded' ? 'bg-emerald-50 text-emerald-600' :
                  asgn.status === 'submitted' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  <CheckSquare className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                      {asgn.course_title}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      asgn.status === 'graded' ? 'bg-emerald-50 text-emerald-700' :
                      asgn.status === 'submitted' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {asgn.status}
                    </span>
                    {asgn.my_submission && asgn.my_submission.status === 'late' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700">late</span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{asgn.title}</h3>
                  {asgn.description && <p className="text-xs text-slate-500 max-w-2xl line-clamp-2">{asgn.description}</p>}

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Due {formatDate(asgn.deadline)}</span>
                    <span>•</span>
                    <span>{asgn.max_marks} Points Maximum</span>
                  </div>

                  {asgn.my_submission && asgn.my_submission.feedback && (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 mt-2">
                      <strong className="text-slate-900">Faculty Review:</strong> "{asgn.my_submission.feedback}"
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                {asgn.status === 'graded' && (
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Score Received</span>
                    <div className="text-2xl font-black text-emerald-600">{Number(asgn.my_submission.marks)} / {asgn.max_marks}</div>
                  </div>
                )}

                <Link
                  to={`/student/assignments/${asgn.course_id}/${asgn.assignment_id}`}
                  className="w-full md:w-auto px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {asgn.status === 'pending' ? 'Open Submission Desk →' : 'Inspect Details & Marks →'}
                </Link>
              </div>
            </div>
          ))}

          {!loading && filtered.length === 0 && (
            <p className="text-xs text-slate-400">
              {assignments.length === 0 ? 'No assignments yet. Enroll in a course to see its assignments.' : 'No assignments in this tab.'}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}