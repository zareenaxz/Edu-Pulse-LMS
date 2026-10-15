import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardSidebar from '../components/InstructorSidebar';
import { 
  ArrowLeft, Search, Filter, Download, 
  CheckCircle2, Clock, AlertTriangle, ArrowRight, UserCheck 
} from 'lucide-react';

export default function AssignmentReviewHub() {
  const { courseId } = useParams();
  const [filterState, setFilterState] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [submissions, setSubmissions] = useState([
    { id: 1, name: "Sarah Chen", email: "s.chen@university.edu", date: "Oct 12, 11:20 AM", status: "PENDING", score: "--", flag: "On Time" },
    { id: 2, name: "Alex Johnson", email: "a.johnson@university.edu", date: "Oct 12, 09:45 AM", status: "GRADED", score: "92/100", flag: "On Time" },
    { id: 3, name: "Marcus Rodriguez", email: "m.rodriguez@university.edu", date: "Oct 13, 02:15 PM", status: "PENDING", score: "--", flag: "Late Submission" },
    { id: 4, name: "Emma Lawson", email: "e.lawson@university.edu", date: "Oct 12, 04:50 PM", status: "PENDING", score: "--", flag: "On Time" },
    { id: 5, name: "David Kim", email: "d.kim@university.edu", date: "Oct 11, 08:30 PM", status: "GRADED", score: "96/100", flag: "On Time" },
  ]);

  const filtered = submissions.filter(s => {
    const matchesFilter = filterState === 'ALL' || s.status === filterState;
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <DashboardSidebar role="instructor" title="EduPulse" />

      <main className="flex-1 p-8 overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link 
              to={`/instructor/courses/${courseId || 'calc-301'}`} 
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                Submissions Roster
              </span>
              <h1 className="text-xl font-bold text-slate-900 mt-1">Problem Set 4: Derivatives & Chain Rule</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2">
              <Download className="w-3.5 h-3.5" /> Export All (CSV)
            </button>
            <Link
              to={`/instructor/assignments?courseId=${courseId || 'calc-301'}`}
              className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 shadow-md shadow-brand-500/20 flex items-center gap-1.5"
            >
              Launch Grading Desk <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Quick Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-1">
            <span className="text-[11px] font-semibold text-slate-400">Total Enrolled</span>
            <div className="text-2xl font-extrabold text-slate-900">30</div>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-1">
            <span className="text-[11px] font-semibold text-slate-400">Submitted</span>
            <div className="text-2xl font-extrabold text-slate-900">28</div>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-1">
            <span className="text-[11px] font-semibold text-amber-500">Pending Review</span>
            <div className="text-2xl font-extrabold text-amber-500">16</div>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-1">
            <span className="text-[11px] font-semibold text-emerald-600">Class Average</span>
            <div className="text-2xl font-extrabold text-emerald-600">88.4%</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFilterState('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterState === 'ALL' ? 'bg-brand-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              All (5)
            </button>
            <button
              onClick={() => setFilterState('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterState === 'PENDING' ? 'bg-amber-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              Needs Grading (3)
            </button>
            <button
              onClick={() => setFilterState('GRADED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterState === 'GRADED' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              Graded (2)
            </button>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="pb-3">Student</th>
                <th className="pb-3">Hand-in Date</th>
                <th className="pb-3">Timeliness</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Score</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5">
                    <div className="font-bold text-slate-900">{s.name}</div>
                    <div className="text-[11px] text-slate-400">{s.email}</div>
                  </td>
                  <td className="py-3.5 text-slate-500">{s.date}</td>
                  <td className="py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      s.flag === 'Late Submission' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {s.flag}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      s.status === 'GRADED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3.5 font-bold text-slate-800">{s.score}</td>
                  <td className="py-3.5 text-right">
                    <Link
                      to={`/instructor/assignments?courseId=${courseId || 'calc-301'}`}
                      className="px-3 py-1.5 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded-lg text-xs font-semibold transition"
                    >
                      {s.status === 'GRADED' ? 'Review Grade' : 'Grade Now →'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}