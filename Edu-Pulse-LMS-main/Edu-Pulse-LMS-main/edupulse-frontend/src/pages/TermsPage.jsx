import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Calendar, ShieldCheck, Lock, FileText, AlertTriangle } from 'lucide-react';

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('sec-1');

  const sections = [
    { id: 'sec-1', title: '1. Platform Acceptance & Scope' },
    { id: 'sec-2', title: '2. User Roles & Account Security' },
    { id: 'sec-3', title: '3. Academic Integrity & Acceptable Use' },
    { id: 'sec-4', title: '4. Intellectual Property & Course Licenses' },
    { id: 'sec-5', title: '5. Student Privacy (FERPA & GDPR)' },
    { id: 'sec-6', title: '6. Instructor Compensation & Fees' },
    { id: 'sec-7', title: '7. Limitation of Liability' }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex flex-col justify-between">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-12 gap-8 items-start w-full">
        {/* Sticky Table of Contents Sidebar */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4 sticky top-28">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Navigation Index</span>
          <nav className="space-y-1 text-xs font-semibold">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setActiveSection(s.id)}
                className={`block px-3 py-2 rounded-xl transition ${
                  activeSection === s.id
                    ? 'bg-brand-50 text-brand-600 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {s.title}
              </a>
            ))}
          </nav>
        </div>

        {/* Legal Text Content Body */}
        <div className="lg:col-span-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-xs space-y-8 text-xs leading-relaxed text-slate-600">
          <div className="border-b border-slate-100 pb-6 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
              Legal Compliance Documentation
            </span>
            <h1 className="text-2xl font-black text-slate-900">Terms of Service & Student Privacy Policy</h1>
            <div className="flex items-center gap-2 text-slate-400 text-[11px] pt-1">
              <Calendar className="w-3.5 h-3.5" /> Effective Date: September 2026 • Revision 4.2
            </div>
          </div>

          <section id="sec-1" className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">1. Platform Acceptance & Scope</h2>
            <p>
              By accessing, browsing, or creating an account on EduPulse ("Platform", "we", "us"), you agree to be legally bound by these terms. If you are accessing this portal on behalf of an accredited university or educational institution, you warrant that you possess authority to bind said entity.
            </p>
          </section>

          <section id="sec-2" className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">2. User Roles & Account Security</h2>
            <p>
              EduPulse provides compartmentalized access for Scholars, Faculty Instructors, and Institutional Administrators. Users are strictly responsible for maintaining multi-factor authentication credentials. Impersonating faculty members or sharing student accounts during examination windows is grounds for immediate termination.
            </p>
          </section>

          <section id="sec-3" className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900">3. Academic Integrity & Acceptable Use</h2>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold"><AlertTriangle className="w-4 h-4" /> Strictly Prohibited Conduct:</div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800">
                <li>Automated mass-scraping of video lecture assets or proprietary problem sets.</li>
                <li>Sharing, circulating, or publishing confidential faculty grading solutions.</li>
                <li>Submitting AI-synthesized responses where strictly forbidden by syllabus rubrics.</li>
              </ul>
            </div>
          </section>

          <section id="sec-4" className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">4. Intellectual Property & Course Licenses</h2>
            <p>
              Instructors retain authorial copyright over their course videos, problem sets, and syllabi. By publishing through EduPulse, instructors grant the platform a worldwide, non-exclusive license to host and stream materials to authorized, enrolled scholars.
            </p>
          </section>

          <section id="sec-5" className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">5. Student Privacy Protections (FERPA & GDPR)</h2>
            <p>
              Student academic submissions, test evaluations, and individual grades are encrypted at rest and in transit. In accordance with the Family Educational Rights and Privacy Act (FERPA) and General Data Protection Regulation (GDPR), student grades are confidential and only accessible by designated course instructors and institutional auditors.
            </p>
          </section>

          <section id="sec-6" className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">6. Instructor Compensation & Fees</h2>
            <p>
              Course revenues are disbursed bi-weekly to verified faculty bank accounts, minus the institutional platform fee (15% standard). All student audit tiers remain royalty-free.
            </p>
          </section>

          <section id="sec-7" className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">7. Limitation of Liability</h2>
            <p>
              EduPulse is provided on an "as is" and "as available" basis. While we guarantee a 99.9% uptime SLA for examination infrastructure, we are not liable for external network outages, personal hardware failures, or unverified course content.
            </p>
          </section>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition shadow-sm">
              I Accept Academic Policies
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}