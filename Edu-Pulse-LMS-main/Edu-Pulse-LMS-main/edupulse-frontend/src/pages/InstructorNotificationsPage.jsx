import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '../components/InstructorSidebar';
import { 
  Bell, UserCheck, UserX, UserPlus, CheckCircle2, 
  Clock, FileText, AlertCircle, Trash2, Check, Filter 
} from 'lucide-react';

export default function InstructorNotificationsPage() {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'enrollments' | 'submissions' | 'system'

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'enrollment',
      studentName: 'Julian Vance',
      studentEmail: 'j.vance@university.edu',
      studentAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&q=80',
      courseId: 'calc-301',
      courseTitle: 'Advanced Calculus 301: Multivariable Derivatives',
      requestDate: '10 minutes ago',
      statement: 'Completed Calculus II with grade A-. Requesting prerequisite waiver for Week 1 start.',
      status: 'pending', // 'pending' | 'approved' | 'rejected'
      read: false
    },
    {
      id: 2,
      type: 'enrollment',
      studentName: 'Clara Oswald',
      studentEmail: 'c.oswald@university.edu',
      studentAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&q=80',
      courseId: 'ui-design-101',
      courseTitle: 'Introduction to UI Design Principles',
      requestDate: '1 hour ago',
      statement: 'Transfer student from Computer Science dept wishing to take Human Interface honors.',
      status: 'pending',
      read: false
    },
    {
      id: 3,
      type: 'submission',
      studentName: 'Sarah Chen',
      courseTitle: 'Advanced Calculus 301',
      details: 'Handed in Problem Set 4: Multivariable Derivatives on time.',
      requestDate: '2 hours ago',
      read: false
    },
    {
      id: 4,
      type: 'enrollment',
      studentName: 'Liam Henderson',
      studentEmail: 'l.henderson@university.edu',
      studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80',
      courseId: 'ml-adv-502',
      courseTitle: 'Advanced Machine Learning Algorithms',
      requestDate: 'Yesterday',
      statement: 'Senior standing student with completed Linear Algebra & Python prerequisites.',
      status: 'approved',
      read: true
    },
    {
      id: 5,
      type: 'system',
      title: 'Grading Deadline Reminder',
      details: 'Quarterly grade freeze will happen this Friday at 11:59 PM EST.',
      requestDate: '2 days ago',
      read: true
    }
  ]);

  const handleApprove = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, status: 'approved', read: true } : n));
  };

  const handleReject = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, status: 'rejected', read: true } : n));
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const filtered = notifications.filter(n => {
    if (activeTab === 'enrollments') return n.type === 'enrollment';
    if (activeTab === 'submissions') return n.type === 'submission';
    if (activeTab === 'system') return n.type === 'system';
    return true;
  });

  const pendingEnrollmentsCount = notifications.filter(n => n.type === 'enrollment' && n.status === 'pending').length;

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <DashboardSidebar role="instructor" title="EduPulse" />

      <main className="flex-1 p-8 overflow-y-auto space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900">Notification Center</h1>
              {pendingEnrollmentsCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
                  {pendingEnrollmentsCount} Action Required
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Review student admission requests, course hand-ins, and system notices.</p>
          </div>

          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            Mark all as read
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-slate-200 text-xs font-semibold gap-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 border-b-2 transition ${activeTab === 'all' ? 'border-brand-600 text-brand-600 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            All Notifications ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('enrollments')}
            className={`pb-3 border-b-2 transition flex items-center gap-2 ${activeTab === 'enrollments' ? 'border-brand-600 text-brand-600 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Student Enrollment Requests
            {pendingEnrollmentsCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px] font-bold">
                {pendingEnrollmentsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`pb-3 border-b-2 transition ${activeTab === 'submissions' ? 'border-brand-600 text-brand-600 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Assignment Submissions
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`pb-3 border-b-2 transition ${activeTab === 'system' ? 'border-brand-600 text-brand-600 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            System Notices
          </button>
        </div>

        {/* Notification Cards List */}
        <div className="space-y-4">
          {filtered.map((item) => {
            // Case 1: Student Enrollment Request with Approve/Reject actions
            if (item.type === 'enrollment') {
              return (
                <div
                  key={item.id}
                  className={`p-6 rounded-3xl border transition-all ${
                    item.status === 'pending'
                      ? 'bg-white border-slate-200/80 shadow-sm'
                      : 'bg-slate-50/70 border-slate-100 opacity-90'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={item.studentAvatar}
                        alt={item.studentName}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                            Enrollment Application
                          </span>
                          <span className="text-[11px] text-slate-400">• {item.requestDate}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {item.studentName} <span className="text-xs font-normal text-slate-500">({item.studentEmail})</span>
                        </h3>
                        <p className="text-xs text-slate-600 font-medium">
                          Applying for: <span className="text-brand-600 font-bold">{item.courseTitle}</span>
                        </p>
                        {item.statement && (
                          <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2 max-w-2xl">
                            "{item.statement}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions / Status */}
                    <div className="flex items-center gap-2.5 self-end md:self-center">
                      {item.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve Student
                          </button>
                          <button
                            onClick={() => handleReject(item.id)}
                            className="px-4 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <UserX className="w-3.5 h-3.5" /> Reject
                          </button>
                        </>
                      ) : item.status === 'approved' ? (
                        <span className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Enrollment Approved
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4" /> Application Rejected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // Case 2: Assignment Submission Hand-in Alert
            if (item.type === 'submission') {
              return (
                <div key={item.id} className="p-5 rounded-3xl bg-white border border-slate-100 shadow-xs flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{item.studentName}</span>
                        <span className="text-[11px] text-slate-400">• {item.requestDate}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{item.details} (<span className="text-slate-700 font-semibold">{item.courseTitle}</span>)</p>
                    </div>
                  </div>
                  <Link
                    to="/instructor/assignments"
                    className="px-3.5 py-1.5 bg-brand-50 text-brand-600 hover:bg-brand-100 text-xs font-bold rounded-xl transition"
                  >
                    Grade Now →
                  </Link>
                </div>
              );
            }

            // Case 3: System Notice
            return (
              <div key={item.id} className="p-5 rounded-3xl bg-white border border-slate-100 shadow-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{item.title}</span>
                      <span className="text-[11px] text-slate-400">• {item.requestDate}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{item.details}</p>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 p-8 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">You're all caught up!</h3>
              <p className="text-xs text-slate-400">No pending notifications in this category.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}