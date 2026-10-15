import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
  LayoutDashboard,
  BookOpen,
  Library,
  CheckSquare,
  BarChart2,
  GraduationCap,
  ChevronRight,
  Settings,
  LogOut
} from 'lucide-react';

import { api, getUser, fileUrl } from '../api/client';

export default function DashboardSidebar({
  role = 'instructor',
  title = 'EduPulse'
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState(getUser());

  const profileMenuRef = useRef(null);

  // ---------------------------------------------
  // GET FRESH USER DATA FROM DATABASE
  // ---------------------------------------------

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await api.getMe();

        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };

    loadUser();
  }, []);

  // ---------------------------------------------
  // CLOSE PROFILE MENU
  // ---------------------------------------------

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

  // ---------------------------------------------
  // LOGOUT
  // ---------------------------------------------

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

  // ---------------------------------------------
  // USER DATA
  // ---------------------------------------------

  const userName =
    user?.name ||
    'Instructor';

  const userEmail =
    user?.email ||
    'No email available';

  const profileImage =
    fileUrl(user?.profile_image);

  const getInitials = (name) => {
    if (!name) return 'IN';

    const parts = name
      .trim()
      .split(/\s+/);

    if (parts.length === 1) {
      return parts[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  };

  const initials = getInitials(userName);

  // ---------------------------------------------
  // NAVIGATION
  // ---------------------------------------------

  const instructorNav = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard/instructor',
      isMatch: (pathname) =>
        pathname === '/dashboard/instructor'
    },
    {
      label: 'My Courses',
      icon: BookOpen,
      path: '/instructor/courses',
      isMatch: (pathname) =>
        pathname.startsWith('/instructor/courses') ||
        pathname.startsWith('/instructor/lesson-editor')
    },
    {
      label: 'Create New Course',
      icon: Library,
      path: '/instructor/create-course',
      isMatch: (pathname) =>
        pathname.startsWith('/instructor/create-course')
    },
    {
      label: 'Assignments & Grading',
      icon: CheckSquare,
      path: '/instructor/assignments',
      isMatch: (pathname) =>
        pathname.startsWith('/instructor/assignments') ||
        pathname.startsWith('/instructor/create-assignment')
    },
    {
      label: 'Analytics & Students',
      icon: BarChart2,
      path: '/instructor/analytics',
      isMatch: (pathname) =>
        pathname.startsWith('/instructor/analytics')
    }
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 bg-white border-r border-slate-100 flex flex-col justify-between p-4 shrink-0 z-40 select-none overflow-x-hidden">

      <div className="overflow-y-auto overflow-x-hidden pr-1">

        {/* Brand */}
        <Link
          to="/dashboard/instructor"
          className="flex items-center gap-3 px-2 py-3 mb-5 group"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>

          <div>
            <div className="font-bold text-slate-900 leading-tight">
              {title}
            </div>

            <span className="text-[10px] font-semibold text-brand-600 uppercase tracking-widest">
              Faculty Portal
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <div className="space-y-1">

          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Navigation
          </div>

          {instructorNav.map((link) => {
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

      {/* Profile */}
      <div
        className="pt-3 border-t border-slate-100 relative shrink-0"
        ref={profileMenuRef}
      >

        {showProfileMenu && (
          <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-2xl p-2 shadow-xl border border-slate-100 text-xs space-y-1 z-50">

            <div className="px-3 py-2 border-b border-slate-100">

              <span className="font-bold text-slate-900 block leading-tight">
                {userName}
              </span>

              <span className="text-[10px] text-slate-400">
                {userEmail}
              </span>

            </div>

            <Link
              to="/instructor/settings"
              onClick={() =>
                setShowProfileMenu(false)
              }
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-brand-50 hover:text-brand-600 font-semibold transition"
            >
              <Settings className="w-3.5 h-3.5" />
              Workspace Settings
            </Link>

            <div className="border-t border-slate-100 my-1" />

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

        <button
          type="button"
          onClick={() =>
            setShowProfileMenu(!showProfileMenu)
          }
          className={`w-full flex items-center justify-between p-2 rounded-2xl border transition-all text-left ${
            showProfileMenu
              ? 'bg-brand-50/60 border-brand-200'
              : 'bg-slate-50/80 border-slate-100 hover:bg-slate-100/70'
          }`}
        >

          <div className="flex items-center gap-2.5 min-w-0">

            {profileImage ? (
              <img
                src={profileImage}
                alt={userName}
                className="w-9 h-9 rounded-xl object-cover border border-white shadow-xs shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                {initials}
              </div>
            )}

            <div className="min-w-0">

              <h4 className="text-xs font-bold text-slate-800 truncate leading-tight">
                {userName}
              </h4>

              <span className="text-[10px] text-brand-600 font-semibold">
                Instructor
              </span>

            </div>
          </div>

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