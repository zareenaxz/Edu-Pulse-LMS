import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">EduPulse LMS</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link to="/" className="hover:text-brand-600 transition-colors">About Us</Link>
          <Link to="/support" className="hover:text-brand-600 transition-colors">Help & Support</Link>
          <Link to="/terms" className="hover:text-brand-600 transition-colors">Terms & Privacy</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login" className="px-5 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
            Log In
          </Link>
          <Link to="/register" className="px-5 py-2.5 text-sm font-medium bg-brand-600 text-white rounded-xl shadow-md hover:bg-brand-700 transition-all">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}