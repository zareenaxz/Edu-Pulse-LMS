import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import InstructorSidebar from '../components/InstructorSidebar';
import { api } from '../api/client';
import { useApi } from '../api/useApi';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  Search,
  Users,
  XCircle,
} from 'lucide-react';

const formatDate = (value) => {
  if (!value) return 'No deadline';

  const date = new Date(
    String(value).replace(' ', 'T')
  );

  if (Number.isNaN(date.getTime())) {
    return 'No deadline';
  }

  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const getStatus = (assignmentStatus) => {
  if (!assignmentStatus) {
    return {
      label: 'Not Submitted',
      className:
        'bg-rose-50 text-rose-600 border-rose-100',
      icon: XCircle,
    };
  }

  if (assignmentStatus.status === 'graded') {
    return {
      label: 'Graded',
      className:
        'bg-emerald-50 text-emerald-600 border-emerald-100',
      icon: CheckCircle2,
    };
  }

  if (assignmentStatus.status === 'submitted') {
    return {
      label: 'Submitted',
      className:
        'bg-blue-50 text-blue-600 border-blue-100',
      icon: FileText,
    };
  }

  if (assignmentStatus.status === 'late') {
    return {
      label: 'Late',
      className:
        'bg-amber-50 text-amber-600 border-amber-100',
      icon: Clock3,
    };
  }

  return {
    label: 'Not Submitted',
    className:
      'bg-rose-50 text-rose-600 border-rose-100',
    icon: XCircle,
  };
};

export default function InstructorAssignmentStatusPage() {
  const { courseId } = useParams();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const {
    data,
    loading,
    error,
    refetch,
  } = useApi(
    `/hub/course/${courseId}/assignment-status`
  );

  const course = data?.course || {};
  const assignments = Array.isArray(data?.assignments)
    ? data.assignments
    : [];

  const students = Array.isArray(data?.students)
    ? data.students
    : [];

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !query ||
        String(student.name || '')
          .toLowerCase()
          .includes(query) ||
        String(student.email || '')
          .toLowerCase()
          .includes(query);

      if (!matchesSearch) {
        return false;
      }

      const submittedCount =
        Number(student.submitted_count || 0);

      const missingCount =
        Number(student.missing_count || 0);

      if (filter === 'submitted') {
        return submittedCount > 0;
      }

      if (filter === 'missing') {
        return missingCount > 0;
      }

      if (filter === 'complete') {
        return (
          assignments.length > 0 &&
          submittedCount === assignments.length
        );
      }

      return true;
    });
  }, [
    students,
    assignments.length,
    search,
    filter,
  ]);

  const totalStudents = students.length;

  const totalSubmissions = students.reduce(
    (total, student) =>
      total +
      Number(student.submitted_count || 0),
    0
  );

  const totalMissing = students.reduce(
    (total, student) =>
      total +
      Number(student.missing_count || 0),
    0
  );

  const totalGraded = students.reduce(
    (total, student) =>
      total +
      Number(student.graded_count || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FD]">
        <InstructorSidebar />

        <main className="flex-1 p-6 lg:p-8">
          <div className="animate-pulse space-y-6">

            <div className="h-8 w-72 bg-slate-200 rounded-xl" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-28 bg-white rounded-2xl"
                />
              ))}
            </div>

            <div className="h-20 bg-white rounded-2xl" />

            <div className="h-96 bg-white rounded-2xl" />

          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FD]">
        <InstructorSidebar />

        <main className="flex-1 p-6 lg:p-8">

          <Link
            to={`/instructor/courses/${courseId}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course
          </Link>

          <div className="mt-8 bg-white border border-rose-100 rounded-3xl p-8 text-center">

            <XCircle className="w-12 h-12 text-rose-500 mx-auto" />

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Could not load assignment tracker
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {error?.message ||
                'Something went wrong while loading the data.'}
            </p>

            <button
              onClick={refetch}
              className="mt-5 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition"
            >
              Try Again
            </button>

          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <InstructorSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div>

            <Link
              to={`/instructor/courses/${courseId}`}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-brand-600 mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Course
            </Link>

            <h1 className="text-2xl font-extrabold text-slate-900">
              Assignment Submission Tracker
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              {course.title || 'Course'} — see who submitted
              assignments and who has not.
            </p>

          </div>

          <button
            onClick={refetch}
            className="self-start lg:self-center px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-7">

          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400">
                  Students
                </p>

                <p className="text-2xl font-extrabold text-slate-900 mt-1">
                  {totalStudents}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>

          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400">
                  Submissions
                </p>

                <p className="text-2xl font-extrabold text-slate-900 mt-1">
                  {totalSubmissions}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>

          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400">
                  Missing
                </p>

                <p className="text-2xl font-extrabold text-slate-900 mt-1">
                  {totalMissing}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
            </div>

          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400">
                  Graded
                </p>

                <p className="text-2xl font-extrabold text-slate-900 mt-1">
                  {totalGraded}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

          </div>

        </div>

        {/* SEARCH + FILTER */}
        <div className="mt-7 bg-white border border-slate-100 rounded-2xl p-4">

          <div className="flex flex-col lg:flex-row gap-3">

            <div className="relative flex-1">

              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search student by name or email..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />

            </div>

            <div className="flex flex-wrap gap-2">

              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                  filter === 'all'
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All
              </button>

              <button
                onClick={() =>
                  setFilter('submitted')
                }
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                  filter === 'submitted'
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Submitted
              </button>

              <button
                onClick={() =>
                  setFilter('missing')
                }
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                  filter === 'missing'
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Has Missing
              </button>

              <button
                onClick={() =>
                  setFilter('complete')
                }
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                  filter === 'complete'
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Completed All
              </button>

            </div>

          </div>

        </div>

        {/* ASSIGNMENT LEGEND */}
        <div className="mt-6 bg-white border border-slate-100 rounded-2xl p-4">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

            <div>
              <p className="text-sm font-bold text-slate-800">
                Assignment Status
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Each cell shows the student's submission status
                for that assignment.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-[11px] font-bold">

              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Graded
              </span>

              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Submitted
              </span>

              <span className="flex items-center gap-1.5 text-rose-600">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Not Submitted
              </span>

            </div>

          </div>

        </div>

        {/* TABLE */}
        <div className="mt-4 bg-white border border-slate-100 rounded-2xl overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px] border-collapse">

              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">

                  <th className="sticky left-0 z-20 bg-slate-50 px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-400 min-w-[240px]">
                    Student
                  </th>

                  {assignments.map((assignment) => (
                    <th
                      key={assignment.assignment_id}
                      className="px-4 py-4 text-left min-w-[190px]"
                    >

                      <div className="text-xs font-bold text-slate-800">
                        {assignment.title}
                      </div>

                      <div className="text-[10px] text-slate-400 mt-1">
                        Due:{' '}
                        {formatDate(
                          assignment.deadline
                        )}
                      </div>

                    </th>
                  ))}

                  <th className="px-5 py-4 text-center min-w-[110px] text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Submitted
                  </th>

                  <th className="px-5 py-4 text-center min-w-[100px] text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Missing
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredStudents.map((student) => (
                  <tr
                    key={student.student_id}
                    className="border-b border-slate-100 hover:bg-slate-50/70 transition"
                  >

                    {/* STUDENT */}
                    <td className="sticky left-0 z-10 bg-white px-5 py-4">

                      <div className="flex items-center gap-3">

                        <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-extrabold text-xs shrink-0">
                          {String(
                            student.name || 'S'
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">

                          <p className="text-sm font-bold text-slate-800 truncate">
                            {student.name ||
                              'Unknown Student'}
                          </p>

                          <p className="text-[11px] text-slate-400 truncate">
                            {student.email ||
                              'No email'}
                          </p>

                        </div>

                      </div>

                    </td>

                    {/* ASSIGNMENTS */}
                    {assignments.map(
                      (assignment) => {
                        const status =
                          student.assignments?.[
                            assignment.assignment_id
                          ];

                        const statusInfo =
                          getStatus(status);

                        const StatusIcon =
                          statusInfo.icon;

                        return (
                          <td
                            key={
                              assignment.assignment_id
                            }
                            className="px-4 py-4"
                          >

                            <div
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-extrabold ${statusInfo.className}`}
                            >

                              <StatusIcon className="w-3.5 h-3.5" />

                              {statusInfo.label}

                            </div>

                            {status?.submitted_at && (
                              <p className="text-[10px] text-slate-400 mt-1.5">
                                {formatDate(
                                  status.submitted_at
                                )}
                              </p>
                            )}

                            {status?.marks !== null &&
                              status?.marks !==
                                undefined && (
                                <p className="text-[10px] font-bold text-slate-500 mt-1">
                                  Marks:{' '}
                                  {
                                    status.marks
                                  }
                                  {assignment.max_marks
                                    ? ` / ${assignment.max_marks}`
                                    : ''}
                                </p>
                              )}

                          </td>
                        );
                      }
                    )}

                    {/* SUBMITTED */}
                    <td className="px-5 py-4 text-center">

                      <span className="inline-flex min-w-8 justify-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-extrabold">
                        {student.submitted_count ||
                          0}
                      </span>

                    </td>

                    {/* MISSING */}
                    <td className="px-5 py-4 text-center">

                      <span
                        className={`inline-flex min-w-8 justify-center px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                          Number(
                            student.missing_count ||
                              0
                          ) > 0
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-slate-50 text-slate-500'
                        }`}
                      >
                        {student.missing_count ||
                          0}
                      </span>

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

          {filteredStudents.length === 0 && (
            <div className="py-14 text-center">

              <Users className="w-10 h-10 text-slate-300 mx-auto" />

              <h3 className="mt-3 text-sm font-bold text-slate-700">
                No students found
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Try changing your search or filter.
              </p>

            </div>
          )}

        </div>

      </main>
    </div>
  );
}