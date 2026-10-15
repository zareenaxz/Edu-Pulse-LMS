import React from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { 
  DollarSign, TrendingUp, Users, Download, 
  ShieldAlert, Activity, ArrowUpRight 
} from 'lucide-react';

export default function AdminReportsPage() {
  const auditLogs = [
    { timestamp: "Oct 14, 2026 - 10:14:02", actor: "admin@edupulse.internal", event: "Modified Platform Commission Tier to 12%", ip: "192.168.1.1" },
    { timestamp: "Oct 13, 2026 - 15:45:21", actor: "Super Admin", event: "Approved Instructor Dr. Arthur Vance", ip: "10.0.0.4" },
    { timestamp: "Oct 12, 2026 - 09:12:00", actor: "System Daemon", event: "Completed Automated Database Backup (PostgreSQL)", ip: "localhost" }
  ];

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <AdminSidebar title="LearnFlow" />

      <main className="flex-1 p-8 overflow-y-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Platform Financials & Audit Reports</h1>
            <p className="text-xs text-slate-500 mt-0.5">Real-time revenue distributions, instructor payouts, and security access logs.</p>
          </div>

          <button className="px-4 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition">
            <Download className="w-4 h-4" /> Download Complete Financial Audit (PDF)
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-2">
            <span className="text-xs font-semibold text-slate-400">Total Gross Platform Revenue</span>
            <div className="text-3xl font-extrabold text-slate-900">$184,920</div>
            <div className="text-[11px] font-bold text-emerald-600">+14.2% YoY Growth</div>
          </div>
          <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-2">
            <span className="text-xs font-semibold text-slate-400">Disbursed Instructor Payouts</span>
            <div className="text-3xl font-extrabold text-purple-600">$142,400</div>
            <div className="text-[11px] font-bold text-slate-500">80% Faculty Share</div>
          </div>
          <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-2">
            <span className="text-xs font-semibold text-slate-400">Platform Net Retained</span>
            <div className="text-3xl font-extrabold text-brand-600">$42,520</div>
            <div className="text-[11px] font-bold text-emerald-600">Operational Margin: 23%</div>
          </div>
        </div>

        {/* Platform Audit Trail */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Security & Administrative Audit Logs</h3>
              <p className="text-xs text-slate-400">Immutable trace of all privilege elevations and state modifications</p>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              Audit Stream Live
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold">
                  <th className="pb-3 font-sans">Timestamp</th>
                  <th className="pb-3 font-sans">Authorized Actor</th>
                  <th className="pb-3 font-sans">Action Event</th>
                  <th className="pb-3 text-right font-sans">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {auditLogs.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 text-slate-500">{log.timestamp}</td>
                    <td className="py-3.5 text-brand-600 font-bold">{log.actor}</td>
                    <td className="py-3.5 text-slate-800">{log.event}</td>
                    <td className="py-3.5 text-right text-slate-400">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}