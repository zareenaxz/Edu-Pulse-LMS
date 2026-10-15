import React, { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { api } from '../api/client';

import {
  Search,
  MoreHorizontal,
  UserCheck,
  UserX,
  Trash2,
  RefreshCw,
  Users,
  X
} from 'lucide-react';


export default function AdminUsersPage() {

  // ==================================================
  // STATE
  // ==================================================

  const [users, setUsers] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [roleFilter, setRoleFilter] =
    useState('all');

  const [statusFilter, setStatusFilter] =
    useState('all');

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [actionLoading, setActionLoading] =
    useState(false);


  // ==================================================
  // LOAD USERS
  // ==================================================

  useEffect(() => {

    loadUsers();

  }, []);


  async function loadUsers() {

    try {

      setLoading(true);
      setError('');

      const response =
        await api.get('/users');


      const userList =
        response?.users ||
        response?.data?.users ||
        response?.data ||
        [];


      setUsers(
        Array.isArray(userList)
          ? userList
          : []
      );

    }

    catch (err) {

      console.error(
        'Failed to load users:',
        err
      );

      setError(
        err.message ||
        'Failed to load users.'
      );

    }

    finally {

      setLoading(false);

    }

  }


  // ==================================================
  // FILTER USERS
  // ==================================================

  const filteredUsers = useMemo(() => {

    return users.filter((user) => {

      const keyword =
        search.trim().toLowerCase();


      const matchesSearch =
        !keyword ||
        String(user.name || '')
          .toLowerCase()
          .includes(keyword) ||
        String(user.email || '')
          .toLowerCase()
          .includes(keyword);


      const matchesRole =
        roleFilter === 'all' ||
        user.role === roleFilter;


      const matchesStatus =
        statusFilter === 'all' ||
        user.status === statusFilter;


      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );

    });

  }, [
    users,
    search,
    roleFilter,
    statusFilter
  ]);


  // ==================================================
  // BLOCK / UNBLOCK
  // ==================================================

  async function handleToggleBlock(user) {

    const isBlocked =
      user.status === 'blocked';


    const action =
      isBlocked
        ? 'unblock'
        : 'block';


    const confirmed =
      window.confirm(
        `${action === 'block'
          ? 'Block'
          : 'Unblock'} ${user.name}?`
      );


    if (!confirmed) {
      return;
    }


    try {

      setActionLoading(true);


      const response =
        await api.patch(
          `/users/${user.user_id}/block`,
          {
            blocked: !isBlocked
          }
        );


      const updatedUser =
        response?.user ||
        response?.data?.user;


      setUsers((current) =>
        current.map((item) => {

          if (
            item.user_id !==
            user.user_id
          ) {
            return item;
          }


          return {
            ...item,

            status:
              updatedUser?.status ||
              (!isBlocked
                ? 'blocked'
                : 'active')
          };

        })
      );


      setSelectedUser(null);

    }

    catch (err) {

      alert(
        err.message ||
        'Failed to update user status.'
      );

    }

    finally {

      setActionLoading(false);

    }

  }


  // ==================================================
  // DELETE USER
  // ==================================================

  async function handleDeleteUser(user) {

    const confirmed =
      window.confirm(
        `Delete ${user.name}? This action cannot be undone.`
      );


    if (!confirmed) {
      return;
    }


    try {

      setActionLoading(true);


      await api.delete(
        `/users/${user.user_id}`
      );


      setUsers((current) =>
        current.filter(
          (item) =>
            item.user_id !==
            user.user_id
        )
      );


      setSelectedUser(null);

    }

    catch (err) {

      alert(
        err.message ||
        'Failed to delete user.'
      );

    }

    finally {

      setActionLoading(false);

    }

  }


  // ==================================================
  // DATE FORMAT
  // ==================================================

  function formatDate(date) {

    if (!date) {
      return '—';
    }


    const parsed =
      new Date(date);


    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return '—';
    }


    return parsed.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      }
    );

  }


  // ==================================================
  // STATS
  // ==================================================

  const totalUsers =
    users.length;


  const students =
    users.filter(
      (user) =>
        user.role === 'student'
    ).length;


  const instructors =
    users.filter(
      (user) =>
        user.role === 'instructor'
    ).length;


  const admins =
    users.filter(
      (user) =>
        user.role === 'admin'
    ).length;


  const blockedUsers =
    users.filter(
      (user) =>
        user.status === 'blocked'
    ).length;


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

            <p className="mt-4 text-sm text-slate-500">
              Loading users...
            </p>

          </div>

        </main>

      </div>

    );

  }


  // ==================================================
  // RENDER
  // ==================================================

  return (

    <div className="flex min-h-screen bg-[#F8F9FD]">

      <AdminSidebar title="LearnFlow" />


      <main className="flex-1 p-8 overflow-y-auto">


        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">

          <div>

            <h1 className="text-2xl font-extrabold text-slate-900">
              User Management
            </h1>

            <p className="text-xs text-slate-500 mt-1">
              Manage all registered EduPulse users.
            </p>

          </div>


          <button
            onClick={loadUsers}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >

            <RefreshCw className="w-4 h-4" />

            Refresh

          </button>

        </div>


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (

          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between">

            <p className="text-xs font-semibold text-rose-600">
              {error}
            </p>

            <button
              onClick={loadUsers}
              className="text-xs font-bold text-rose-700 underline"
            >
              Retry
            </button>

          </div>

        )}


        {/* ==================================================
            STATS
        ================================================== */}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">


          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <div className="flex items-center justify-between">

              <span className="text-xs text-slate-500 font-semibold">
                Total Users
              </span>

              <Users className="w-4 h-4 text-brand-600" />

            </div>

            <p className="text-2xl font-extrabold text-slate-900 mt-2">
              {totalUsers}
            </p>

          </div>


          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <span className="text-xs text-slate-500 font-semibold">
              Students
            </span>

            <p className="text-2xl font-extrabold text-blue-600 mt-2">
              {students}
            </p>

          </div>


          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <span className="text-xs text-slate-500 font-semibold">
              Instructors
            </span>

            <p className="text-2xl font-extrabold text-purple-600 mt-2">
              {instructors}
            </p>

          </div>


          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <span className="text-xs text-slate-500 font-semibold">
              Admins
            </span>

            <p className="text-2xl font-extrabold text-amber-600 mt-2">
              {admins}
            </p>

          </div>


          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <span className="text-xs text-slate-500 font-semibold">
              Blocked
            </span>

            <p className="text-2xl font-extrabold text-rose-600 mt-2">
              {blockedUsers}
            </p>

          </div>


        </div>


        {/* ==================================================
            FILTER BAR
        ================================================== */}

        <div className="bg-white rounded-3xl border border-slate-100 p-5 mb-6">

          <div className="flex flex-col lg:flex-row gap-3">


            {/* SEARCH */}

            <div className="relative flex-1">

              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />

            </div>


            {/* ROLE */}

            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(
                  e.target.value
                )
              }
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none"
            >

              <option value="all">
                All Roles
              </option>

              <option value="student">
                Students
              </option>

              <option value="instructor">
                Instructors
              </option>

              <option value="admin">
                Admins
              </option>

            </select>


            {/* STATUS */}

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none"
            >

              <option value="all">
                All Status
              </option>

              <option value="active">
                Active
              </option>

              <option value="blocked">
                Blocked
              </option>

            </select>

          </div>

        </div>


        {/* ==================================================
            USER TABLE
        ================================================== */}

        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">

          <div className="p-6 border-b border-slate-100 flex justify-between items-center">

            <div>

              <h2 className="text-sm font-bold text-slate-900">
                All Users
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Showing {filteredUsers.length} of {users.length} users
              </p>

            </div>

          </div>


          <div className="overflow-x-auto">

            <table className="w-full text-left text-xs">

              <thead>

                <tr className="border-b border-slate-100 bg-slate-50/50">

                  <th className="px-6 py-4 font-semibold text-slate-400">
                    User
                  </th>

                  <th className="px-6 py-4 font-semibold text-slate-400">
                    Role
                  </th>

                  <th className="px-6 py-4 font-semibold text-slate-400">
                    Status
                  </th>

                  <th className="px-6 py-4 font-semibold text-slate-400">
                    Joined
                  </th>

                  <th className="px-6 py-4 font-semibold text-slate-400 text-right">
                    Action
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-50">

                {filteredUsers.length === 0 ? (

                  <tr>

                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center"
                    >

                      <Users className="w-8 h-8 text-slate-300 mx-auto" />

                      <p className="text-sm font-semibold text-slate-500 mt-3">
                        No users found
                      </p>

                      <p className="text-xs text-slate-400 mt-1">
                        Try changing your search or filters.
                      </p>

                    </td>

                  </tr>

                ) : (

                  filteredUsers.map((user) => (

                    <tr
                      key={user.user_id}
                      className="hover:bg-slate-50/70 transition"
                    >


                      {/* USER */}

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-3">

                          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">

                            {String(
                              user.name || 'U'
                            )
                              .charAt(0)
                              .toUpperCase()}

                          </div>


                          <div>

                            <p className="font-bold text-slate-800">
                              {user.name || 'Unknown User'}
                            </p>

                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {user.email}
                            </p>

                          </div>

                        </div>

                      </td>


                      {/* ROLE */}

                      <td className="px-6 py-4">

                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize ${
                            user.role === 'admin'
                              ? 'bg-amber-50 text-amber-700'
                              : user.role === 'instructor'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {user.role}
                        </span>

                      </td>


                      {/* STATUS */}

                      <td className="px-6 py-4">

                        <span
                          className={`inline-flex items-center gap-1.5 font-bold ${
                            user.status === 'blocked'
                              ? 'text-rose-600'
                              : 'text-emerald-600'
                          }`}
                        >

                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.status === 'blocked'
                                ? 'bg-rose-500'
                                : 'bg-emerald-500'
                            }`}
                          />

                          {user.status || 'active'}

                        </span>

                      </td>


                      {/* DATE */}

                      <td className="px-6 py-4 text-slate-400">

                        {formatDate(
                          user.created_at
                        )}

                      </td>


                      {/* ACTION */}

                      <td className="px-6 py-4 text-right">

                        <button
                          onClick={() =>
                            setSelectedUser(
                              user
                            )
                          }
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                        >

                          <MoreHorizontal className="w-4 h-4" />

                        </button>

                      </td>


                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>


        {/* ==================================================
            ACTION MODAL
        ================================================== */}

        {selectedUser && (

          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">

            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6">


              <div className="flex justify-between items-start">

                <div>

                  <h3 className="text-lg font-extrabold text-slate-900">
                    User Actions
                  </h3>

                  <p className="text-xs text-slate-400 mt-1">
                    {selectedUser.name}
                  </p>

                </div>


                <button
                  onClick={() =>
                    setSelectedUser(null)
                  }
                  className="p-2 rounded-xl hover:bg-slate-100"
                >

                  <X className="w-4 h-4 text-slate-500" />

                </button>

              </div>


              <div className="space-y-3 mt-6">


                {/* BLOCK / UNBLOCK */}

                <button
                  disabled={actionLoading}
                  onClick={() =>
                    handleToggleBlock(
                      selectedUser
                    )
                  }
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition ${
                    selectedUser.status === 'blocked'
                      ? 'border-emerald-100 bg-emerald-50 hover:bg-emerald-100'
                      : 'border-amber-100 bg-amber-50 hover:bg-amber-100'
                  }`}
                >

                  {selectedUser.status === 'blocked' ? (
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <UserX className="w-5 h-5 text-amber-600" />
                  )}

                  <div>

                    <p className="text-sm font-bold text-slate-800">

                      {selectedUser.status === 'blocked'
                        ? 'Unblock User'
                        : 'Block User'}

                    </p>

                    <p className="text-[11px] text-slate-500 mt-0.5">

                      {selectedUser.status === 'blocked'
                        ? 'Allow this user to access the platform again.'
                        : 'Prevent this user from accessing the platform.'}

                    </p>

                  </div>

                </button>


                {/* DELETE */}

                <button
                  disabled={actionLoading}
                  onClick={() =>
                    handleDeleteUser(
                      selectedUser
                    )
                  }
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border border-rose-100 bg-rose-50 hover:bg-rose-100 text-left transition"
                >

                  <Trash2 className="w-5 h-5 text-rose-600" />

                  <div>

                    <p className="text-sm font-bold text-rose-700">
                      Delete User
                    </p>

                    <p className="text-[11px] text-rose-500 mt-0.5">
                      Permanently remove this user.
                    </p>

                  </div>

                </button>


              </div>

            </div>

          </div>

        )}

      </main>

    </div>

  );

}