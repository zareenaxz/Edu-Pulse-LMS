import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import StudentSidebar from '../components/StudentSidebar';
import CourseRating from '../components/CourseRating';
import { api } from '../api/client';
import {
  ArrowLeft,
  Star,
  Users,
  Clock,
  BookOpen,
  PlayCircle,
  FileText,
  Download,
  CheckCircle2,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function StudentCourseDetailPage() {
  const { courseId } = useParams();

  const [activeTab, setActiveTab] = useState('syllabus');
  const [expandedModules, setExpandedModules] = useState({ 1: true });

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState({
    total: 0,
    done: 0,
    percent: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);
        setError('');

        const [courseResponse, lessonsResponse, progressResponse, coursesResponse] =
          await Promise.all([
            api.get(`/courses/${courseId}`),
            api.get(`/courses/${courseId}/lessons`),
            api.get(`/progress/courses/${courseId}`),
            api.get('/courses'),
          ]);

        const backendCourse = courseResponse.course;

        if (!backendCourse) {
          throw new Error('Course information was not returned by the server.');
        }

        const courseFromList = (coursesResponse.courses || []).find(
          (item) => String(item.course_id) === String(courseId)
        );

        const backendLessons = lessonsResponse.lessons || [];

        const backendProgress = progressResponse.progress || {
          total: backendLessons.length,
          done: 0,
          percent: 0,
        };

        setCourse({
          id: backendCourse.course_id,
          code: `COURSE-${backendCourse.course_id}`,
          title: backendCourse.title || 'Untitled Course',
          dept: backendCourse.category_name || 'General',
          instructor: backendCourse.instructor_name || 'Instructor',
          rating: Number(backendCourse.avg_rating || 0),
          reviewsCount: Number(backendCourse.review_count || 0),
          studentsCount: Number(courseFromList?.students || 0),
          difficulty: backendCourse.difficulty || 'Beginner',
          thumbnail:
            backendCourse.thumbnail ||
            'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1000&q=80',
          description:
            backendCourse.description ||
            'No course description has been provided yet.',
        });

        setLessons(backendLessons);

        setProgress({
          total: Number(backendProgress.total || backendLessons.length || 0),
          done: Number(backendProgress.done || 0),
          percent: Number(backendProgress.percent || 0),
        });
      } catch (err) {
        console.error('Failed to load course details:', err);
        setError(
          err.message || 'Unable to load this course. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const toggleModule = (id) => {
    setExpandedModules((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FD]">
        <StudentSidebar />

        <main className="flex-1 p-6 lg:p-8 flex items-center justify-center">
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
            <p className="text-sm font-semibold text-slate-600">
              Loading course details...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FD]">
        <StudentSidebar />

        <main className="flex-1 p-6 lg:p-8">
          <div className="bg-red-50 border border-red-200 rounded-3xl p-6">
            <p className="text-sm font-semibold text-red-600">
              {error || 'Course not found.'}
            </p>

            <Link
              to="/student/courses"
              className="inline-flex mt-4 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
            >
              Back to My Courses
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const completedLessons = progress.done;
  const totalLessons = progress.total || lessons.length;
  const progressPercent = progress.percent;

  const courseModule = {
    id: 1,
    title: 'Course Lessons',
    duration: `${totalLessons} ${
      totalLessons === 1 ? 'Lesson' : 'Lessons'
    }`,
    lessons: lessons.map((lesson) => {
      const progressLesson = (progressResponseLesson) =>
        progressResponseLesson;

      return {
        id: lesson.lesson_id,
        title: lesson.title,
        duration: lesson.video_url ? 'Video Lesson' : 'Lesson',
        completed: false,
      };
    }),
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <StudentSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <Link
            to="/student/courses"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Courses
          </Link>

          <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
            Course ID:{' '}
            <strong className="text-brand-600">{course.code}</strong>
          </span>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden grid lg:grid-cols-12 gap-8 p-6 lg:p-8">
          <div className="lg:col-span-8 space-y-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {course.difficulty}
              </span>

              <span className="text-xs font-semibold text-slate-400">
                • {course.dept}
              </span>

              <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                {course.rating > 0 ? course.rating : 'No rating'}
                {course.reviewsCount > 0
                  ? ` (${course.reviewsCount} reviews)`
                  : ''}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {course.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              {course.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                {course.studentsCount} Students Enrolled
              </span>

              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                {totalLessons}{' '}
                {totalLessons === 1 ? 'Lesson' : 'Lessons'}
              </span>

              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-slate-400" />
                Verified Certificate
              </span>
            </div>

            {/* Course Progress */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">
                  Your Current Progress
                </span>

                <span className="font-extrabold text-brand-600">
                  {progressPercent}% Completed
                </span>
              </div>

              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  style={{ width: `${progressPercent}%` }}
                  className="h-full bg-brand-600 rounded-full"
                />
              </div>

              <p className="text-[11px] text-slate-400">
                {completedLessons} of {totalLessons} lessons completed
              </p>
            </div>
          </div>

          {/* Right Action Thumbnail Card */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
            <div className="relative rounded-2xl overflow-hidden aspect-video shadow-md border-2 border-white group">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />

              <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/90 text-brand-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                  <PlayCircle className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <Link
                to={`/student/learn/${course.id}`}
                className="w-full py-3.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition flex items-center justify-center gap-2 shadow-md shadow-brand-500/20"
              >
                <PlayCircle className="w-4 h-4" />
                Continue Lessons
              </Link>

              <Link
                to="/student/assignments"
                className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                View Course Assignments
              </Link>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-slate-200 text-xs font-semibold gap-6">
          <button
            onClick={() => setActiveTab('syllabus')}
            className={`pb-3 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'syllabus'
                ? 'border-brand-600 text-brand-600 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Syllabus & Lessons
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`pb-3 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'resources'
                ? 'border-brand-600 text-brand-600 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Download className="w-4 h-4" />
            Course Downloads
          </button>
        </div>

        {/* Syllabus */}
        {activeTab === 'syllabus' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Course Information
              </h3>

              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                <div className="p-3 bg-[#FBFBFE] rounded-2xl border border-slate-100 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Instructor
                  </span>

                  <p className="font-semibold text-slate-700 mt-1">
                    {course.instructor}
                  </p>
                </div>

                <div className="p-3 bg-[#FBFBFE] rounded-2xl border border-slate-100 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Difficulty
                  </span>

                  <p className="font-semibold text-slate-700 mt-1">
                    {course.difficulty}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
                <div
                  onClick={() => toggleModule(courseModule.id)}
                  className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50/60 transition select-none"
                >
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {courseModule.title}
                    </h4>

                    <span className="text-xs text-slate-400">
                      {courseModule.duration}
                    </span>
                  </div>

                  <button className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
                    {expandedModules[courseModule.id] ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {expandedModules[courseModule.id] && (
                  <div className="border-t border-slate-100 p-4 space-y-2 bg-[#FBFBFE]">
                    {lessons.length === 0 && (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No lessons have been added to this course yet.
                      </div>
                    )}

                    {lessons.map((lesson, index) => {
                      const progressLesson = (
                        // This is matched from the progress API response
                        progressResponseLesson
                      ) => progressResponseLesson;

                      return (
                        <div
                          key={lesson.lesson_id}
                          className="p-3.5 rounded-2xl border flex items-center justify-between transition bg-white border-slate-200/70 hover:border-slate-300"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-brand-100 text-brand-600">
                              <PlayCircle className="w-4 h-4" />
                            </div>

                            <div>
                              <div className="text-xs font-bold text-slate-800">
                                {index + 1}. {lesson.title}
                              </div>

                              <span className="text-[11px] text-slate-400">
                                {lesson.video_url
                                  ? 'Video Lesson'
                                  : 'Lesson Material'}
                              </span>
                            </div>
                          </div>

                          <Link
                            to={`/student/learn/${course.id}`}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition"
                          >
                            Study Lesson
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Downloads */}
        {activeTab === 'resources' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Downloadable Handouts & Reference Files
            </h3>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/70 text-center">
              <p className="text-xs text-slate-500">
                Course downloads will appear here when lesson attachments are
                added.
              </p>
            </div>
          </div>
        )}

        {/* Course Rating */}
        <CourseRating courseId={courseId} />
      </main>
    </div>
  );
}