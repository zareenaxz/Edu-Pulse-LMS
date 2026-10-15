import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StudentSidebar from '../components/StudentSidebar';
import { PlayCircle, Eye } from 'lucide-react';
import api from '../api/client';

export default function StudentCoursesPage() {
  const navigate = useNavigate();

  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load enrolled courses AND the student's real progress for each course.
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await api.get('/courses');
        const backendCourses = data.courses || [];

        const formattedCourses = await Promise.all(
          backendCourses.map(async (course) => {
            const totalLessons = Number(course.lessons || 0);

            let completedLessons = 0;
            let progress = 0;
            let lastLesson = totalLessons > 0
              ? 'Continue your lessons'
              : 'No lessons available yet';

            try {
              const progressData = await api.get(
                `/progress/courses/${course.course_id}`
              );

              // Backend response:
              // {
              //   success: true,
              //   progress: { total, done, percent },
              //   lessons: [...]
              // }

              const backendProgress = progressData.progress || {};

              completedLessons = Number(
                backendProgress.done ??
                backendProgress.completed ??
                0
              );

              progress = Number(
                backendProgress.percent ??
                backendProgress.percentage ??
                0
              );

              const progressLessons = Array.isArray(progressData.lessons)
                ? progressData.lessons
                : [];

              // Find the first lesson that is not completed.
              const nextLesson = progressLessons.find(
                (lesson) =>
                  Number(lesson.completed) !== 1 &&
                  lesson.completed !== true
              );

              if (nextLesson) {
                lastLesson = nextLesson.title || 'Continue your lessons';
              } else if (progressLessons.length > 0) {
                lastLesson = 'Course completed';
              }

              // Use the actual number of lessons returned by progress
              // when available.
              const actualTotal =
                Number(backendProgress.total) ||
                progressLessons.length ||
                totalLessons;

              if (actualTotal > 0) {
                progress = Math.min(
                  100,
                  Math.max(
                    0,
                    Math.round((completedLessons / actualTotal) * 100)
                  )
                );
              }
            } catch (progressError) {
              console.error(
                `Could not load progress for course ${course.course_id}:`,
                progressError
              );

              // Keep the course visible even if its progress request fails.
              completedLessons = 0;
              progress = 0;
            }

            const actualTotalLessons = Math.max(
              totalLessons,
              completedLessons
            );

            return {
              id: course.course_id,
              title: course.title || 'Untitled Course',
              dept: course.category_name || 'General',
              instructor: course.instructor_name || 'Instructor',
              progress,
              completedLessons,
              totalLessons: actualTotalLessons,
              lastLesson,
              status: progress >= 100 ? 'completed' : 'active',
              image:
                course.thumbnail ||
                'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&q=80',
            };
          })
        );

        setCourses(formattedCourses);
      } catch (err) {
        console.error('Failed to load courses:', err);

        setError(
          err.message || 'Unable to load your courses. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  // Filter + search
  const filtered = courses.filter((course) => {
    const matchesFilter =
      filter === 'all' || course.status === filter;

    const matchesSearch = course.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <StudentSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">

          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              My Enrolled Courses
            </h1>

            <p className="text-xs text-slate-500 mt-1">
              Select a course to inspect its full syllabus and continue your lessons.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">

            {/* Search */}
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 rounded-xl text-xs border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-brand-200"
            />

            {/* Filters */}
            <div className="flex gap-2">

              <button
                onClick={() => setFilter('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  filter === 'all'
                    ? 'bg-brand-600 text-white'
                    : 'bg-white border text-slate-600'
                }`}
              >
                All Courses
              </button>

              <button
                onClick={() => setFilter('active')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  filter === 'active'
                    ? 'bg-brand-600 text-white'
                    : 'bg-white border text-slate-600'
                }`}
              >
                In Progress
              </button>

              <button
                onClick={() => setFilter('completed')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  filter === 'completed'
                    ? 'bg-brand-600 text-white'
                    : 'bg-white border text-slate-600'
                }`}
              >
                Completed
              </button>

            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
            <p className="text-sm font-semibold text-slate-600">
              Loading your courses...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-6">
            <p className="text-sm font-semibold text-red-600">
              {error}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
            >
              Try Again
            </button>
          </div>
        )}

        {/* No courses */}
        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
            <h2 className="text-lg font-bold text-slate-800">
              No courses found
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              You don't have any enrolled courses matching your search.
            </p>

            <Link
              to="/student/catalog"
              className="inline-flex mt-5 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold"
            >
              Browse Course Catalog
            </Link>
          </div>
        )}

        {/* Courses Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

            {filtered.map((course) => (
              <div
                key={course.id}
                onClick={() =>
                  navigate(`/student/course/${course.id}`)
                }
                className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition cursor-pointer group"
              >

                <div>

                  {/* Course Image */}
                  <div className="h-44 relative overflow-hidden">

                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />

                    {/* Status */}
                    <span
                      className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold shadow-xs ${
                        course.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-white/95 text-brand-600 border border-slate-200'
                      }`}
                    >
                      {course.status === 'completed'
                        ? 'Completed'
                        : `${course.progress}% Complete`}
                    </span>

                  </div>

                  {/* Course Information */}
                  <div className="p-6 space-y-3">

                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {course.dept}
                    </span>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-brand-600 transition">
                      {course.title}
                    </h3>

                    {/* Instructor */}
                    <p className="text-[11px] text-slate-500">
                      Instructor:{' '}
                      <span className="font-semibold text-slate-700">
                        {course.instructor}
                      </span>
                    </p>

                    {/* Progress */}
                    <div className="space-y-1.5 pt-1">

                      <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                        <span>
                          {course.completedLessons} of{' '}
                          {course.totalLessons} Lessons
                        </span>

                        <span>
                          {course.progress}%
                        </span>
                      </div>

                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">

                        <div
                          style={{
                            width: `${course.progress}%`,
                          }}
                          className="h-full bg-brand-600 rounded-full"
                        />

                      </div>

                    </div>

                    {/* Up Next */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-0.5">

                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Up Next:
                      </span>

                      <p className="font-semibold text-slate-700 truncate">
                        {course.lastLesson}
                      </p>

                    </div>

                  </div>
                </div>

                {/* Buttons */}
                <div className="p-6 pt-0 grid grid-cols-2 gap-2 border-t border-slate-50 mt-2">

                  <Link
                    to={`/student/course/${course.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Syllabus
                  </Link>

                  <Link
                    to={`/student/learn/${course.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-brand-500/20 transition"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    Resume
                  </Link>

                </div>

              </div>
            ))}

          </div>
        )}

      </main>
    </div>
  );
}
