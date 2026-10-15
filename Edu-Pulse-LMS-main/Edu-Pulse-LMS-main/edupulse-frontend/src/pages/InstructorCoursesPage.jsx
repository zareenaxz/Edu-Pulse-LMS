import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import InstructorSidebar from '../components/InstructorSidebar';
import ConfirmModal from '../components/ConfirmModal';
import {
  Plus,
  Search,
  Users,
  BookOpen,
  Eye,
  AlertCircle,
  Trash2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api/client';

export default function InstructorCoursesPage() {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('All');

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalState, setModalState] = useState({
    isOpen: false,
    courseId: null,
    courseTitle: '',
  });

  const [deleting, setDeleting] = useState(false);

  // ------------------------------------------------------------
  // Load instructor courses
  // ------------------------------------------------------------
  const loadCourses = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/courses');

      const rawCourses = response?.courses || [];

      // Load assignment information for each course so that
      // "to Grade" counts are also based on real backend data.
      const enrichedCourses = await Promise.all(
        rawCourses.map(async (course) => {
          try {
            const assignmentResponse = await api.get(
              `/assignments?course_id=${course.course_id}`
            );

            const assignments = assignmentResponse?.assignments || [];

            const pendingGrades = assignments.reduce(
              (total, assignment) =>
                total + Number(assignment.pending_count || 0),
              0
            );

            return {
              ...course,
              pendingGrades,
            };
          } catch (assignmentError) {
            // Course data should still appear even if assignment
            // information fails to load.
            return {
              ...course,
              pendingGrades: 0,
            };
          }
        })
      );

      setCourses(enrichedCourses);
    } catch (err) {
      console.error('Failed to load instructor courses:', err);
      setError(
        err?.message || 'Unable to load your courses. Please try again.'
      );
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // ------------------------------------------------------------
  // Departments/categories from real courses
  // ------------------------------------------------------------
  const departments = useMemo(() => {
    const values = courses
      .map((course) => course.category_name)
      .filter(Boolean);

    return ['All', ...Array.from(new Set(values))];
  }, [courses]);

  // ------------------------------------------------------------
  // Filter courses
  // ------------------------------------------------------------
  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return courses.filter((course) => {
      const title = String(course.title || '').toLowerCase();
      const category = String(course.category_name || '').toLowerCase();

      const matchesSearch =
        !query ||
        title.includes(query) ||
        category.includes(query);

      const matchesDept =
        filterDept === 'All' ||
        course.category_name === filterDept;

      return matchesSearch && matchesDept;
    });
  }, [courses, searchQuery, filterDept]);

  // ------------------------------------------------------------
  // Delete course
  // ------------------------------------------------------------
  const confirmDelete = async () => {
    if (!modalState.courseId) return;

    try {
      setDeleting(true);

      await api.delete(`/courses/${modalState.courseId}`);

      setCourses((current) =>
        current.filter(
          (course) => course.course_id !== modalState.courseId
        )
      );

      setModalState({
        isOpen: false,
        courseId: null,
        courseTitle: '',
      });
    } catch (err) {
      console.error('Failed to delete course:', err);

      alert(
        err?.message ||
          'Unable to delete this course. Please try again.'
      );
    } finally {
      setDeleting(false);
    }
  };

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  const getStatusLabel = (status) => {
    if (status === 'published') return 'Published';
    if (status === 'pending') return 'Pending Review';
    if (status === 'draft') return 'Draft';

    return status || 'Unknown';
  };

  const getStatusClasses = (status) => {
    if (status === 'published') {
      return 'bg-white/95 text-emerald-600 border border-emerald-100';
    }

    if (status === 'pending') {
      return 'bg-white/95 text-amber-600 border border-amber-100';
    }

    if (status === 'draft') {
      return 'bg-white/95 text-slate-600 border border-slate-200';
    }

    return 'bg-white/95 text-slate-600 border border-slate-200';
  };

  const getCourseImage = (course) => {
    if (course.thumbnail) {
      return course.thumbnail;
    }

    return null;
  };

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <InstructorSidebar role="instructor" title="EduPulse" />

      <main className="flex-1 p-8 overflow-y-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              My Courses
            </h1>

            <p className="text-xs text-slate-500 mt-1">
              Manage your courses, view student enrollment, monitor
              lessons, and access your course hub.
            </p>
          </div>

          <Link
            to="/instructor/create-course"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 shadow-md shadow-brand-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            Create New Course
          </Link>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between gap-4 items-center">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search course title..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 outline-none cursor-pointer"
            >
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department === 'All'
                    ? 'All Categories'
                    : department}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={loadCourses}
              disabled={loading}
              className="px-3 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition disabled:opacity-50"
              title="Refresh courses"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  loading ? 'animate-spin' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-rose-700">
                Unable to load courses
              </p>
              <p className="text-xs text-rose-600 mt-1">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={loadCourses}
              className="px-4 py-2 bg-white border border-rose-200 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />

            <p className="text-sm font-semibold text-slate-700 mt-4">
              Loading your courses...
            </p>

            <p className="text-xs text-slate-400 mt-1">
              Fetching course and assignment information.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredCourses.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs py-20 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-brand-600" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mt-4">
              {courses.length === 0
                ? 'No courses yet'
                : 'No courses found'}
            </h3>

            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {courses.length === 0
                ? 'Create your first course to start building your instructor hub.'
                : 'Try changing your search or category filter.'}
            </p>

            {courses.length === 0 && (
              <Link
                to="/instructor/create-course"
                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700"
              >
                <Plus className="w-4 h-4" />
                Create New Course
              </Link>
            )}
          </div>
        )}

        {/* Courses Grid */}
        {!loading && filteredCourses.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const courseId = course.course_id;
              const image = getCourseImage(course);

              return (
                <div
                  key={courseId}
                  onClick={() =>
                    navigate(`/instructor/courses/${courseId}`)
                  }
                  className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition cursor-pointer group"
                >
                  <div>
                    {/* Course image */}
                    <div className="relative h-44 overflow-hidden bg-gradient-to-br from-brand-600 to-indigo-700">
                      {image ? (
                        <img
                          src={image}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-16 h-16 text-white/30" />
                        </div>
                      )}

                      {/* Status */}
                      <span
                        className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold shadow-xs ${getStatusClasses(
                          course.status
                        )}`}
                      >
                        {getStatusLabel(course.status)}
                      </span>

                      {/* Pending grades */}
                      {Number(course.pendingGrades || 0) > 0 && (
                        <span className="absolute bottom-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold shadow-xs bg-amber-500 text-white flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {course.pendingGrades} to Grade
                        </span>
                      )}
                    </div>

                    {/* Course information */}
                    <div className="p-5 space-y-3">
                      <div className="flex justify-between items-center text-[11px] gap-3">
                        <span className="font-bold text-brand-600 uppercase tracking-wide truncate">
                          {course.category_name || 'Uncategorized'}
                        </span>

                        <span className="text-slate-400 flex items-center gap-1 whitespace-nowrap">
                          <BookOpen className="w-3.5 h-3.5" />
                          {Number(course.lessons || 0)} Lessons
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-brand-600 transition">
                        {course.title}
                      </h3>

                      <div className="flex items-center gap-4 text-slate-500 text-xs pt-1">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {Number(course.students ?? course.enrolled_count ?? 0)}{' '}
                          Enrolled
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-5 pt-0 flex gap-2 border-t border-slate-50 mt-4">
                    <Link
                      to={`/instructor/courses/${courseId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Hub
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();

                        setModalState({
                          isOpen: true,
                          courseId,
                          courseTitle: course.title,
                        });
                      }}
                      title="Delete Course"
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={modalState.isOpen}
          title="Delete Course?"
          message={`Are you sure you want to delete "${modalState.courseTitle}"? This will permanently erase all modules, enrolled records, and assignment submissions.`}
          confirmText={
            deleting ? 'Deleting...' : 'Yes, Delete Course'
          }
          cancelText="Keep Course"
          isDestructive={true}
          onConfirm={confirmDelete}
          onClose={() => {
            if (!deleting) {
              setModalState({
                isOpen: false,
                courseId: null,
                courseTitle: '',
              });
            }
          }}
        />
      </main>
    </div>
  );
}