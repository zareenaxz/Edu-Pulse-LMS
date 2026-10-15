import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, GraduationCap, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleReset = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      navigate('/login');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex flex-col items-center justify-center p-4">
      <Link to="/" className="flex items-center gap-2 mb-6 group">
        <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div className="text-left">
          <div className="font-extrabold text-slate-900 leading-tight">EduPulse</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Academic Portal</div>
        </div>
      </Link>

      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-black text-slate-900">Create New Password</h2>
          <p className="text-xs text-slate-500 mt-1">Must be different from previously used passwords.</p>
        </div>

        {submitted ? (
          <div className="p-6 text-center bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-900">Password Updated Successfully!</h3>
            <p className="text-xs text-emerald-700">Redirecting to login portal...</p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Password strength indicators */}
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                <div className="h-1 bg-brand-600 rounded-full" />
                <div className="h-1 bg-brand-600 rounded-full" />
                <div className="h-1 bg-brand-600 rounded-full" />
                <div className="h-1 bg-brand-200 rounded-full" />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block font-medium">Strong password requirement met</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition shadow-sm"
            >
              Update Password
            </button>
          </form>
        )}

        <div className="text-center">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}