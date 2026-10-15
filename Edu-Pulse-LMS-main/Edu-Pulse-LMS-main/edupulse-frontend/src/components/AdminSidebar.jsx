import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  BarChart2,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
} from 'lucide-react';

export default function AdminSidebar({ title = 'LearnFlow' }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // Sign Out
  const handleSignOut = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setShowProfileMenu(false);
      navigate('/', {
        replace: true
      });
    }
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Admin navigation
  const adminNav = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard/admin',
      isMatch: (p) => p === '/dashboard/admin',
    },
    {
      label: 'User Management',
      icon: Users,
      path: '/admin/users',
      isMatch: (p) => p.startsWith('/admin/users'),
    },
    {
      label: 'All Courses',
      icon: BookOpen,
      path: '/admin/courses',
      isMatch: (p) => p.startsWith('/admin/courses'),
    },
    {
      label: 'Instructor Approvals',
      icon: GraduationCap,
      path: '/admin/instructors',
      isMatch: (p) => p.startsWith('/admin/instructors'),
    },
    {
      label: 'Reports & Revenue',
      icon: BarChart2,
      path: '/admin/reports',
      isMatch: (p) => p.startsWith('/admin/reports'),
    },
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 bg-white border-r border-slate-100 flex flex-col justify-between p-4 shrink-0 z-40 select-none overflow-x-hidden">

      {/* Main Sidebar Content */}
      <div className="overflow-y-auto overflow-x-hidden pr-1">

        {/* Brand Header */}
        <Link
          to="/dashboard/admin"
          className="flex items-center gap-3 px-2 py-3 mb-6 group"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>

          <div>
            <div className="font-bold text-slate-900 leading-tight text-base">
              {title}
            </div>

            <span className="text-[10px] font-semibold text-brand-600 uppercase tracking-widest">
              Executive Portal
            </span>
          </div>
        </Link>

        {/* Navigation Items */}
        <div className="space-y-1">

          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Management
          </div>

          {adminNav.map((link) => {
            const Icon = link.icon;
            const isActive = link.isMatch(location.pathname);

            return (
              <Link
                key={link.label}
                to={link.path}
                className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20 pl-4'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  />

                  {link.label}
                </div>

                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Super Admin Profile */}
      <div
        className="pt-3 border-t border-slate-100 relative shrink-0"
        ref={profileMenuRef}
      >

        {/* Profile Dropdown */}
        {showProfileMenu && (
          <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-2xl p-2 shadow-xl border border-slate-100 text-xs space-y-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">

            {/* Admin Information */}
            <div className="px-3 py-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 block leading-tight">
                Super Admin
              </span>

              <span className="text-[10px] text-slate-400">
                admin@edupulse.internal
              </span>
            </div>

            {/* Platform Settings */}
            <Link
              to="/admin/settings"
              onClick={() => setShowProfileMenu(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-brand-50 hover:text-brand-600 font-semibold transition"
            >
              <Settings className="w-3.5 h-3.5" />
              Platform Settings
            </Link>

            {/* Notifications */}
            <Link
              to="/admin/notifications"
              onClick={() => setShowProfileMenu(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-brand-50 hover:text-brand-600 font-semibold transition"
            >
              <Bell className="w-3.5 h-3.5" />
              System Notifications
            </Link>

            <div className="border-t border-slate-100 my-1" />

            {/* Sign Out */}
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-50 font-semibold transition text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        )}

        {/* Profile Button */}
        <button
          type="button"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className={`w-full flex items-center justify-between p-2 rounded-2xl border transition-all text-left ${
            showProfileMenu
              ? 'bg-brand-50/60 border-brand-200'
              : 'bg-slate-50/80 border-slate-100 hover:bg-slate-100/70'
          }`}
        >

          {/* Avatar + Admin Info */}
          <div className="flex items-center gap-2.5 min-w-0">

            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              SA
            </div>

            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-800 truncate leading-tight">
                Super Admin
              </h4>

              <span className="text-[10px] text-brand-600 font-semibold">
                Owner Portal
              </span>
            </div>
          </div>

          {/* Settings Icon */}
          <Settings
            className={`w-4 h-4 text-slate-400 hover:text-brand-600 transition shrink-0 ${
              showProfileMenu
                ? 'rotate-45 text-brand-600'
                : ''
            }`}
          />
        </button>
      </div>
    </aside>
  );
}