import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import AdminSidebar from '../components/AdminSidebar';
import { api, fileUrl } from '../api/client';

import {
  Search,
  RefreshCw,
  MoreHorizontal,
  Trash2,
  X,
  BookOpen,
  ExternalLink
} from 'lucide-react';


export default function AdminCoursesPage() {

  // ==================================================
  // STATE
  // ==================================================

  const [courses, setCourses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('all');

  const [selectedCourse, setSelectedCourse] =
    useState(null);

  const [actionLoading, setActionLoading] =
    useState(false);


  // ==================================================
  // LOAD COURSES
  // ==================================================

  useEffect(() => {

    loadCourses();

  }, []);


  async function loadCourses() {

    try {

      setLoading(true);
      setError('');

      const response =
        await api.get('/courses');


      const courseList =
        response?.courses ||
        response?.data?.courses ||
        response?.data ||
        [];


      setCourses(
        Array.isArray(courseList)
          ? courseList
          : []
      );

    }

    catch (err) {

      console.error(
        'Failed to load courses:',
        err
      );

      setError(
        err.message ||
        'Failed to load courses.'
      );

    }

    finally {

      setLoading(false);

    }

  }


  // ==================================================
  // FILTER
  // ==================================================

  const filteredCourses =
    useMemo(() => {

      return courses.filter(
        (course) => {

          const keyword =
            search
              .trim()
              .toLowerCase();


          const matchesSearch =
            !keyword ||
            String(
              course.title || ''
            )
              .toLowerCase()
              .includes(keyword) ||

            String(
              course.description || ''
            )
              .toLowerCase()
              .includes(keyword) ||

            String(
              course.instructor_name ||
              course.instructor ||
              ''
            )
              .toLowerCase()
              .includes(keyword);


          const status =
            String(
              course.status ||
              ''
            ).toLowerCase();


          const matchesStatus =
            statusFilter === 'all' ||
            status === statusFilter;


          return (
            matchesSearch &&
            matchesStatus
          );

        }
      );

    }, [
      courses,
      search,
      statusFilter
    ]);


  // ==================================================
  // DELETE COURSE
  // ==================================================

  async function handleDeleteCourse(course) {

    const confirmed =
      window.confirm(
        `Delete "${course.title}"? This action cannot be undone.`
      );


    if (!confirmed) {
      return;
    }


    try {

      setActionLoading(true);


      await api.delete(
        `/courses/${course.course_id}`
      );


      setCourses(
        (current) =>
          current.filter(
            (item) =>
              item.course_id !==
              course.course_id
          )
      );


      setSelectedCourse(null);

    }

    catch (err) {

      alert(
        err.message ||
        'Failed to delete course.'
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

  const totalCourses =
    courses.length;


  const publishedCourses =
    courses.filter(
      (course) =>
        String(
          course.status || ''
        ).toLowerCase() ===
        'published'
    ).length;


  const pendingCourses =
    courses.filter(
      (course) => {

        const status =
          String(
            course.status || ''
          ).toLowerCase();

        return (
          status === 'pending' ||
          status === 'draft'
        );

      }
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
              Loading courses...
            </p>

          </div>

        </main>

      </div>

    );

  }


  // ==================================================
  // PAGE
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
              Course Management
            </h1>

            <p className="text-xs text-slate-500 mt-1">
              Manage courses stored in the EduPulse database.
            </p>

          </div>


          <button
            onClick={loadCourses}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
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
              onClick={loadCourses}
              className="text-xs font-bold text-rose-700 underline"
            >
              Retry
            </button>

          </div>

        )}


        {/* ==================================================
            STATS
        ================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">


          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <div className="flex items-center justify-between">

              <span className="text-xs font-semibold text-slate-500">
                Total Courses
              </span>

              <BookOpen className="w-4 h-4 text-brand-600" />

            </div>

            <p className="text-2xl font-extrabold text-slate-900 mt-2">
              {totalCourses}
            </p>

          </div>


          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <span className="text-xs font-semibold text-slate-500">
              Published
            </span>

            <p className="text-2xl font-extrabold text-emerald-600 mt-2">
              {publishedCourses}
            </p>

          </div>


          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <span className="text-xs font-semibold text-slate-500">
              Pending / Draft
            </span>

            <p className="text-2xl font-extrabold text-amber-600 mt-2">
              {pendingCourses}
            </p>

          </div>

        </div>


        {/* ==================================================
            FILTERS
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
                placeholder="Search courses or instructors..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />

            </div>


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

              <option value="published">
                Published
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="draft">
                Draft
              </option>

            </select>

          </div>

        </div>


        {/* ==================================================
            COURSE TABLE
        ================================================== */}

        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">

          <div className="p-6 border-b border-slate-100">

            <h2 className="text-sm font-bold text-slate-900">
              All Courses
            </h2>

            <p className="text-xs text-slate-400 mt-1">
              Showing {filteredCourses.length} of {courses.length} courses
            </p>

          </div>


          <div className="overflow-x-auto">

            <table className="w-full text-left text-xs">

              <thead>

                <tr className="border-b border-slate-100 bg-slate-50/50">

                  <th className="px-6 py-4 font-semibold text-slate-400">
                    Course
                  </th>

                  <th className="px-6 py-4 font-semibold text-slate-400">
                    Instructor
                  </th>

                  <th className="px-6 py-4 font-semibold text-slate-400">
                    Category
                  </th>

                  <th className="px-6 py-4 font-semibold text-slate-400">
                    Status
                  </th>

                  <th className="px-6 py-4 font-semibold text-slate-400">
                    Created
                  </th>

                  <th className="px-6 py-4 font-semibold text-slate-400 text-right">
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-50">

                {filteredCourses.length === 0 ? (

                  <tr>

                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center"
                    >

                      <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />

                      <p className="text-sm font-semibold text-slate-500 mt-3">
                        No courses found
                      </p>

                      <p className="text-xs text-slate-400 mt-1">
                        Try changing your search or filter.
                      </p>

                    </td>

                  </tr>

                ) : (

                  filteredCourses.map(
                    (course) => (

                      <tr
                        key={course.course_id}
                        className="hover:bg-slate-50/70 transition"
                      >


                        {/* COURSE */}

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-3">

                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">

                              {course.thumbnail ? (

                                <img
                                  src={fileUrl(
                                    course.thumbnail
                                  )}
                                  alt={course.title}
                                  className="w-full h-full object-cover"
                                />

                              ) : (

                                <div className="w-full h-full flex items-center justify-center">

                                  <BookOpen className="w-5 h-5 text-slate-300" />

                                </div>

                              )}

                            </div>


                            <div className="min-w-[180px]">

                              <p className="font-bold text-slate-800 line-clamp-1">
                                {course.title ||
                                  'Untitled Course'}
                              </p>

                              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                                {course.description ||
                                  'No description'}
                              </p>

                            </div>

                          </div>

                        </td>


                        {/* INSTRUCTOR */}

                        <td className="px-6 py-4 text-slate-600">

                          {course.instructor_name ||
                            course.instructor ||
                            '—'}

                        </td>


                        {/* CATEGORY */}

                        <td className="px-6 py-4">

                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold">

                            {course.category_name ||
                              course.category ||
                              'Uncategorized'}

                          </span>

                        </td>


                        {/* STATUS */}

                        <td className="px-6 py-4">

                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize ${
                              String(
                                course.status || ''
                              ).toLowerCase() ===
                              'published'
                                ? 'bg-emerald-50 text-emerald-700'
                                : String(
                                    course.status || ''
                                  ).toLowerCase() ===
                                  'pending'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {course.status ||
                              'draft'}
                          </span>

                        </td>


                        {/* CREATED */}

                        <td className="px-6 py-4 text-slate-400">

                          {formatDate(
                            course.created_at
                          )}

                        </td>


                        {/* ACTION */}

                        <td className="px-6 py-4 text-right">

                          <button
                            onClick={() =>
                              setSelectedCourse(
                                course
                              )
                            }
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                          >

                            <MoreHorizontal className="w-4 h-4" />

                          </button>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>


        {/* ==================================================
            ACTION MODAL
        ================================================== */}

        {selectedCourse && (

          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">

            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6">


              <div className="flex justify-between items-start">

                <div>

                  <h3 className="text-lg font-extrabold text-slate-900">
                    Course Actions
                  </h3>

                  <p className="text-xs text-slate-400 mt-1">
                    {selectedCourse.title}
                  </p>

                </div>


                <button
                  onClick={() =>
                    setSelectedCourse(
                      null
                    )
                  }
                  className="p-2 rounded-xl hover:bg-slate-100"
                >

                  <X className="w-4 h-4 text-slate-500" />

                </button>

              </div>


              <div className="space-y-3 mt-6">


                {/* VIEW */}

                <a
                  href={`/courses/${selectedCourse.course_id}`}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border border-blue-100 bg-blue-50 hover:bg-blue-100 transition"
                >

                  <ExternalLink className="w-5 h-5 text-blue-600" />

                  <div>

                    <p className="text-sm font-bold text-slate-800">
                      View Course
                    </p>

                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Open the course page.
                    </p>

                  </div>

                </a>


                {/* DELETE */}

                <button
                  disabled={actionLoading}
                  onClick={() =>
                    handleDeleteCourse(
                      selectedCourse
                    )
                  }
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border border-rose-100 bg-rose-50 hover:bg-rose-100 text-left transition"
                >

                  <Trash2 className="w-5 h-5 text-rose-600" />

                  <div>

                    <p className="text-sm font-bold text-rose-700">
                      Delete Course
                    </p>

                    <p className="text-[11px] text-rose-500 mt-0.5">
                      Permanently remove this course.
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