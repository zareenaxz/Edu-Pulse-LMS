import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
  LayoutDashboard,
  BookOpen,
  Compass,
  CheckSquare,
  Award,
  Bookmark,
  Settings,
  LogOut,
  GraduationCap,
  ChevronRight,
  ClipboardList
} from 'lucide-react';

import { getUser, clearSession } from '../api/client';
import UserAvatar from './useravatar';

export default function StudentSidebar({
  title = 'EduPulse'
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const user = getUser() || {
    name: 'Student',
    email: ''
  };

  const [showProfileMenu, setShowProfileMenu] =
    useState(false);

  const profileMenuRef = useRef(null);

  // ============================================================
  // SIGN OUT
  // ============================================================

  const handleSignOut = () => {
    clearSession();
    navigate('/login');
  };

  // ============================================================
  // CLOSE PROFILE MENU
  // ============================================================

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  // ============================================================
  // STUDENT NAVIGATION
  // ============================================================

  const studentNav = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard/student',
      isMatch: (p) =>
        p === '/dashboard/student'
    },

    {
      label: 'My Courses',
      icon: BookOpen,
      path: '/student/courses',
      isMatch: (p) =>
        p.startsWith('/student/courses') ||
        p.startsWith('/student/learn')
    },

    {
      label: 'Course Catalog',
      icon: Compass,
      path: '/student/catalog',
      isMatch: (p) =>
        p.startsWith('/student/catalog')
    },

    {
      label: 'Assignments',
      icon: CheckSquare,
      path: '/student/assignments',
      isMatch: (p) =>
        p.startsWith('/student/assignments')
    },

    // ========================================================
    // QUIZZES
    // ========================================================

    {
      label: 'Quizzes',
      icon: ClipboardList,
      path: '/student/quizzes',
      isMatch: (p) =>
        p.startsWith('/student/quizzes')
    },

    {
      label: 'Bookmarks',
      icon: Bookmark,
      path: '/student/bookmarks',
      isMatch: (p) =>
        p.startsWith('/student/bookmarks')
    },

    {
      label: 'Achievements & Badges',
      icon: Award,
      path: '/student/badges',
      isMatch: (p) =>
        p.startsWith('/student/badges')
    }
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 bg-white border-r border-slate-100 flex flex-col justify-between p-4 shrink-0 z-40 select-none overflow-x-hidden">

      {/* ====================================================== */}
      {/* MAIN SIDEBAR CONTENT */}
      {/* ====================================================== */}

      <div className="overflow-y-auto overflow-x-hidden pr-1">

        {/* ================================================== */}
        {/* BRAND */}
        {/* ================================================== */}

        <Link
          to="/dashboard/student"
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
              Learning Portal
            </span>
          </div>

        </Link>

        {/* ================================================== */}
        {/* NAVIGATION */}
        {/* ================================================== */}

        <div className="space-y-1">

          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Student Hub
          </div>

          {studentNav.map((link) => {
            const Icon = link.icon;

            const isActive =
              link.isMatch(location.pathname);

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
                      isActive
                        ? 'text-white'
                        : 'text-slate-400'
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

      {/* ====================================================== */}
      {/* PROFILE / SIGN OUT */}
      {/* ====================================================== */}

      <div
        ref={profileMenuRef}
        className="relative pt-3"
      >

        {showProfileMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50">

            <Link
              to="/student/profile"
              onClick={() =>
                setShowProfileMenu(false)
              }
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              Profile Settings
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>

          </div>
        )}

        <button
          type="button"
          onClick={() =>
            setShowProfileMenu((current) => !current)
          }
          className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition text-left"
        >

          <UserAvatar
            user={user}
            size="sm"
          />

          <div className="flex-1 min-w-0">

            <p className="text-xs font-bold text-slate-800 truncate">
              {user.name || 'Student'}
            </p>

            <p className="text-[10px] text-slate-400 truncate">
              {user.email || ''}
            </p>

          </div>

          <ChevronRight className="w-4 h-4 text-slate-300" />

        </button>

      </div>

    </aside>
  );
}