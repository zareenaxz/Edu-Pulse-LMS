import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import DashboardSidebar
  from '../components/InstructorSidebar';

import { api } from '../api/client';

import {
  BarChart3,
  BookOpen,
  Users,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  RefreshCw,
  AlertCircle
} from 'lucide-react';


export default function InstructorAnalyticsPage() {

  // ============================================================
  // STATE
  // ============================================================

  const [courses, setCourses] =
    useState([]);

  const [courseData, setCourseData] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');


  // ============================================================
  // LOAD ANALYTICS DATA
  // ============================================================

  const loadAnalytics = async (
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
      // 1. LOAD INSTRUCTOR COURSES
      // ----------------------------------------------------------

      const courseResponse =
        await api.get('/courses');


      const instructorCourses =
        courseResponse?.courses || [];


      setCourses(
        instructorCourses
      );


      // ----------------------------------------------------------
      // 2. LOAD ASSIGNMENTS + SUBMISSIONS
      //    FOR EVERY COURSE
      // ----------------------------------------------------------

      const detailedCourses =
        await Promise.all(

          instructorCourses.map(
            async (course) => {

              let assignments = [];


              try {

                const assignmentResponse =
                  await api.get(
                    `/assignments?course_id=${course.course_id}`
                  );


                assignments =
                  assignmentResponse?.assignments ||
                  [];

              }

              catch (assignmentError) {

                console.error(
                  `Assignment loading failed for course ${course.course_id}:`,
                  assignmentError
                );

              }


              // ------------------------------------------------
              // Load submissions for every assignment
              // ------------------------------------------------

              const assignmentsWithSubmissions =
                await Promise.all(

                  assignments.map(
                    async (assignment) => {

                      let submissions = [];


                      try {

                        const submissionResponse =
                          await api.get(
                            `/assignments/${assignment.assignment_id}/submissions`
                          );


                        submissions =
                          submissionResponse?.submissions ||
                          [];

                      }

                      catch (submissionError) {

                        console.error(
                          `Submission loading failed for assignment ${assignment.assignment_id}:`,
                          submissionError
                        );

                      }


                      return {

                        ...assignment,

                        submissions

                      };

                    }
                  )

                );


              return {

                ...course,

                assignments:
                  assignmentsWithSubmissions

              };

            }
          )

        );


      setCourseData(
        detailedCourses
      );

    }

    catch (err) {

      console.error(
        'Analytics loading error:',
        err
      );


      setError(
        err.message ||
        'Unable to load instructor analytics.'
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

    loadAnalytics();

  }, []);


  // ============================================================
  // BUILD GLOBAL SUBMISSION LIST
  // ============================================================

  const allAssignments =
    useMemo(() => {

      return courseData.flatMap(
        (course) =>
          course.assignments || []
      );

    }, [
      courseData
    ]);


  const allSubmissions =
    useMemo(() => {

      return allAssignments.flatMap(
        (assignment) => {

          return (
            assignment.submissions ||
            []
          ).map(
            (submission) => ({

              ...submission,

              assignment_id:
                assignment.assignment_id,

              assignment_title:
                assignment.title,

              max_marks:
                assignment.max_marks,

              course_id:
                assignment.course_id

            })
          );

        }
      );

    }, [
      allAssignments
    ]);


  // ============================================================
  // TOTAL STUDENTS
  // ============================================================

  const totalStudents =
    useMemo(() => {

      const studentIds =
        new Set();


      courseData.forEach(
        (course) => {

          // ----------------------------------------------
          // If backend provides students count
          // ----------------------------------------------

          if (
            course.students !== undefined &&
            course.students !== null
          ) {

            return;

          }


          (
            course.assignments || []
          ).forEach(
            (assignment) => {

              (
                assignment.submissions ||
                []
              ).forEach(
                (submission) => {

                  if (
                    submission.student_id
                  ) {

                    studentIds.add(
                      submission.student_id
                    );

                  }

                }
              );

            }
          );

        }
      );


      const backendStudentCounts =
        courseData
          .map(
            (course) =>
              Number(
                course.students
              )
          )
          .filter(
            (value) =>
              Number.isFinite(value)
          );


      if (
        backendStudentCounts.length > 0
      ) {

        return backendStudentCounts.reduce(
          (
            total,
            value
          ) =>
            total + value,
          0
        );

      }


      return studentIds.size;

    }, [
      courseData
    ]);


  // ============================================================
  // TOTAL ASSIGNMENTS
  // ============================================================

  const totalAssignments =
    allAssignments.length;


  // ============================================================
  // SUBMISSIONS
  // ============================================================

  const totalSubmissions =
    allSubmissions.length;


  // ============================================================
  // GRADED
  // ============================================================

  const gradedSubmissions =
    allSubmissions.filter(
      (submission) =>
        submission.marks !== null &&
        submission.marks !== undefined
    );


  const gradedCount =
    gradedSubmissions.length;


  const pendingCount =
    Math.max(
      0,
      totalSubmissions -
      gradedCount
    );


  // ============================================================
  // AVERAGE SCORE
  // ============================================================

  const averageScore =
    useMemo(() => {

      if (
        gradedSubmissions.length === 0
      ) {

        return 0;

      }


      let totalPercentage = 0;


      gradedSubmissions.forEach(
        (submission) => {

          const marks =
            Number(
              submission.marks
            );


          const maxMarks =
            Number(
              submission.max_marks ||
              100
            );


          if (
            maxMarks > 0
          ) {

            totalPercentage +=
              (
                marks /
                maxMarks
              ) *
              100;

          }

        }
      );


      return (
        totalPercentage /
        gradedSubmissions.length
      );

    }, [
      gradedSubmissions
    ]);


  // ============================================================
  // GRADING RATE
  // ============================================================

  const gradingRate =
    totalSubmissions > 0
      ? (
          gradedCount /
          totalSubmissions
        ) *
        100
      : 0;


  // ============================================================
  // COURSE ANALYTICS
  // ============================================================

  const courseAnalytics =
    useMemo(() => {

      return courseData.map(
        (course) => {

          const assignments =
            course.assignments ||
            [];


          const submissions =
            assignments.flatMap(
              (assignment) =>
                (
                  assignment.submissions ||
                  []
                ).map(
                  (submission) => ({

                    ...submission,

                    max_marks:
                      assignment.max_marks

                  })
                )
            );


          const graded =
            submissions.filter(
              (submission) =>
                submission.marks !== null &&
                submission.marks !== undefined
            );


          let average = 0;


          if (
            graded.length > 0
          ) {

            const total =
              graded.reduce(
                (
                  sum,
                  submission
                ) => {

                  const marks =
                    Number(
                      submission.marks
                    );


                  const max =
                    Number(
                      submission.max_marks ||
                      100
                    );


                  if (
                    max <= 0
                  ) {

                    return sum;

                  }


                  return (
                    sum +
                    (
                      marks /
                      max
                    ) *
                    100
                  );

                },
                0
              );


            average =
              total /
              graded.length;

          }


          const pending =
            submissions.length -
            graded.length;


          return {

            ...course,

            assignmentCount:
              assignments.length,

            submissionCount:
              submissions.length,

            gradedCount:
              graded.length,

            pendingCount:
              Math.max(
                0,
                pending
              ),

            averageScore:
              average

          };

        }
      );

    }, [
      courseData
    ]);


  // ============================================================
  // ASSIGNMENT ANALYTICS
  // ============================================================

  const assignmentAnalytics =
    useMemo(() => {

      return allAssignments.map(
        (assignment) => {

          const submissions =
            assignment.submissions ||
            [];


          const graded =
            submissions.filter(
              (submission) =>
                submission.marks !== null &&
                submission.marks !== undefined
            );


          let average = 0;


          if (
            graded.length > 0
          ) {

            const total =
              graded.reduce(
                (
                  sum,
                  submission
                ) => {

                  const marks =
                    Number(
                      submission.marks
                    );


                  const max =
                    Number(
                      assignment.max_marks ||
                      100
                    );


                  if (
                    max <= 0
                  ) {

                    return sum;

                  }


                  return (
                    sum +
                    (
                      marks /
                      max
                    ) *
                    100
                  );

                },
                0
              );


            average =
              total /
              graded.length;

          }


          return {

            ...assignment,

            submissionCount:
              submissions.length,

            gradedCount:
              graded.length,

            pendingCount:
              Math.max(
                0,
                submissions.length -
                graded.length
              ),

            averageScore:
              average

          };

        }
      );

    }, [
      allAssignments
    ]);


  // ============================================================
  // MONTHLY SUBMISSION TREND
  // ============================================================

  const monthlyTrend =
    useMemo(() => {

      const months = {};


      allSubmissions.forEach(
        (submission) => {

          if (
            !submission.submitted_at
          ) {

            return;

          }


          const date =
            new Date(
              submission.submitted_at
            );


          if (
            Number.isNaN(
              date.getTime()
            )
          ) {

            return;

          }


          const key =
            date.toLocaleDateString(
              'en-US',
              {
                month: 'short',
                year: 'numeric'
              }
            );


          if (
            !months[key]
          ) {

            months[key] = 0;

          }


          months[key] += 1;

        }
      );


      return Object.entries(
        months
      )
        .map(
          (
            [label, value]
          ) => ({
            label,
            value
          })
        )
        .slice(-6);

    }, [
      allSubmissions
    ]);


  const maxMonthlyValue =
    Math.max(
      1,
      ...monthlyTrend.map(
        (item) =>
          item.value
      )
    );


  // ============================================================
  // BEST COURSE BY AVERAGE
  // ============================================================

  const highestCourse =
    courseAnalytics.length > 0
      ? [...courseAnalytics]
          .sort(
            (a, b) =>
              b.averageScore -
              a.averageScore
          )[0]
      : null;


  // ============================================================
  // MOST SUBMISSIONS ASSIGNMENT
  // ============================================================

  const mostActiveAssignment =
    assignmentAnalytics.length > 0
      ? [...assignmentAnalytics]
          .sort(
            (a, b) =>
              b.submissionCount -
              a.submissionCount
          )[0]
      : null;


  // ============================================================
  // DATE FORMAT
  // ============================================================

  const formatDate = (
    value
  ) => {

    if (!value) {
      return '—';
    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return '—';

    }


    return date.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
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
              Loading analytics...
            </p>

          </div>

        </main>

      </div>

    );

  }


  // ============================================================
  // MAIN UI
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
              Analytics & Performance
            </h1>

            <p className="text-xs text-slate-500 mt-1">
              Real-time performance insights from your courses,
              assignments and student submissions.
            </p>

          </div>


          <button
            type="button"
            onClick={() =>
              loadAnalytics(true)
            }
            disabled={refreshing}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-60"
          >

            <RefreshCw
              className={`w-3.5 h-3.5 ${
                refreshing
                  ? 'animate-spin'
                  : ''
              }`}
            />

            {refreshing
              ? 'Refreshing...'
              : 'Refresh'}

          </button>

        </div>


        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (

          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">

            <AlertCircle className="w-5 h-5 text-rose-500" />

            <p className="text-xs font-semibold text-rose-600">
              {error}
            </p>

          </div>

        )}


        {/* ======================================================
            TOP STATS
        ====================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">


          {/* COURSES */}

          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-semibold text-slate-500">
                  My Courses
                </p>

                <p className="text-2xl font-extrabold text-slate-900 mt-2">
                  {courses.length}
                </p>

              </div>


              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">

                <BookOpen className="w-5 h-5" />

              </div>

            </div>

          </div>


          {/* STUDENTS */}

          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-semibold text-slate-500">
                  Students
                </p>

                <p className="text-2xl font-extrabold text-slate-900 mt-2">
                  {totalStudents}
                </p>

              </div>


              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">

                <Users className="w-5 h-5" />

              </div>

            </div>

          </div>


          {/* SUBMISSIONS */}

          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-semibold text-slate-500">
                  Submissions
                </p>

                <p className="text-2xl font-extrabold text-slate-900 mt-2">
                  {totalSubmissions}
                </p>

              </div>


              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">

                <ClipboardCheck className="w-5 h-5" />

              </div>

            </div>

          </div>


          {/* AVERAGE */}

          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-semibold text-slate-500">
                  Average Score
                </p>

                <p className="text-2xl font-extrabold text-slate-900 mt-2">
                  {averageScore.toFixed(1)}%
                </p>

              </div>


              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">

                <TrendingUp className="w-5 h-5" />

              </div>

            </div>

          </div>

        </div>


        {/* ======================================================
            SECONDARY STATS
        ====================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">


          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <div className="flex items-center gap-3">

              <CheckCircle2 className="w-5 h-5 text-emerald-500" />

              <div>

                <p className="text-xs text-slate-400">
                  Graded Submissions
                </p>

                <p className="text-lg font-extrabold text-slate-900">
                  {gradedCount}
                </p>

              </div>

            </div>

          </div>


          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <div className="flex items-center gap-3">

              <Clock className="w-5 h-5 text-amber-500" />

              <div>

                <p className="text-xs text-slate-400">
                  Pending Grading
                </p>

                <p className="text-lg font-extrabold text-slate-900">
                  {pendingCount}
                </p>

              </div>

            </div>

          </div>


          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <div className="flex items-center gap-3">

              <BarChart3 className="w-5 h-5 text-brand-600" />

              <div>

                <p className="text-xs text-slate-400">
                  Grading Rate
                </p>

                <p className="text-lg font-extrabold text-slate-900">
                  {gradingRate.toFixed(1)}%
                </p>

              </div>

            </div>

          </div>

        </div>


        {/* ======================================================
            COURSE PERFORMANCE
        ====================================================== */}

        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">


          <div className="p-6 border-b border-slate-100">

            <h2 className="text-sm font-bold text-slate-900">
              Course Performance
            </h2>

            <p className="text-xs text-slate-400 mt-1">
              Performance calculated from actual graded submissions.
            </p>

          </div>


          <div className="p-6 space-y-4">


            {courseAnalytics.length === 0 ? (

              <div className="py-10 text-center">

                <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />

                <p className="text-xs font-semibold text-slate-500 mt-3">
                  No course data available yet.
                </p>

              </div>

            ) : (

              courseAnalytics.map(
                (course) => (

                  <div
                    key={
                      course.course_id
                    }
                    className="p-4 rounded-2xl border border-slate-100 hover:bg-slate-50/60 transition"
                  >

                    <div className="flex flex-col md:flex-row md:items-center gap-4">


                      {/* COURSE */}

                      <div className="flex-1 min-w-0">

                        <p className="text-sm font-bold text-slate-900 truncate">

                          {course.title}

                        </p>


                        <p className="text-[11px] text-slate-400 mt-1">

                          {course.assignmentCount}{' '}
                          assignments ·{' '}

                          {course.submissionCount}{' '}
                          submissions

                        </p>

                      </div>


                      {/* PROGRESS */}

                      <div className="w-full md:w-64">

                        <div className="flex justify-between mb-1">

                          <span className="text-[10px] font-semibold text-slate-400">
                            Average Score
                          </span>

                          <span className="text-xs font-extrabold text-slate-700">
                            {course.averageScore.toFixed(1)}%
                          </span>

                        </div>


                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">

                          <div
                            className="h-full bg-brand-600 rounded-full transition-all"
                            style={{
                              width:
                                `${Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    course.averageScore
                                  )
                                )}%`
                            }}
                          />

                        </div>

                      </div>


                      {/* STATUS */}

                      <div className="flex items-center gap-3">

                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold">

                          {course.gradedCount} Graded

                        </span>


                        {course.pendingCount > 0 && (

                          <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold">

                            {course.pendingCount} Pending

                          </span>

                        )}

                      </div>

                    </div>

                  </div>

                )

              )

            )}

          </div>

        </div>


        {/* ======================================================
            TWO COLUMN ANALYTICS
        ====================================================== */}

        <div className="grid lg:grid-cols-2 gap-6">


          {/* ====================================================
              SUBMISSION TREND
          ==================================================== */}

          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6">

            <div className="flex items-center justify-between mb-6">

              <div>

                <h2 className="text-sm font-bold text-slate-900">
                  Submission Activity
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  Submission count by month.
                </p>

              </div>


              <BarChart3 className="w-5 h-5 text-brand-600" />

            </div>


            {monthlyTrend.length === 0 ? (

              <div className="py-10 text-center">

                <ClipboardCheck className="w-7 h-7 text-slate-300 mx-auto" />

                <p className="text-xs text-slate-400 mt-2">
                  No submission activity yet.
                </p>

              </div>

            ) : (

              <div className="h-56 flex items-end gap-3">

                {monthlyTrend.map(
                  (item) => {

                    const height =
                      (
                        item.value /
                        maxMonthlyValue
                      ) *
                      100;


                    return (

                      <div
                        key={
                          item.label
                        }
                        className="flex-1 h-full flex flex-col justify-end items-center gap-2"
                      >

                        <span className="text-[10px] font-bold text-slate-500">

                          {item.value}

                        </span>


                        <div className="w-full h-40 flex items-end">

                          <div
                            className="w-full bg-brand-500 rounded-t-lg transition-all"
                            style={{
                              height:
                                `${Math.max(
                                  5,
                                  height
                                )}%`
                            }}
                          />

                        </div>


                        <span className="text-[9px] text-slate-400 text-center">

                          {item.label}

                        </span>

                      </div>

                    );

                  }
                )}

              </div>

            )}

          </div>


          {/* ====================================================
              QUICK INSIGHTS
          ==================================================== */}

          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6">

            <div className="flex items-center justify-between mb-6">

              <div>

                <h2 className="text-sm font-bold text-slate-900">
                  Quick Insights
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  Automatically calculated from your data.
                </p>

              </div>


              <Award className="w-5 h-5 text-amber-500" />

            </div>


            <div className="space-y-4">


              {/* HIGHEST COURSE */}

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">

                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                  Highest Course Average
                </p>


                <p className="text-sm font-extrabold text-slate-900 mt-1">

                  {highestCourse
                    ? highestCourse.title
                    : 'No graded data'}

                </p>


                {highestCourse && (

                  <p className="text-xs text-emerald-600 font-bold mt-1">

                    {highestCourse.averageScore.toFixed(1)}%
                    average

                  </p>

                )}

              </div>


              {/* ACTIVE ASSIGNMENT */}

              <div className="p-4 rounded-2xl bg-brand-50 border border-brand-100">

                <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wide">
                  Most Submitted Assignment
                </p>


                <p className="text-sm font-extrabold text-slate-900 mt-1">

                  {mostActiveAssignment
                    ? mostActiveAssignment.title
                    : 'No submissions yet'}

                </p>


                {mostActiveAssignment && (

                  <p className="text-xs text-brand-600 font-bold mt-1">

                    {mostActiveAssignment.submissionCount}{' '}
                    submissions

                  </p>

                )}

              </div>


              {/* GRADING */}

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">

                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">
                  Grading Queue
                </p>


                <p className="text-sm font-extrabold text-slate-900 mt-1">

                  {pendingCount}{' '}
                  submissions pending

                </p>


                <p className="text-xs text-amber-600 font-semibold mt-1">

                  {gradingRate.toFixed(1)}%
                  of submissions graded

                </p>

              </div>

            </div>

          </div>

        </div>


        {/* ======================================================
            ASSIGNMENT PERFORMANCE
        ====================================================== */}

        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">


          <div className="p-6 border-b border-slate-100">

            <h2 className="text-sm font-bold text-slate-900">
              Assignment Performance
            </h2>

            <p className="text-xs text-slate-400 mt-1">
              Submission and grading statistics for every assignment.
            </p>

          </div>


          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead>

                <tr className="border-b border-slate-100 bg-slate-50/50">

                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">
                    Assignment
                  </th>

                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">
                    Deadline
                  </th>

                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">
                    Submissions
                  </th>

                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">
                    Graded
                  </th>

                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">
                    Average
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-50">


                {assignmentAnalytics.length === 0 ? (

                  <tr>

                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center"
                    >

                      <ClipboardCheck className="w-7 h-7 text-slate-300 mx-auto" />

                      <p className="text-xs font-semibold text-slate-500 mt-3">
                        No assignment data available.
                      </p>

                    </td>

                  </tr>

                ) : (

                  assignmentAnalytics.map(
                    (assignment) => (

                      <tr
                        key={
                          assignment.assignment_id
                        }
                        className="hover:bg-slate-50/50"
                      >


                        <td className="px-6 py-4">

                          <p className="text-xs font-bold text-slate-800">

                            {assignment.title}

                          </p>

                        </td>


                        <td className="px-6 py-4">

                          <p className="text-[11px] text-slate-400">

                            {formatDate(
                              assignment.deadline
                            )}

                          </p>

                        </td>


                        <td className="px-6 py-4">

                          <span className="text-xs font-bold text-slate-700">

                            {assignment.submissionCount}

                          </span>

                        </td>


                        <td className="px-6 py-4">

                          <div className="flex items-center gap-2">

                            <span className="text-xs font-bold text-emerald-600">

                              {assignment.gradedCount}

                            </span>


                            {assignment.pendingCount > 0 && (

                              <span className="text-[10px] text-amber-600 font-bold">

                                ({assignment.pendingCount} pending)

                              </span>

                            )}

                          </div>

                        </td>


                        <td className="px-6 py-4">

                          <span className="text-xs font-extrabold text-slate-800">

                            {assignment.averageScore > 0
                              ? `${assignment.averageScore.toFixed(1)}%`
                              : '—'}

                          </span>

                        </td>

                      </tr>

                    )

                  )

                )}

              </tbody>

            </table>

          </div>

        </div>


      </main>

    </div>

  );

}