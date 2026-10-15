import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import { Link } from 'react-router-dom';

import DashboardSidebar
  from '../components/InstructorSidebar';

import { api } from '../api/client';

import {
  ChevronDown,
  ChevronUp,
  BookOpen,
  CheckSquare,
  Calendar,
  Plus,
  AlertCircle,
  CheckCircle2,
  Search,
  RefreshCw
} from 'lucide-react';


export default function InstructorAssignmentsHub() {

  // ============================================================
  // STATE
  // ============================================================

  const [courses, setCourses] =
    useState([]);

  const [courseAssignments, setCourseAssignments] =
    useState({});

  const [expandedCourses, setExpandedCourses] =
    useState({});

  const [searchQuery, setSearchQuery] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [refreshing, setRefreshing] =
    useState(false);


  // ============================================================
  // LOAD COURSES + ASSIGNMENTS
  // ============================================================

  const loadData = async (
    showRefresh = false
  ) => {

    try {

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');


      // ----------------------------------------------------------
      // Instructor's courses
      // ----------------------------------------------------------

      const courseResponse =
        await api.get('/courses');


      const backendCourses =
        courseResponse?.courses || [];


      // ----------------------------------------------------------
      // Load assignments for each course
      // ----------------------------------------------------------

      const assignmentResults =
        await Promise.all(
          backendCourses.map(
            async (course) => {

              try {

                const response =
                  await api.get(
                    `/assignments?course_id=${course.course_id}`
                  );


                return {
                  courseId:
                    course.course_id,

                  assignments:
                    response?.assignments || []
                };

              }

              catch (err) {

                console.error(
                  `Failed to load assignments for course ${course.course_id}:`,
                  err
                );


                return {
                  courseId:
                    course.course_id,

                  assignments: []
                };

              }

            }
          )
        );


      const assignmentMap = {};


      assignmentResults.forEach(
        (item) => {

          assignmentMap[
            item.courseId
          ] =
            item.assignments;

        }
      );


      setCourses(
        backendCourses
      );


      setCourseAssignments(
        assignmentMap
      );


      // ----------------------------------------------------------
      // Expand first course automatically
      // ----------------------------------------------------------

      if (
        backendCourses.length > 0
      ) {

        setExpandedCourses(
          (current) => {

            const next = {
              ...current
            };


            backendCourses.forEach(
              (course, index) => {

                if (
                  next[
                    course.course_id
                  ] === undefined
                ) {

                  next[
                    course.course_id
                  ] =
                    index === 0;

                }

              }
            );


            return next;

          }
        );

      }

    }

    catch (err) {

      console.error(
        'Failed to load instructor assignments:',
        err
      );


      setError(
        err.message ||
        'Unable to load assignments.'
      );

    }

    finally {

      setLoading(false);
      setRefreshing(false);

    }

  };


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    loadData();

  }, []);


  // ============================================================
  // TOGGLE COURSE
  // ============================================================

  const toggleCourse = (
    courseId
  ) => {

    setExpandedCourses(
      (current) => ({
        ...current,

        [courseId]:
          !current[courseId]
      })
    );

  };


  // ============================================================
  // SEARCH
  // ============================================================

  const filteredCourses =
    useMemo(() => {

      const keyword =
        searchQuery
          .trim()
          .toLowerCase();


      if (!keyword) {
        return courses;
      }


      return courses.filter(
        (course) => {

          const title =
            String(
              course.title || ''
            ).toLowerCase();


          const code =
            String(
              course.course_code || ''
            ).toLowerCase();


          const department =
            String(
              course.department || ''
            ).toLowerCase();


          return (
            title.includes(keyword) ||
            code.includes(keyword) ||
            department.includes(keyword)
          );

        }
      );

    }, [
      courses,
      searchQuery
    ]);


  // ============================================================
  // GLOBAL STATS
  // ============================================================

  const allAssignments =
    Object.values(
      courseAssignments
    ).flat();


  const totalPending =
    allAssignments.reduce(
      (total, assignment) =>
        total +
        Number(
          assignment.pending_count || 0
        ),
      0
    );


  const totalSubmitted =
    allAssignments.reduce(
      (total, assignment) =>
        total +
        Number(
          assignment.submissions_count || 0
        ),
      0
    );


  const totalGraded =
    Math.max(
      0,
      totalSubmitted -
      totalPending
    );


  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (
    value
  ) => {

    if (!value) {
      return 'No deadline';
    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return value;

    }


    return date.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      }
    );

  };


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {

    return (

      <div className="flex min-h-screen bg-[#F8F9FD]">

        <DashboardSidebar
          role="instructor"
          title="EduPulse"
        />


        <main className="flex-1 flex items-center justify-center">

          <div className="text-center">

            <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mx-auto" />

            <p className="text-sm font-semibold text-slate-600 mt-3">
              Loading assignments...
            </p>

          </div>

        </main>

      </div>

    );

  }


  // ============================================================
  // PAGE
  // ============================================================

  return (

    <div className="flex min-h-screen bg-[#F8F9FD]">

      <DashboardSidebar
        role="instructor"
        title="EduPulse"
      />


      <main className="flex-1 p-8 overflow-y-auto space-y-8">


        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          <div>

            <h1 className="text-2xl font-extrabold text-slate-900">
              Assignments & Evaluation Desk
            </h1>

            <p className="text-xs text-slate-500 mt-1">
              View your courses, assignments, submissions and grading status.
            </p>

          </div>


          <div className="flex gap-2">

            <button
              type="button"
              onClick={() =>
                loadData(true)
              }
              disabled={refreshing}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center gap-2 disabled:opacity-60"
            >

              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  refreshing
                    ? 'animate-spin'
                    : ''
                }`}
              />

              Refresh

            </button>


            <Link
              to="/instructor/create-assignment"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 shadow-md shadow-brand-500/20"
            >

              <Plus className="w-4 h-4" />

              Create Assignment

            </Link>

          </div>

        </div>


        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (

          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">

            <p className="text-xs font-semibold text-rose-600">
              {error}
            </p>

          </div>

        )}


        {/* ======================================================
            GLOBAL STATS
        ====================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">


          <div className="bg-white p-5 rounded-2xl border border-slate-100">

            <p className="text-xs font-semibold text-slate-500">
              My Courses
            </p>

            <p className="text-2xl font-extrabold text-slate-900 mt-2">
              {courses.length}
            </p>

          </div>


          <div className="bg-white p-5 rounded-2xl border border-slate-100">

            <p className="text-xs font-semibold text-slate-500">
              Student Submissions
            </p>

            <p className="text-2xl font-extrabold text-brand-600 mt-2">
              {totalSubmitted}
            </p>

          </div>


          <div className="bg-white p-5 rounded-2xl border border-slate-100">

            <p className="text-xs font-semibold text-slate-500">
              Needs Grading
            </p>

            <p className="text-2xl font-extrabold text-amber-600 mt-2">
              {totalPending}
            </p>

          </div>

        </div>


        {/* ======================================================
            SEARCH
        ====================================================== */}

        <div className="bg-white p-4 rounded-2xl border border-slate-100">

          <div className="relative max-w-md">

            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />

            <input
              type="text"
              placeholder="Search course name, code or department..."
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(
                  e.target.value
                )
              }
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-brand-500"
            />

          </div>

        </div>


        {/* ======================================================
            COURSES
        ====================================================== */}

        <div className="space-y-4">


          {filteredCourses.length === 0 && (

            <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center">

              <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />

              <p className="text-sm font-bold text-slate-600 mt-3">
                No courses found
              </p>

            </div>

          )}


          {filteredCourses.map(
            (course) => {

              const assignments =
                courseAssignments[
                  course.course_id
                ] || [];


              const pending =
                assignments.reduce(
                  (sum, assignment) =>
                    sum +
                    Number(
                      assignment.pending_count ||
                      0
                    ),
                  0
                );


              const isExpanded =
                Boolean(
                  expandedCourses[
                    course.course_id
                  ]
                );


              return (

                <div
                  key={
                    course.course_id
                  }
                  className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden"
                >


                  {/* COURSE HEADER */}

                  <button
                    type="button"
                    onClick={() =>
                      toggleCourse(
                        course.course_id
                      )
                    }
                    className="w-full p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left hover:bg-slate-50/70 transition"
                  >

                    <div className="flex items-center gap-4">

                      <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">

                        <BookOpen className="w-6 h-6" />

                      </div>


                      <div>

                        <div className="flex flex-wrap items-center gap-2">

                          {course.course_code && (

                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded">

                              {course.course_code}

                            </span>

                          )}


                          {course.department && (

                            <span className="text-xs text-slate-400">
                              {course.department}
                            </span>

                          )}

                        </div>


                        <h3 className="text-base font-bold text-slate-900 mt-1">

                          {course.title}

                        </h3>


                        <p className="text-[11px] text-slate-400 mt-1">

                          {Number(
                            course.students || 0
                          )}{' '}
                          enrolled students ·{' '}

                          {assignments.length}{' '}
                          assignments

                        </p>

                      </div>

                    </div>


                    <div className="flex items-center gap-3">

                      {pending > 0 ? (

                        <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-600 rounded-full text-[11px] font-bold flex items-center gap-1.5">

                          <AlertCircle className="w-3.5 h-3.5" />

                          {pending} Pending

                        </span>

                      ) : (

                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-bold flex items-center gap-1.5">

                          <CheckCircle2 className="w-3.5 h-3.5" />

                          All Graded

                        </span>

                      )}


                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">

                        {isExpanded
                          ? <ChevronUp className="w-4 h-4" />
                          : <ChevronDown className="w-4 h-4" />}

                      </div>

                    </div>

                  </button>


                  {/* ASSIGNMENTS */}

                  {isExpanded && (

                    <div className="border-t border-slate-100 bg-[#FBFBFE] p-6 space-y-3">


                      {assignments.length === 0 ? (

                        <div className="py-8 text-center">

                          <CheckSquare className="w-7 h-7 text-slate-300 mx-auto" />

                          <p className="text-xs font-semibold text-slate-500 mt-2">
                            No assignments created for this course yet.
                          </p>

                          <Link
                            to={`/instructor/create-assignment?courseId=${course.course_id}`}
                            className="inline-block mt-3 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold"
                          >
                            Create First Assignment
                          </Link>

                        </div>

                      ) : (

                        assignments.map(
                          (assignment) => {

                            const submitted =
                              Number(
                                assignment.submissions_count ||
                                0
                              );


                            const pendingCount =
                              Number(
                                assignment.pending_count ||
                                0
                              );


                            const graded =
                              Math.max(
                                0,
                                submitted -
                                pendingCount
                              );


                            return (

                              <div
                                key={
                                  assignment.assignment_id
                                }
                                className="p-4 bg-white rounded-2xl border border-slate-200/70 hover:border-brand-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                              >


                                <div className="flex items-center gap-3.5">

                                  <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                      pendingCount > 0
                                        ? 'bg-amber-50 text-amber-600'
                                        : 'bg-brand-50 text-brand-600'
                                    }`}
                                  >

                                    <CheckSquare className="w-5 h-5" />

                                  </div>


                                  <div>

                                    <h4 className="text-xs font-bold text-slate-900">

                                      {assignment.title}

                                    </h4>


                                    <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[11px] mt-1">

                                      <span className="flex items-center gap-1">

                                        <Calendar className="w-3 h-3" />

                                        Due{' '}

                                        {formatDate(
                                          assignment.deadline
                                        )}

                                      </span>


                                      <span>
                                        •
                                      </span>


                                      <span>
                                        {assignment.max_marks || 0} Points
                                      </span>

                                    </div>

                                  </div>

                                </div>


                                <div className="flex items-center gap-4 self-end md:self-center">

                                  <div className="text-right">

                                    <span className="text-xs font-bold text-slate-800">

                                      {graded} / {submitted} Graded

                                    </span>


                                    {pendingCount > 0 && (

                                      <p className="text-[10px] font-bold text-amber-600 mt-0.5">

                                        {pendingCount} need evaluation

                                      </p>

                                    )}

                                  </div>


                                  <Link
                                    to={`/instructor/assignments/${course.course_id}/${assignment.assignment_id}`}
                                    className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700"
                                  >

                                    Grade / Review

                                  </Link>

                                </div>

                              </div>

                            );

                          }
                        )

                      )}

                    </div>

                  )}

                </div>

              );

            }
          )}

        </div>

      </main>

    </div>

  );

}