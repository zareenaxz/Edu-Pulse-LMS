import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { api } from '../api/client';

import {
  Users,
  BookOpen,
  Clock,
  Check,
  X,
  Search,
  Bell,
  ExternalLink,
  MoreHorizontal
} from 'lucide-react';


export default function AdminDashboard() {

  // ==================================================
  // STATE
  // ==================================================

  const [showNotifMenu, setShowNotifMenu] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [dashboard, setDashboard] =
    useState(null);

  const [users, setUsers] =
    useState([]);

  const [candidates, setCandidates] =
    useState([]);

  const notifRef = useRef(null);


  // ==================================================
  // CLOSE NOTIFICATION MENU
  // ==================================================

  useEffect(() => {

    function handleClickOutside(event) {

      if (
        notifRef.current &&
        !notifRef.current.contains(event.target)
      ) {
        setShowNotifMenu(false);
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


  // ==================================================
  // LOAD DASHBOARD DATA
  // ==================================================

  useEffect(() => {

    loadDashboard();

  }, []);


  async function loadDashboard() {

    try {

      setLoading(true);
      setError('');


      // ----------------------------------------------
      // ADMIN ANALYTICS
      // ----------------------------------------------

      const analyticsResponse =
        await api.get('/analytics/admin');


      const analytics =
        analyticsResponse?.data ||
        analyticsResponse;


      setDashboard(analytics);


      // ----------------------------------------------
      // RECENT USERS
      // ----------------------------------------------

      const usersResponse =
        await api.get('/users');


      const usersData =
        usersResponse?.users ||
        usersResponse?.data?.users ||
        [];


      // API already sorts newest first
      setUsers(
        usersData.slice(0, 4)
      );


      // ----------------------------------------------
      // PENDING INSTRUCTOR APPLICATIONS
      // ----------------------------------------------

      const applicationsResponse =
        await api.get(
          '/instructor-applications?status=pending'
        );


      const applications =
        applicationsResponse?.applications ||
        applicationsResponse?.data?.applications ||
        [];


      setCandidates(
        applications.slice(0, 4)
      );


    } catch (err) {

      console.error(
        'Admin dashboard error:',
        err
      );

      setError(
        err.message ||
        'Failed to load dashboard data.'
      );

    } finally {

      setLoading(false);

    }

  }


  // ==================================================
  // APPROVE APPLICATION
  // ==================================================

  async function handleApproveCandidate(id) {

    try {

      await api.patch(
        `/instructor-applications/${id}/review`,
        {
          decision: 'approved'
        }
      );


      // Remove approved candidate immediately
      setCandidates((current) =>
        current.filter(
          (candidate) =>
            candidate.application_id !== id
        )
      );


      // Refresh statistics
      const response =
        await api.get(
          '/analytics/admin'
        );


      setDashboard(
        response?.data ||
        response
      );


    } catch (err) {

      alert(
        err.message ||
        'Failed to approve application.'
      );

    }

  }


  // ==================================================
  // REJECT APPLICATION
  // ==================================================

  async function handleRejectCandidate(id) {

    try {

      await api.patch(
        `/instructor-applications/${id}/review`,
        {
          decision: 'rejected'
        }
      );


      setCandidates((current) =>
        current.filter(
          (candidate) =>
            candidate.application_id !== id
        )
      );


      // Refresh statistics
      const response =
        await api.get(
          '/analytics/admin'
        );


      setDashboard(
        response?.data ||
        response
      );


    } catch (err) {

      alert(
        err.message ||
        'Failed to reject application.'
      );

    }

  }


  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {

    return (
      <div className="flex min-h-screen bg-[#F8F9FD]">

        <AdminSidebar title="LearnFlow" />

        <main className="flex-1 flex items-center justify-center">

          <div className="text-center">

            <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto" />

            <p className="mt-4 text-sm text-slate-500 font-medium">
              Loading admin dashboard...
            </p>

          </div>

        </main>

      </div>
    );

  }


  // ==================================================
  // ERROR
  // ==================================================

  if (error) {

    return (
      <div className="flex min-h-screen bg-[#F8F9FD]">

        <AdminSidebar title="LearnFlow" />

        <main className="flex-1 flex items-center justify-center p-8">

          <div className="bg-white rounded-3xl border border-rose-100 p-8 text-center max-w-md">

            <h2 className="text-lg font-bold text-slate-900">
              Unable to load dashboard
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              {error}
            </p>

            <button
              onClick={loadDashboard}
              className="mt-5 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold"
            >
              Try Again
            </button>

          </div>

        </main>

      </div>
    );

  }


  // ==================================================
  // DYNAMIC VALUES
  // ==================================================

  const totalUsers =
    Number(dashboard?.totalUsers || 0);

  const totalCourses =
    Number(dashboard?.totalCourses || 0);

  const pendingApplications =
    Number(
      dashboard?.pendingApplications || 0
    );

  const publishedCourses =
    Number(
      dashboard?.publishedCourses || 0
    );

  const pendingCourses =
    Number(
      dashboard?.pendingCourses || 0
    );


  const coursePercentage =
    totalCourses > 0
      ? Math.round(
          (publishedCourses /
            totalCourses) *
            100
        )
      : 0;


  const draftPercentage =
    totalCourses > 0
      ? Math.round(
          (pendingCourses /
            totalCourses) *
            100
        )
      : 0;


  // ==================================================
  // STATS
  // ==================================================

  const stats = [

    {
      label: 'Total Users',
      val: totalUsers.toLocaleString(),
      change: `${Number(dashboard?.totalStudents || 0).toLocaleString()} students`,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },

    {
      label: 'Active Courses',
      val: publishedCourses.toLocaleString(),
      change: `${totalCourses.toLocaleString()} total courses`,
      icon: BookOpen,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },

    {
      label: 'Pending Approvals',
      val: pendingApplications.toLocaleString(),
      change:
        pendingApplications > 0
          ? 'Requires Action'
          : 'No pending applications',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },

    {
      label: 'Total Enrollments',
      val: Number(
        dashboard?.totalEnrollments || 0
      ).toLocaleString(),
      change: `${Number(
        dashboard?.certificatesIssued || 0
      ).toLocaleString()} certificates issued`,
      icon: BookOpen,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    }

  ];


  // ==================================================
  // RENDER
  // ==================================================

  return (

    <div className="flex min-h-screen bg-[#F8F9FD]">

      <AdminSidebar title="LearnFlow" />


      <main className="flex-1 p-8 overflow-y-auto space-y-8">


        {/* ==================================================
            TOP BAR
        ================================================== */}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

          <div>

            <h1 className="text-2xl font-extrabold text-slate-900">
              Admin Executive Dashboard
            </h1>

            <p className="text-xs text-slate-500 mt-0.5">
              High-level institutional control, user metrics,
              and pending faculty verifications.
            </p>

          </div>


          <div className="flex items-center gap-4 w-full sm:w-auto">

            <div className="relative flex-1 sm:w-64">

              <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />

              <input
                type="text"
                placeholder="Search anything..."
                className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-none shadow-xs"
              />

            </div>


            {/* Notification */}

            <div
              className="relative"
              ref={notifRef}
            >

              <button
                type="button"
                onClick={() =>
                  setShowNotifMenu(
                    !showNotifMenu
                  )
                }
                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 shadow-xs relative transition"
              >

                <Bell className="w-4 h-4" />

                {pendingApplications > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-white animate-pulse" />
                )}

              </button>


              {showNotifMenu && (

                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-3xl p-4 shadow-2xl border border-slate-100 z-50">

                  <div className="flex justify-between items-center px-1 border-b border-slate-100 pb-2.5">

                    <span className="text-xs font-bold text-slate-900">
                      Admin Alerts
                    </span>

                    <Link
                      to="/admin/notifications"
                      onClick={() =>
                        setShowNotifMenu(false)
                      }
                      className="text-[11px] font-bold text-brand-600 hover:underline"
                    >
                      View All
                    </Link>

                  </div>


                  <div className="space-y-2 max-h-64 overflow-y-auto mt-3">

                    {pendingApplications > 0 ? (

                      <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100">

                        <div className="flex justify-between text-xs font-bold text-slate-800">

                          <span>
                            Instructor Applications
                          </span>

                          <span className="text-[10px] text-amber-600">
                            Action Needed
                          </span>

                        </div>

                        <p className="text-[11px] text-slate-600 mt-1">
                          {pendingApplications} instructor application
                          {pendingApplications !== 1 ? 's' : ''} waiting
                          for review.
                        </p>

                      </div>

                    ) : (

                      <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">

                        <p className="text-[11px] text-emerald-700 font-semibold">
                          No pending instructor applications.
                        </p>

                      </div>

                    )}

                  </div>


                  <Link
                    to="/admin/notifications"
                    onClick={() =>
                      setShowNotifMenu(false)
                    }
                    className="block text-center py-2 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-xl text-xs font-bold transition mt-3"
                  >
                    Open Notification Center →
                  </Link>

                </div>

              )}

            </div>


            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              SA
            </div>

          </div>

        </div>


        {/* ==================================================
            METRIC CARDS
        ================================================== */}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {stats.map((s) => {

            const Icon = s.icon;

            return (

              <div
                key={s.label}
                className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-2 hover:shadow-md transition"
              >

                <div className="flex justify-between items-center">

                  <span className="text-xs font-semibold text-slate-500">
                    {s.label}
                  </span>

                  <div
                    className={`w-8 h-8 rounded-xl ${s.bg} ${s.color} flex items-center justify-center`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                </div>

                <div className="text-2xl font-extrabold text-slate-900">
                  {s.val}
                </div>

                <div className="text-[11px] font-semibold text-emerald-600">
                  {s.change}
                </div>

              </div>

            );

          })}

        </div>


        {/* ==================================================
            APPROVALS + COURSE STATUS
        ================================================== */}

        <div className="grid lg:grid-cols-12 gap-8 items-start">


          {/* PENDING APPLICATIONS */}

          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">

            <div className="flex justify-between items-center">

              <div>

                <h3 className="font-bold text-slate-900 text-sm">
                  Pending Instructor Approvals
                </h3>

                <p className="text-xs text-slate-400">
                  Applications submitted for teaching privileges
                </p>

              </div>

              <Link
                to="/admin/instructors"
                className="text-xs font-bold text-brand-600 hover:underline"
              >
                View All Approvals →
              </Link>

            </div>


            <div className="space-y-3">

              {candidates.length === 0 ? (

                <div className="py-8 text-center text-sm text-slate-400">
                  No pending instructor applications.
                </div>

              ) : (

                candidates.map((c) => (

                  <div
                    key={c.application_id}
                    className="p-4 rounded-2xl border border-slate-100 bg-[#FBFBFE] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >

                    <div>

                      <div className="flex items-center gap-2">

                        <span className="font-bold text-slate-800 text-xs">
                          {c.name || c.user_name || 'Unknown'}
                        </span>

                        {c.resume_url && (

                          <a
                            href={c.resume_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded font-bold hover:underline flex items-center gap-1"
                          >
                            Resume
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>

                        )}

                      </div>

                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {c.email || c.user_email || 'No email'}
                      </div>

                      <div className="text-[11px] text-slate-600 font-medium mt-1">
                        Expertise:{' '}
                        {c.expertise ||
                          c.qualification ||
                          'Not provided'}
                      </div>

                    </div>


                    <div className="flex items-center gap-2 self-end sm:self-center">

                      <button
                        onClick={() =>
                          handleApproveCandidate(
                            c.application_id
                          )
                        }
                        className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 shadow-xs transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </button>


                      <button
                        onClick={() =>
                          handleRejectCandidate(
                            c.application_id
                          )
                        }
                        className="px-3.5 py-1.5 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-50 flex items-center gap-1 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>

                    </div>

                  </div>

                ))

              )}

            </div>

          </div>


          {/* COURSE STATUS */}

          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4 flex flex-col justify-between">

            <div>

              <h3 className="font-bold text-slate-900 text-sm">
                Course Status Distribution
              </h3>

              <p className="text-xs text-slate-400">
                Published vs pending courses
              </p>

            </div>


            <div className="flex flex-col items-center justify-center py-6">

              <div className="relative w-36 h-36 flex items-center justify-center">

                <svg
                  className="w-full h-full -rotate-90"
                  viewBox="0 0 36 36"
                >

                  <path
                    className="text-slate-100"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />


                  <path
                    className="text-brand-600"
                    strokeDasharray={`${coursePercentage}, 100`}
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />


                  <path
                    className="text-emerald-500"
                    strokeDasharray={`${draftPercentage}, 100`}
                    strokeDashoffset={`-${coursePercentage}`}
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />

                </svg>


                <div className="absolute text-center">

                  <div className="text-xl font-extrabold text-slate-900">
                    {totalCourses}
                  </div>

                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Total Courses
                  </span>

                </div>

              </div>

            </div>


            <div className="flex justify-around text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100">

              <span className="flex items-center gap-2">

                <span className="w-2.5 h-2.5 rounded-full bg-brand-600" />

                Published ({publishedCourses})

              </span>


              <span className="flex items-center gap-2">

                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />

                Pending ({pendingCourses})

              </span>

            </div>

          </div>

        </div>


        {/* ==================================================
            USER MANAGEMENT
        ================================================== */}

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">

          <div className="flex justify-between items-center">

            <div>

              <h3 className="font-bold text-slate-900 text-sm">
                Platform User Management
              </h3>

              <p className="text-xs text-slate-400">
                Recent account registrations and current activity standing
              </p>

            </div>

            <Link
              to="/admin/users"
              className="text-xs font-bold text-brand-600 hover:underline"
            >
              Manage All Users →
            </Link>

          </div>


          <div className="overflow-x-auto">

            <table className="w-full text-left text-xs">

              <thead>

                <tr className="border-b border-slate-100 text-slate-400 font-semibold">

                  <th className="pb-3">
                    Name
                  </th>

                  <th className="pb-3">
                    Email
                  </th>

                  <th className="pb-3">
                    Role
                  </th>

                  <th className="pb-3">
                    Status
                  </th>

                  <th className="pb-3">
                    Joined Date
                  </th>

                  <th className="pb-3 text-right">
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-50">

                {users.length === 0 ? (

                  <tr>

                    <td
                      colSpan="6"
                      className="py-8 text-center text-slate-400"
                    >
                      No users found.
                    </td>

                  </tr>

                ) : (

                  users.map((u) => (

                    <tr
                      key={u.user_id}
                      className="hover:bg-slate-50/70 transition"
                    >

                      <td className="py-3.5 font-bold text-slate-800">
                        {u.name}
                      </td>

                      <td className="py-3.5 text-slate-500">
                        {u.email}
                      </td>


                      <td className="py-3.5">

                        <span
                          className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] ${
                            u.role === 'instructor'
                              ? 'bg-purple-50 text-purple-600 border border-purple-100'
                              : u.role === 'admin'
                              ? 'bg-amber-50 text-amber-600 border border-amber-100'
                              : 'bg-blue-50 text-blue-600 border border-blue-100'
                          }`}
                        >
                          {u.role}
                        </span>

                      </td>


                      <td className="py-3.5">

                        <span
                          className={`font-bold ${
                            u.status === 'active'
                              ? 'text-emerald-600'
                              : 'text-rose-500'
                          }`}
                        >
                          {u.status}
                        </span>

                      </td>


                      <td className="py-3.5 text-slate-400">

                        {u.created_at
                          ? new Date(
                              u.created_at
                            ).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: '2-digit',
                                year: 'numeric'
                              }
                            )
                          : '—'}

                      </td>


                      <td className="py-3.5 text-right">

                        <Link
                          to={`/admin/users/${u.user_id}`}
                          className="text-slate-400 hover:text-slate-700 p-1 inline-block"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Link>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>

      </main>

    </div>

  );

}