import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import InstructorSidebar from '../components/InstructorSidebar';
import ConfirmModal from '../components/ConfirmModal';
import { api } from '../api/client';

import {
  ArrowLeft,
  Plus,
  Edit3,
  BookOpen,
  Users,
  CheckSquare,
  Trash2,
  PlayCircle,
  UserPlus,
  X,
  Loader2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export default function CourseDetailPage() {
  const { courseId } = useParams();

  const [activeSection, setActiveSection] =
    useState('curriculum');

  const [isEditing, setIsEditing] =
    useState(false);

  const [course, setCourse] =
    useState(null);

  const [lessons, setLessons] =
    useState([]);

  const [moduleData, setModuleData] =
    useState([]);

  const [assignments, setAssignments] =
    useState([]);

  const [quizzes, setQuizzes] =
    useState([]);

  const [showModuleEditModal, setShowModuleEditModal] =
    useState(false);

  const [editingModule, setEditingModule] =
    useState(null);

  const [moduleTitle, setModuleTitle] =
    useState('');

  const [moduleSaving, setModuleSaving] =
    useState(false);

  const [students, setStudents] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [modalConfig, setModalConfig] =
    useState({
      isOpen: false,
      title: '',
      message: '',
      confirmText: 'Confirm',
      type: 'danger',
      onConfirm: () => {},
    });

  const [showEnrollModal, setShowEnrollModal] =
    useState(false);

  const [newStudentName, setNewStudentName] =
    useState('');

  const [newStudentEmail, setNewStudentEmail] =
    useState('');

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      setError('');

      const [
        courseResponse,
        lessonsResponse,
        modulesResponse,
        assignmentsResponse,
        quizzesResponse,
      ] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/courses/${courseId}/lessons`),
        api.get(`/courses/${courseId}/modules`),
        api.get(`/assignments?course_id=${courseId}`),
        api.get(`/quizzes?course_id=${courseId}`),
      ]);

      setCourse(
        courseResponse.course || null
      );

      setLessons(
        lessonsResponse.lessons || []
      );

      setModuleData(
        modulesResponse.modules || []
      );

      setAssignments(
        assignmentsResponse.assignments || []
      );

      setQuizzes(
        quizzesResponse.quizzes || []
      );

      try {
        const enrollmentResponse =
          await api.get(
            `/enrollments?course_id=${courseId}`
          );

        setStudents(
          enrollmentResponse.enrollments ||
          enrollmentResponse.students ||
          []
        );
      } catch (enrollmentError) {
        console.warn(
          'Could not load course students:',
          enrollmentError
        );

        setStudents([]);
      }

    } catch (err) {
      console.error(
        'Failed to load course:',
        err
      );

      setError(
        err.message ||
        'Unable to load this course. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const modules = [...moduleData];

  const uncategorizedLessons =
    lessons.filter(
      (lesson) =>
        !lesson.module_id
    );

  if (uncategorizedLessons.length > 0) {
    modules.push({
      module_id: 'uncategorized',
      title: 'Uncategorized Lessons',
      module_order: 999999,
      lessons: uncategorizedLessons,
    });
  }

  const formatDate = (value) => {
    if (!value) return '—';

    try {
      return new Date(
        value
      ).toLocaleDateString(
        'en-US',
        {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        }
      );
    } catch {
      return '—';
    }
  };

  const getLessonType = (lesson) => {
    if (lesson.video_url)
      return 'Video';

    if (lesson.content)
      return 'Lesson';

    return 'Resource';
  };

  const getStudentName = (student) => {
    return (
      student.student_name ||
      student.name ||
      student.user_name ||
      'Student'
    );
  };

  const getStudentEmail = (student) => {
    return (
      student.student_email ||
      student.email ||
      '—'
    );
  };

  const getStudentId = (student) => {
    return (
      student.student_id ||
      student.user_id ||
      student.id
    );
  };

  const openEditModule = (module) => {
    if (
      module.module_id ===
      'uncategorized'
    ) {
      return;
    }

    setEditingModule(module);
    setModuleTitle(
      module.title || ''
    );

    setShowModuleEditModal(true);
  };

  const saveModuleEdit = async (
    event
  ) => {
    event.preventDefault();

    if (
      !editingModule ||
      !moduleTitle.trim()
    ) {
      return;
    }

    try {
      setModuleSaving(true);
      setError('');

      await api.patch(
        `/courses/${courseId}/modules/${editingModule.module_id}`,
        {
          title:
            moduleTitle.trim(),
        }
      );

      setModuleData((prev) =>
        prev.map((module) =>
          String(
            module.module_id
          ) ===
          String(
            editingModule.module_id
          )
            ? {
                ...module,
                title:
                  moduleTitle.trim(),
              }
            : module
        )
      );

      setShowModuleEditModal(false);
      setEditingModule(null);
      setModuleTitle('');
    } catch (err) {
      alert(
        err.message ||
        'Could not update the module.'
      );
    } finally {
      setModuleSaving(false);
    }
  };

  const triggerDeleteModule = (
    module
  ) => {
    if (
      module.module_id ===
      'uncategorized'
    ) {
      return;
    }

    setModalConfig({
      isOpen: true,
      title: 'Delete Module?',
      message: `Are you sure you want to delete "${module.title}"? The module will be removed, but its lessons will remain in the course.`,
      confirmText:
        'Delete Module',
      type: 'danger',

      onConfirm: async () => {
        try {
          await api.delete(
            `/courses/${courseId}/modules/${module.module_id}`
          );

          await loadCourseData();
        } catch (err) {
          alert(
            err.message ||
            'Could not delete the module.'
          );
        }
      },
    });
  };

  const triggerDeleteLesson = (
    lesson
  ) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Lesson?',
      message: `Are you sure you want to delete "${lesson.title}"? This action cannot be undone.`,
      confirmText:
        'Delete Lesson',
      type: 'danger',

      onConfirm: async () => {
        try {
          await api.delete(
            `/courses/${courseId}/lessons/${lesson.lesson_id}`
          );

          setLessons((prev) =>
            prev.filter(
              (item) =>
                item.lesson_id !==
                lesson.lesson_id
            )
          );
        } catch (err) {
          alert(
            err.message ||
            'Could not delete the lesson.'
          );
        }
      },
    });
  };

  const triggerDeleteCourse = () => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Course?',
      message:
        'This will permanently delete the course and its lessons. Are you sure?',
      confirmText:
        'Delete Course',
      type: 'danger',

      onConfirm: async () => {
        try {
          await api.delete(
            `/courses/${courseId}`
          );

          window.location.href =
            '/instructor/courses';
        } catch (err) {
          alert(
            err.message ||
            'Could not delete the course.'
          );
        }
      },
    });
  };

  const triggerRemoveStudent = (
    student
  ) => {
    const studentId =
      getStudentId(student);

    const studentName =
      getStudentName(student);

    setModalConfig({
      isOpen: true,
      title: 'Unenroll Student?',
      message: `Are you sure you want to remove ${studentName} from this course?`,
      confirmText:
        'Unenroll Student',
      type: 'warning',

      onConfirm: async () => {
        try {
          await api.delete(
            `/enrollments/${studentId}?course_id=${courseId}`
          );

          setStudents((prev) =>
            prev.filter(
              (item) =>
                String(
                  getStudentId(item)
                ) !==
                String(studentId)
            )
          );
        } catch (err) {
          alert(
            err.message ||
            'Could not remove the student.'
          );
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FD]">
        <InstructorSidebar />

        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />

            <p className="text-sm font-medium">
              Loading course...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FD]">
        <InstructorSidebar />

        <main className="flex-1 p-8">

          <Link
            to="/instructor/courses"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand-600"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Courses
          </Link>

          <div className="mt-8 bg-white rounded-3xl border border-rose-100 p-8 text-center">

            <AlertCircle className="w-10 h-10 mx-auto text-rose-500" />

            <h2 className="mt-3 text-lg font-bold text-slate-900">
              Could not load this course
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {error ||
                'Course not found.'}
            </p>

            <button
              onClick={loadCourseData}
              className="mt-5 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold"
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

      <main className="flex-1 p-8 overflow-y-auto space-y-8">

        {/* COURSE HEADER */}

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">

          <div className="flex items-center gap-4">

            <Link
              to="/instructor/courses"
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>

              <div className="flex items-center gap-2">

                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                  {course.course_code ||
                    `COURSE-${course.course_id}`}
                </span>

                <span className="text-xs text-slate-400">
                  {course.department ||
                    course.category_name ||
                    'General'}
                </span>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    course.status ===
                    'published'
                      ? 'bg-emerald-50 text-emerald-600'
                      : course.status ===
                        'pending'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {course.status ===
                  'published'
                    ? 'Published'
                    : course.status ===
                      'pending'
                    ? 'Pending Review'
                    : course.status}
                </span>

              </div>

              <h1 className="text-xl font-bold text-slate-900 mt-1">
                {course.title}
              </h1>

            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            <button
              onClick={() =>
                setIsEditing(
                  !isEditing
                )
              }
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                isEditing
                  ? 'bg-amber-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />

              {isEditing
                ? 'Exit Edit Mode'
                : 'Edit Course'}
            </button>

            <Link
              to={`/instructor/courses/${courseId}/stats`}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              Course Stats
            </Link>

            <Link
              to={`/instructor/courses/${courseId}/submissions`}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              All Submissions
            </Link>

            <Link
              to={`/instructor/create-assignment?courseId=${courseId}`}
              className="px-4 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Assignment
            </Link>

            <Link
              to={`/instructor/create-quiz?courseId=${courseId}`}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Create Quiz
            </Link>

          </div>
        </div>

        {/* COURSE INFORMATION */}

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">

          <div className="bg-white p-4 rounded-2xl border border-slate-100">
            <p className="text-[11px] text-slate-400">
              Category
            </p>

            <p className="text-sm font-bold text-slate-800 mt-1">
              {course.category_name ||
                'General'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100">
            <p className="text-[11px] text-slate-400">
              Difficulty
            </p>

            <p className="text-sm font-bold text-slate-800 mt-1">
              {course.difficulty ||
                'Beginner'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100">
            <p className="text-[11px] text-slate-400">
              Duration
            </p>

            <p className="text-sm font-bold text-slate-800 mt-1">
              {course.duration_weeks
                ? `${course.duration_weeks} weeks`
                : '—'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100">
            <p className="text-[11px] text-slate-400">
              Lessons
            </p>

            <p className="text-sm font-bold text-slate-800 mt-1">
              {lessons.length}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100">
            <p className="text-[11px] text-slate-400">
              Quizzes
            </p>

            <p className="text-sm font-bold text-slate-800 mt-1">
              {quizzes.length}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100">
            <p className="text-[11px] text-slate-400">
              Enrolled
            </p>

            <p className="text-sm font-bold text-slate-800 mt-1">
              {course.enrolled_count ??
                students.length}
            </p>
          </div>

        </div>

        {/* SECTION NAVIGATION */}

        <div className="flex border-b border-slate-200 text-xs font-semibold gap-8 overflow-x-auto">

          <button
            onClick={() =>
              setActiveSection(
                'curriculum'
              )
            }
            className={`pb-3 border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeSection ===
              'curriculum'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-400'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Description & Curriculum
          </button>

          <button
            onClick={() =>
              setActiveSection(
                'assignments'
              )
            }
            className={`pb-3 border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeSection ===
              'assignments'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-400'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            Course Assignments ({assignments.length})
          </button>

          <button
            onClick={() =>
              setActiveSection(
                'quizzes'
              )
            }
            className={`pb-3 border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeSection === 'quizzes'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Quizzes ({quizzes.length})
          </button>

          <button
            onClick={() =>
              setActiveSection(
                'students'
              )
            }
            className={`pb-3 border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeSection ===
              'students'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-400'
            }`}
          >
            <Users className="w-4 h-4" />
            Enrolled Students ({students.length})
          </button>

        </div>

        {/* CURRICULUM */}

        {activeSection ===
          'curriculum' && (
          <div className="space-y-8">

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">

              <h2 className="text-base font-bold text-slate-900">
                Course Overview & Objectives
              </h2>

              <p className="mt-3 text-xs text-slate-600 leading-relaxed max-w-5xl">
                {course.description ||
                  'No course description has been provided yet.'}
              </p>

              {course.learning_outcomes && (
                <div className="mt-5">

                  <h3 className="text-sm font-bold text-slate-800">
                    Learning Outcomes
                  </h3>

                  <ul className="mt-3 space-y-2">

                    {(() => {
                      try {
                        const outcomes =
                          typeof course.learning_outcomes ===
                          'string'
                            ? JSON.parse(
                                course.learning_outcomes
                              )
                            : course.learning_outcomes;

                        return (
                          Array.isArray(
                            outcomes
                          ) &&
                          outcomes.map(
                            (
                              outcome,
                              index
                            ) => (
                              <li
                                key={index}
                                className="text-xs text-slate-600 flex gap-2"
                              >
                                <span className="text-brand-600 font-bold">
                                  •
                                </span>

                                {outcome}
                              </li>
                            )
                          )
                        );
                      } catch {
                        return null;
                      }
                    })()}

                  </ul>

                </div>
              )}

            </div>

            <div className="flex justify-between items-center">

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Curriculum Outline
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Real modules and lessons from this course.
                </p>
              </div>

              {isEditing && (
                <Link
                  to={`/instructor/lesson-editor?courseId=${courseId}`}
                  className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Manage Lessons
                </Link>
              )}

            </div>

            {modules.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center">

                <BookOpen className="w-10 h-10 mx-auto text-slate-300" />

                <h3 className="mt-3 text-sm font-bold text-slate-800">
                  No lessons yet
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Add lessons to this course from the lesson editor.
                </p>

              </div>
            ) : (
              <div className="space-y-5">

                {modules.map(
                  (module) => (
                    <div
                      key={
                        module.module_id
                      }
                      className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6"
                    >

                      <div className="flex justify-between items-start border-b border-slate-100 pb-4">

                        <div>

                          <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-600 px-2 py-0.5 rounded">
                            Module
                          </span>

                          <h3 className="text-base font-bold text-slate-900 mt-2">
                            {module.title}
                          </h3>

                        </div>

                        {isEditing &&
                          module.module_id !==
                            'uncategorized' && (
                            <div className="flex items-center gap-2">

                              <button
                                onClick={() =>
                                  openEditModule(
                                    module
                                  )
                                }
                                className="px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg text-xs font-semibold hover:bg-brand-100"
                              >
                                Edit Module
                              </button>

                              <button
                                onClick={() =>
                                  triggerDeleteModule(
                                    module
                                  )
                                }
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>

                            </div>
                          )}

                      </div>

                      <div className="mt-4 space-y-3">

                        {module.lessons.map(
                          (lesson) => (
                            <div
                              key={
                                lesson.lesson_id
                              }
                              className="p-4 rounded-2xl bg-[#F8F9FD] border border-slate-200/70 flex items-center justify-between"
                            >

                              <div className="flex items-center gap-3">

                                <PlayCircle className="w-5 h-5 text-brand-600" />

                                <div>

                                  <div className="text-xs font-bold text-slate-800">
                                    {lesson.title}
                                  </div>

                                  <span className="text-[11px] text-slate-400">
                                    {getLessonType(
                                      lesson
                                    )}
                                  </span>

                                </div>

                              </div>

                              <div className="flex items-center gap-2">

                                {isEditing && (
                                  <Link
                                    to={`/instructor/lesson-editor?courseId=${courseId}&lessonId=${lesson.lesson_id}`}
                                    className="px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg text-[11px] font-semibold hover:bg-brand-100"
                                  >
                                    Edit Content
                                  </Link>
                                )}

                                {isEditing && (
                                  <button
                                    onClick={() =>
                                      triggerDeleteLesson(
                                        lesson
                                      )
                                    }
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}

                              </div>

                            </div>
                          )
                        )}

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>
        )}

        {/* ASSIGNMENTS */}

        {activeSection ===
          'assignments' && (
          <div className="space-y-5">

            <div className="flex justify-between items-center">

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Course Assignments
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Assignments created for this course.
                </p>
              </div>

              <Link
                to={`/instructor/create-assignment?courseId=${courseId}`}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Assignment
              </Link>

            </div>

            {assignments.length ===
            0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center">

                <CheckSquare className="w-10 h-10 mx-auto text-slate-300" />

                <h3 className="mt-3 text-sm font-bold text-slate-800">
                  No assignments yet
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  Create the first assignment for this course.
                </p>

              </div>
            ) : (
              <div className="space-y-3">

                {assignments.map(
                  (assignment) => (
                    <div
                      key={
                        assignment.assignment_id
                      }
                      className="bg-white rounded-2xl border border-slate-100 p-5 flex justify-between items-center"
                    >

                      <div>

                        <h3 className="text-sm font-bold text-slate-900">
                          {assignment.title}
                        </h3>

                        <p className="text-xs text-slate-400 mt-1">
                          Due:{' '}
                          {formatDate(
                            assignment.deadline
                          )}
                          {' • '}
                          {assignment.max_marks ||
                            0}{' '}
                          Points
                        </p>

                      </div>

                      <Link
                        to={`/instructor/assignments/${courseId}/${assignment.assignment_id}`}
                        className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold"
                      >
                        Open Grading Desk
                      </Link>

                    </div>
                  )
                )}

              </div>
            )}

          </div>
        )}

        {/* QUIZZES */}

        {activeSection ===
          'quizzes' && (
          <div className="space-y-5">

            <div className="flex justify-between items-center">

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Course Quizzes
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Create and manage interactive quizzes for this course.
                </p>
              </div>

              <Link
                to={`/instructor/create-quiz?courseId=${courseId}`}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Quiz
              </Link>

            </div>

            {quizzes.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center">

                <HelpCircle className="w-10 h-10 mx-auto text-slate-300" />

                <h3 className="mt-3 text-sm font-bold text-slate-800">
                  No quizzes yet
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  Create the first quiz for this course.
                </p>

              </div>
            ) : (
              <div className="space-y-3">

                {quizzes.map(
                  (quiz) => (
                    <div
                      key={
                        quiz.quiz_id
                      }
                      className="bg-white rounded-2xl border border-slate-100 p-5 flex justify-between items-center gap-4"
                    >

                      <div className="min-w-0">

                        <div className="flex items-center gap-2">

                          <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />

                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {quiz.title}
                          </h3>

                        </div>

                        <p className="text-xs text-slate-400 mt-1">
                          {quiz.questions_count ||
                            0}{' '}
                          Questions
                          {' • '}
                          {quiz.total_marks ||
                            0}{' '}
                          Marks
                        </p>

                        {quiz.description && (
                          <p className="text-xs text-slate-500 mt-2 truncate max-w-xl">
                            {quiz.description}
                          </p>
                        )}

                      </div>

                      <Link
                        to={`/instructor/quizzes/${quiz.quiz_id}`}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shrink-0"
                      >
                        Manage Quiz
                      </Link>

                    </div>
                  )
                )}

              </div>
            )}

          </div>
        )}

        {/* STUDENTS */}

        {activeSection ===
          'students' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">

            <div className="flex justify-between items-center">

              <div>

                <h2 className="text-base font-bold text-slate-900">
                  Student Roster
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Students currently enrolled in this course.
                </p>

              </div>

              <button
                onClick={() =>
                  setShowEnrollModal(
                    true
                  )
                }
                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Enroll Student
              </button>

            </div>

            <div className="mt-6 overflow-x-auto">

              {students.length ===
              0 ? (
                <div className="py-10 text-center">

                  <Users className="w-10 h-10 mx-auto text-slate-300" />

                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No enrolled students
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    Students will appear here after enrollment.
                  </p>

                </div>
              ) : (
                <table className="w-full text-left text-xs">

                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400">

                      <th className="pb-3">
                        Student Name
                      </th>

                      <th className="pb-3">
                        Academic Email
                      </th>

                      <th className="pb-3">
                        Enrollment Date
                      </th>

                      <th className="pb-3">
                        Status
                      </th>

                      <th className="pb-3 text-right">
                        Action
                      </th>

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-50">

                    {students.map(
                      (student) => (
                        <tr
                          key={getStudentId(
                            student
                          )}
                          className="hover:bg-slate-50"
                        >

                          <td className="py-4 font-bold text-slate-800">
                            {getStudentName(
                              student
                            )}
                          </td>

                          <td className="py-4 text-slate-500">
                            {getStudentEmail(
                              student
                            )}
                          </td>

                          <td className="py-4 text-slate-500">
                            {formatDate(
                              student.enrolled_at
                            )}
                          </td>

                          <td className="py-4">

                            <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 font-semibold">
                              {student.status ||
                                'active'}
                            </span>

                          </td>

                          <td className="py-4 text-right">

                            <button
                              onClick={() =>
                                triggerRemoveStudent(
                                  student
                                )
                              }
                              className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg"
                            >
                              Remove
                            </button>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>
              )}

            </div>

          </div>
        )}

        {/* DELETE COURSE */}

        {isEditing && (
          <div className="border-t border-slate-200 pt-6">

            <button
              onClick={
                triggerDeleteCourse
              }
              className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100"
            >
              Delete This Course
            </button>

          </div>
        )}

      </main>

      {/* CONFIRM MODAL */}

      <ConfirmModal
        isOpen={
          modalConfig.isOpen
        }
        title={
          modalConfig.title
        }
        message={
          modalConfig.message
        }
        type={
          modalConfig.type
        }
        confirmText={
          modalConfig.confirmText
        }
        onConfirm={
          modalConfig.onConfirm
        }
        onClose={() =>
          setModalConfig(
            (prev) => ({
              ...prev,
              isOpen: false,
            })
          )
        }
      />

      {/* EDIT MODULE MODAL */}

      {showModuleEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">

          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl">

            <div className="flex justify-between items-center">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                  Module Editor
                </p>

                <h3 className="font-bold text-slate-900 mt-1">
                  Edit Module
                </h3>

              </div>

              <button
                type="button"
                onClick={() => {
                  setShowModuleEditModal(
                    false
                  );

                  setEditingModule(
                    null
                  );

                  setModuleTitle('');
                }}
                className="p-2 rounded-xl hover:bg-slate-50"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>

            </div>

            <form
              onSubmit={
                saveModuleEdit
              }
              className="mt-5 space-y-4"
            >

              <div>

                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Module Title
                </label>

                <input
                  value={moduleTitle}
                  onChange={(e) =>
                    setModuleTitle(
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-500"
                  placeholder="Enter module title"
                  autoFocus
                  required
                />

              </div>

              <div className="flex justify-end gap-2 pt-2">

                <button
                  type="button"
                  onClick={() => {
                    setShowModuleEditModal(
                      false
                    );

                    setEditingModule(
                      null
                    );

                    setModuleTitle('');
                  }}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    moduleSaving
                  }
                  className="px-4 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-semibold disabled:opacity-60 flex items-center gap-2"
                >

                  {moduleSaving && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}

                  {moduleSaving
                    ? 'Saving...'
                    : 'Save Changes'}

                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* ENROLL STUDENT MODAL */}

      {showEnrollModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">

          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl">

            <div className="flex justify-between items-center">

              <h3 className="font-bold text-slate-900">
                Enroll Student
              </h3>

              <button
                onClick={() =>
                  setShowEnrollModal(
                    false
                  )
                }
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>

            </div>

            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();

                alert(
                  'Enrollment API connection will be added after confirming the backend enrollment endpoint.'
                );

                setShowEnrollModal(
                  false
                );

                setNewStudentName(
                  ''
                );

                setNewStudentEmail(
                  ''
                );
              }}
            >

              <div>

                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Name
                </label>

                <input
                  value={
                    newStudentName
                  }
                  onChange={(e) =>
                    setNewStudentName(
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs"
                  placeholder="Student name"
                  required
                />

              </div>

              <div>

                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Email
                </label>

                <input
                  type="email"
                  value={
                    newStudentEmail
                  }
                  onChange={(e) =>
                    setNewStudentEmail(
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs"
                  placeholder="student@university.edu"
                  required
                />

              </div>

              <div className="flex justify-end gap-2 pt-2">

                <button
                  type="button"
                  onClick={() =>
                    setShowEnrollModal(
                      false
                    )
                  }
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
                >
                  Enroll Student
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}