import React, { useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { Save, Check, Shield, Globe, CreditCard } from 'lucide-react';

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    siteName: "LearnFlow / EduPulse LMS",
    supportEmail: "support@edupulse.internal",
    allowSelfRegistration: true,
    requireInstructorVetting: true,
    platformFeePct: 15,
    stripeEnabled: true
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <AdminSidebar title="LearnFlow" />

      <main className="flex-1 p-8 overflow-y-auto space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Platform Settings & Policies</h1>
          <p className="text-xs text-slate-500 mt-0.5">Configure institutional naming, global verification rules, and payment gateways.</p>
        </div>

        <form onSubmit={handleSave} className="max-w-4xl space-y-6">
          {/* Identity */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">Platform Identity</h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Institution / Platform Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Global Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Governance Toggles */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">Governance & Policies</h3>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.requireInstructorVetting}
                  onChange={(e) => setSettings({ ...settings, requireInstructorVetting: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                />
                <span className="text-xs font-bold text-slate-800">
                  Enforce Mandatory Manual Verification for New Instructor Candidates
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowSelfRegistration}
                  onChange={(e) => setSettings({ ...settings, allowSelfRegistration: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                />
                <span className="text-xs font-bold text-slate-800">
                  Allow Open Student Self-Registration (No Pre-Approval Needed)
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition"
            >
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? "Settings Saved" : "Save Platform Configurations"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}