import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  Search, Rocket, GraduationCap, CreditCard, 
  Mail, Phone, CheckCircle2, AlertCircle, HelpCircle, 
  Check, FileQuestion, MessageCircle, ExternalLink 
} from 'lucide-react';

export default function SupportPage() {
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ticket, setTicket] = useState({
    name: '',
    email: '',
    role: 'Student',
    issueType: 'Course Access & Video Streaming',
    priority: 'Normal',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubmitted(false);
      setTicket({ name: '', email: '', role: 'Student', issueType: 'Course Access & Video Streaming', priority: 'Normal', message: '' });
    }, 4000);
  };

  const categories = [
    {
      title: "Getting Started & Enrolling",
      count: "14 Articles",
      desc: "Setting up university accounts, enrolling in audit tiers, and student verification.",
      icon: Rocket
    },
    {
      title: "Faculty Workspace & Grading",
      count: "22 Articles",
      desc: "Creating modules, publishing problem sets, and managing student rosters.",
      icon: GraduationCap
    },
    {
      title: "Billing, Receipts & Invoices",
      count: "9 Articles",
      desc: "Institutional corporate licensing, card billing receipts, and refund policies.",
      icon: CreditCard
    },
    {
      title: "Accessibility & Assistive Tech",
      count: "11 Articles",
      desc: "Screen reader shortcut maps, caption configurations, and high-contrast settings.",
      icon: HelpCircle
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex flex-col justify-between">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-14 w-full space-y-14">
        {/* Support Header & Search */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-[11px] font-bold text-brand-600 uppercase tracking-widest bg-brand-50 px-3 py-1 rounded-full border border-brand-100">
            24/7 Academic Support
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">How Can We Help You Today?</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Search our curated institutional knowledge base or submit a ticket directly to academic operations.
          </p>

          <div className="relative max-w-xl mx-auto pt-2">
            <Search className="w-5 h-5 absolute left-4 top-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search guides (e.g., submit homework, change email, offline mode)..."
              className="w-full pl-12 pr-28 py-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs font-semibold"
            />
            <button className="absolute right-2 top-2.5 px-5 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition">
              Search
            </button>
          </div>
        </div>

        {/* Topics Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.title} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-3 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{cat.count}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{cat.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{cat.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Support Ticket + Direct Channels */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Ticket Form */}
          <div className="lg:col-span-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Submit an Academic Support Ticket</h2>
              <p className="text-xs text-slate-500 mt-1">Our support team answers within an average of 45 minutes during business hours.</p>
            </div>

            {ticketSubmitted ? (
              <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-sm font-bold text-emerald-900">Support Ticket Created Successfully!</h3>
                <p className="text-xs text-emerald-700">Reference: #EP-{Math.floor(100000 + Math.random() * 900000)}. We have dispatched an update to your email.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Johnson"
                      value={ticket.name}
                      onChange={(e) => setTicket({ ...ticket, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Academic Email</label>
                    <input
                      type="email"
                      required
                      placeholder="alex@university.edu"
                      value={ticket.email}
                      onChange={(e) => setTicket({ ...ticket, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Your Role</label>
                    <select
                      value={ticket.role}
                      onChange={(e) => setTicket({ ...ticket, role: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                    >
                      <option>Student</option>
                      <option>Faculty Instructor</option>
                      <option>Institutional Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Issue Category</label>
                    <select
                      value={ticket.issueType}
                      onChange={(e) => setTicket({ ...ticket, issueType: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                    >
                      <option>Course Access & Video Streaming</option>
                      <option>Homework Upload Error</option>
                      <option>Grading & Rubrics Dispute</option>
                      <option>Account Credentials & MFA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Priority</label>
                    <select
                      value={ticket.priority}
                      onChange={(e) => setTicket({ ...ticket, priority: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                    >
                      <option>Normal</option>
                      <option>Urgent (Exam in progress)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Detailed Explanation</label>
                  <textarea
                    rows="4"
                    required
                    placeholder="Describe the issue, including course title, lesson number, or error messages..."
                    value={ticket.message}
                    onChange={(e) => setTicket({ ...ticket, message: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition shadow-sm"
                >
                  Submit Support Ticket →
                </button>
              </form>
            )}
          </div>

          {/* Contact Details & SLA */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Direct Contact Desk</h3>
              <div className="space-y-3 text-xs">
                <div className="flex gap-3 text-slate-600">
                  <Mail className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">General Support</span>
                    <span className="text-slate-500">support@edupulse.internal</span>
                  </div>
                </div>
                <div className="flex gap-3 text-slate-600">
                  <Phone className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Faculty Hotline (Priority)</span>
                    <span className="text-slate-500">1-800-EDUPULSE (Mon-Fri, 9am - 6pm EST)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live System Status */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">System Uptime</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 99.98% Operational
                </span>
              </div>
              <p className="text-xs text-slate-500">Video streaming CDN, grading engines, and user authentication are running with zero incident flags.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}