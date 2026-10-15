import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-slate-800 text-sm">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">EduPulse LMS</span>
          </div>
          <p className="text-slate-400 max-w-sm text-xs leading-relaxed">
            Empowering individuals worldwide to expand their skills, secure competitive jobs, and achieve personal mastery.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-xs text-slate-300 uppercase tracking-wider mb-3">Company</h4>
          <ul className="space-y-2 text-slate-400 text-xs">
            <li><Link to="/" className="hover:text-white transition-colors">About Us</Link></li>
            <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Press Kit</a></li>
            <li><Link to="/support" className="hover:text-white transition-colors">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-xs text-slate-300 uppercase tracking-wider mb-3">Resources</h4>
          <ul className="space-y-2 text-slate-400 text-xs">
            <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Guides</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Online Bootcamps</a></li>
            <li><Link to="/support" className="hover:text-white transition-colors">Help Center</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-xs text-slate-300 uppercase tracking-wider mb-3">Legal</h4>
          <ul className="space-y-2 text-slate-400 text-xs">
            <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            <li><Link to="/terms" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
        <p>© 2026 EduPulse LMS. All rights reserved.</p>
        
        {/* Social Icons matching the bottom-right design */}
        <div className="flex items-center gap-3">
          {/* Facebook */}
          <a href="#" aria-label="Facebook" className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.891h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
            </svg>
          </a>

          {/* Twitter / X */}
          <a href="#" aria-label="Twitter" className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          {/* LinkedIn */}
          <a href="#" aria-label="LinkedIn" className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
            </svg>
          </a>

          {/* Instagram */}
          <a href="#" aria-label="Instagram" className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}