import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { 
  Bell, ShieldAlert, GraduationCap, CheckCircle2, 
  AlertTriangle, Check, X, Filter, Clock, ShieldCheck 
} from 'lucide-react';

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'faculty' | 'security' | 'system'

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'faculty',
      title: 'New Instructor Accreditation Request',
      details: 'Dr. Arthur Vance (a.vance@mit.edu) submitted verified PhD transcripts for Cloud Systems coursework.',
      date: '15 minutes ago',
      read: false,
      status: 'pending',
      actionUrl: '/admin/instructors'
    },
    {
      id: 2,
      type: 'security',
      title: 'Suspicious Concurrent Sign-in Attempt',
      details: 'Multiple failed password attempts detected from IP 194.26.29.112 targeting user jane@watson.co.',
      date: '45 minutes ago',
      read: false,
      severity: 'high'
    },
    {
      id: 3,
      type: 'faculty',
      title: 'New Instructor Accreditation Request',
      details: 'Milena Rostova (milena@rustlabs.io) uploaded academic syllabus for Rust Systems Design.',
      date: '2 hours ago',
      read: false,
      status: 'pending',
      actionUrl: '/admin/instructors'
    },
    {
      id: 4,
      type: 'system',
      title: 'Monthly Database Backup Complete',
      details: 'PostgreSQL automated archive snapshot verified successfully (Size: 4.8 GB).',
      date: 'Yesterday',
      read: true
    },
    {
      id: 5,
      type: 'security',
      title: 'API Rate Limit Threshold Approaching',
      details: 'Vimeo video transcoding webhook volume spiked to 88% capacity.',
      date: '2 days ago',
      read: true,
      severity: 'medium'
    }
  ]);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleResolveFaculty = (id, newStatus) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, status: newStatus, read: true } : n));
  };

  const filtered = notifications.filter(n => {
    if (activeTab === 'faculty') return n.type === 'faculty';
    if (activeTab === 'security') return n.type === 'security';
    if (activeTab === 'system') return n.type === 'system';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <AdminSidebar title="LearnFlow" />

      <main className="flex-1 p-8 overflow-y-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900">Admin Notification Center</h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Platform-wide security flags, faculty admission queues, and infrastructure notifications.</p>
          </div>

          <button
            onClick={markAllRead}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            Mark all as read
          </button>
        </div>

        {/* Filter Navigation */}
        <div className="flex border-b border-slate-200 text-xs font-semibold gap-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 border-b-2 transition ${activeTab === 'all' ? 'border-brand-600 text-brand-600 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            All Notifications ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('faculty')}
            className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${activeTab === 'faculty' ? 'border-brand-600 text-brand-600 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Faculty Requests
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${activeTab === 'security' ? 'border-brand-600 text-brand-600 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Security Warnings
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`pb-3 border-b-2 transition ${activeTab === 'system' ? 'border-brand-600 text-brand-600 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Infrastructure Logs
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`p-6 rounded-3xl border transition-all ${
                !item.read
                  ? 'bg-white border-slate-200 shadow-xs'
                  : 'bg-slate-50/70 border-slate-100 opacity-85'
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    item.type === 'faculty' 
                      ? 'bg-purple-50 text-purple-600' 
                      : item.type === 'security' 
                      ? 'bg-rose-50 text-rose-600' 
                      : 'bg-blue-50 text-blue-600'
                  }`}>
                    {item.type === 'faculty' ? <GraduationCap className="w-5 h-5" /> : item.type === 'security' ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        item.type === 'faculty' 
                          ? 'bg-purple-50 text-purple-700' 
                          : item.type === 'security' 
                          ? 'bg-rose-50 text-rose-700' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.type}
                      </span>
                      <span className="text-[11px] text-slate-400">• {item.date}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-500 max-w-2xl">{item.details}</p>
                  </div>
                </div>

                {/* Direct Action triggers based on notification type */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  {item.type === 'faculty' && item.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleResolveFaculty(item.id, 'approved')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleResolveFaculty(item.id, 'rejected')}
                        className="px-3.5 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </>
                  )}

                  {item.type === 'faculty' && item.status === 'approved' && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                      Approved ✓
                    </span>
                  )}

                  {item.type === 'faculty' && item.status === 'rejected' && (
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-xl border border-rose-200">
                      Rejected ✕
                    </span>
                  )}

                  {item.type === 'security' && (
                    <Link
                      to="/admin/users"
                      className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                    >
                      Audit User Activity →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}