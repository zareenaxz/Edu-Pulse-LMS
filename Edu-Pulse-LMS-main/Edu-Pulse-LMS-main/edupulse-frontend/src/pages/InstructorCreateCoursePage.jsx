import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InstructorSidebar from '../components/InstructorSidebar';
import { api, fileUrl } from '../api/client';

import {
  Check,
  GripVertical,
  Edit2,
  PlayCircle,
  FileText,
  Plus,
  Eye,
  Trash2,
  Layers,
  UploadCloud,
  X,
  Video,
  Music,
  FileArchive,
  File,
  Loader2,
} from 'lucide-react';

export default function CreateCoursePage() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [courseId, setCourseId] = useState(null);
  const [courseStatus, setCourseStatus] = useState('draft');

  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [pageError, setPageError] = useState('');
  const [message, setMessage] = useState('');

  // =====================================================
  // STEP 1
  // =====================================================

  const [categories, setCategories] = useState([]);

  const [meta, setMeta] = useState({
    title: '',
    code: '',
    dept: '',
    categoryId: '',
    level: 'Beginner',
    durationWeeks: '',
    description: '',
    outcomes: '',
  });

  // =====================================================
  // STEP 2
  // =====================================================

  const [modules, setModules] = useState([]);

  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [moduleTitle, setModuleTitle] = useState('');

  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);

  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    content: '',
    video_url: '',
  });

  const [lessonFiles, setLessonFiles] = useState([]);
  const [lessonAttachments, setLessonAttachments] = useState([]);

  const fileInputRef = useRef(null);

  // =====================================================
  // STEP 3
  // =====================================================

  const [pricing, setPricing] = useState({
    tier: 'standard',
    price: 89,
    maxStudents: 150,
    certificateEnabled: true,
  });

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await api.get('/categories');
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Could not load categories:', error);
    }
  };

  // =====================================================
  // HELPERS
  // =====================================================

  const showError = (error) => {
    setPageError(error?.message || 'Something went wrong.');
  };

  const clearMessages = () => {
    setPageError('');
    setMessage('');
  };

  const getLessonIcon = (attachment) => {
    const type = attachment?.file_type;

    if (type === 'video') {
      return <Video className="w-4 h-4" />;
    }

    if (type === 'audio') {
      return <Music className="w-4 h-4" />;
    }

    if (type === 'archive') {
      return <FileArchive className="w-4 h-4" />;
    }

    return <File className="w-4 h-4" />;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 KB';

    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  // =====================================================
  // STEP 1 - CREATE COURSE
  // =====================================================

  const handleCreateCourse = async () => {
    clearMessages();

    if (!meta.title.trim()) {
      setPageError('Course title is required.');
      return;
    }

    if (!meta.categoryId) {
      setPageError('Please select a category.');
      return;
    }

    setLoading(true);

    try {
      const outcomes = meta.outcomes
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

      const data = await api.post('/courses', {
        title: meta.title.trim(),
        course_code: meta.code.trim() || null,
        department: meta.dept.trim() || null,
        category_id: Number(meta.categoryId),
        difficulty: meta.level,
        duration_weeks: meta.durationWeeks
          ? Number(meta.durationWeeks)
          : null,
        description: meta.description.trim() || null,
        learning_outcomes: outcomes,
        price: pricing.price,
        max_students: pricing.maxStudents
          ? Number(pricing.maxStudents)
          : null,
        certificate_enabled: pricing.certificateEnabled ? 1 : 0,
      });

      const createdCourse = data.course;

      if (!createdCourse?.course_id) {
        throw new Error('Course was not created correctly.');
      }

      setCourseId(createdCourse.course_id);

      setCourseStatus(createdCourse.status || 'draft');

      setMessage(
        'Course created successfully. It is saved as a draft. You can publish it after your instructor account is approved.'
      );

      setCurrentStep(2);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD MODULES
  // =====================================================

  const loadModules = async () => {
    if (!courseId) return;

    try {
      const data = await api.get(`/courses/${courseId}/modules`);
      setModules(data.modules || []);
    } catch (error) {
      showError(error);
    }
  };

  useEffect(() => {
    if (courseId && currentStep === 2) {
      loadModules();
    }
  }, [courseId, currentStep]);

  // =====================================================
  // MODULE CREATE / EDIT
  // =====================================================

  const openAddModule = () => {
    setEditingModule(null);
    setModuleTitle('');
    setShowModuleModal(true);
  };

  const openEditModule = (module) => {
    setEditingModule(module);
    setModuleTitle(module.title || '');
    setShowModuleModal(true);
  };

  const saveModule = async () => {
    if (!moduleTitle.trim()) {
      setPageError('Module title is required.');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      if (editingModule) {
        await api.patch(
          `/courses/${courseId}/modules/${editingModule.module_id}`,
          {
            title: moduleTitle.trim(),
          }
        );

        setMessage('Module updated successfully.');
      } else {
        await api.post(`/courses/${courseId}/modules`, {
          title: moduleTitle.trim(),
        });

        setMessage('Module created successfully.');
      }

      setShowModuleModal(false);
      setModuleTitle('');

      await loadModules();
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteModule = async (module) => {
    const confirmed = window.confirm(
      `Delete "${module.title}"?\n\nLessons inside this module will no longer belong to this module.`
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/courses/${courseId}/modules/${module.module_id}`
      );

      await loadModules();

      setMessage('Module deleted successfully.');
    } catch (error) {
      showError(error);
    }
  };

  // =====================================================
  // LESSON CREATE / EDIT
  // =====================================================

  const openAddLesson = (module) => {
    setSelectedModule(module);
    setEditingLesson(null);

    setLessonForm({
      title: '',
      description: '',
      content: '',
      video_url: '',
    });

    setLessonFiles([]);
    setLessonAttachments([]);

    setShowLessonModal(true);
  };

  const openEditLesson = async (module, lesson) => {
    setSelectedModule(module);
    setEditingLesson(lesson);

    setLessonForm({
      title: lesson.title || '',
      description: lesson.description || '',
      content: lesson.content || '',
      video_url: lesson.video_url || '',
    });

    setLessonFiles([]);

    try {
      const data = await api.get(
        `/courses/${courseId}/lessons/${lesson.lesson_id}`
      );

      setLessonAttachments(data.lesson?.attachments || []);
    } catch (error) {
      setLessonAttachments([]);
    }

    setShowLessonModal(true);
  };

  const saveLesson = async () => {
    if (!selectedModule) return;

    if (!lessonForm.title.trim()) {
      setPageError('Lesson title is required.');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      let lesson;

      if (editingLesson) {
        const data = await api.patch(
          `/courses/${courseId}/lessons/${editingLesson.lesson_id}`,
          {
            title: lessonForm.title.trim(),
            description: lessonForm.description.trim(),
            content: lessonForm.content,
            video_url: lessonForm.video_url.trim(),
            module_id: selectedModule.module_id,
          }
        );

        lesson = data.lesson;
      } else {
        const data = await api.post(
          `/courses/${courseId}/lessons`,
          {
            title: lessonForm.title.trim(),
            description: lessonForm.description.trim(),
            content: lessonForm.content,
            video_url: lessonForm.video_url.trim(),
            module_id: selectedModule.module_id,
          }
        );

        lesson = data.lesson;
      }

      // Upload files after lesson exists
      if (lessonFiles.length > 0 && lesson?.lesson_id) {
        const formData = new FormData();

        lessonFiles.forEach((file) => {
          formData.append('files', file);
        });

        const attachmentData = await api.upload(
          `/courses/${courseId}/lessons/${lesson.lesson_id}/attachments`,
          formData
        );

        setLessonAttachments(
          attachmentData.attachments || []
        );
      }

      setShowLessonModal(false);

      setMessage(
        editingLesson
          ? 'Lesson updated successfully.'
          : 'Lesson created successfully.'
      );

      await loadModules();
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteLesson = async (module, lesson) => {
    const confirmed = window.confirm(
      `Delete "${lesson.title}"?`
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/courses/${courseId}/lessons/${lesson.lesson_id}`
      );

      await loadModules();

      setMessage('Lesson deleted successfully.');
    } catch (error) {
      showError(error);
    }
  };

  // =====================================================
  // DELETE ATTACHMENT
  // =====================================================

  const deleteAttachment = async (attachment) => {
    const confirmed = window.confirm(
      `Delete "${attachment.original_name}"?`
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/courses/${courseId}/lessons/${editingLesson.lesson_id}/attachments/${attachment.attachment_id}`
      );

      setLessonAttachments((previous) =>
        previous.filter(
          (item) =>
            item.attachment_id !== attachment.attachment_id
        )
      );
    } catch (error) {
      showError(error);
    }
  };

  // =====================================================
  // STEP 3 - SAVE PRICING
  // =====================================================

  const savePricing = async () => {
    if (!courseId) return;

    setLoading(true);
    clearMessages();

    try {
      const data = await api.patch(`/courses/${courseId}`, {
        price:
          pricing.tier === 'free'
            ? 0
            : Number(pricing.price) || 0,

        max_students: pricing.maxStudents
          ? Number(pricing.maxStudents)
          : null,

        certificate_enabled:
          pricing.certificateEnabled ? 1 : 0,
      });

      if (data?.course?.status) {
        setCourseStatus(data.course.status);
      }

      setMessage('Course access settings saved.');
      setCurrentStep(4);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // PUBLISH COURSE
  // =====================================================

  const handlePublishCourse = async () => {
    if (!courseId || publishing) return;

    clearMessages();
    setPublishing(true);

    try {
      const data = await api.patch(`/courses/${courseId}`, {
        status: 'published',
      });

      setCourseStatus(
        data?.course?.status || 'published'
      );

      setMessage(
        'Course published successfully. It is now available in the student catalog.'
      );
    } catch (error) {
      /*
       * For a pending instructor, the backend returns:
       *
       * "Your instructor account is still not approved by the admin. You cannot publish courses until your account is approved."
       *
       * showError displays that exact backend message.
       */
      showError(error);
    } finally {
      setPublishing(false);
    }
  };

  // =====================================================
  // STEP NAVIGATION
  // =====================================================

  const goToStep = (step) => {
    if (step === 1) {
      setCurrentStep(1);
      return;
    }

    if (!courseId) {
      setPageError('Please create the course first.');
      return;
    }

    setCurrentStep(step);
  };

  // =====================================================
  // UI
  // =====================================================

  const steps = [
    { num: 1, label: 'Course Identification' },
    { num: 2, label: 'Syllabus Architect' },
    { num: 3, label: 'Pricing & Capacity' },
    { num: 4, label: 'Live Preview' },
  ];

  const isPublished = courseStatus === 'published';

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">

      <InstructorSidebar />

      <main className="flex-1 p-8 overflow-y-auto space-y-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
              Course Studio
            </span>

            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              {currentStep === 1 &&
                'Step 1: Course Identity & Learning Outcomes'}

              {currentStep === 2 &&
                'Step 2: Syllabus & Module Architect'}

              {currentStep === 3 &&
                'Step 3: Access Tiers & Enrollment Capacity'}

              {currentStep === 4 &&
                'Step 4: Student Portal Preview'}
            </h1>
          </div>

          {courseId && (
            <button
              onClick={() => setCurrentStep(4)}
              className="px-4 py-2 bg-brand-50 text-brand-600 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview Course
            </button>
          )}
        </div>

        {/* ERROR */}
        {pageError && (
          <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold">
            {pageError}
          </div>
        )}

        {/* SUCCESS */}
        {message && (
          <div className="max-w-4xl mx-auto bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-xs font-semibold">
            {message}
          </div>
        )}

        {/* STEPPER */}
        <div className="max-w-2xl mx-auto py-3 flex justify-between items-center relative">

          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 -z-0" />

          {steps.map((step) => {

            const completed = currentStep > step.num;
            const current = currentStep === step.num;

            return (
              <div
                key={step.num}
                onClick={() => goToStep(step.num)}
                className="flex flex-col items-center gap-1 bg-[#F8F9FD] px-3 z-10 cursor-pointer"
              >

                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                    completed
                      ? 'bg-slate-900 text-white'
                      : current
                      ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {completed ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step.num
                  )}
                </div>

                <span
                  className={`text-[10px] font-bold ${
                    current
                      ? 'text-brand-600'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* ================================================= */}
        {/* STEP 1 */}
        {/* ================================================= */}

        {currentStep === 1 && (
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-5">

            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Course Identity
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Course Title *
              </label>

              <input
                value={meta.title}
                onChange={(e) =>
                  setMeta({
                    ...meta,
                    title: e.target.value,
                  })
                }
                placeholder="e.g. JavaScript Fundamentals"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Course Code
                </label>

                <input
                  value={meta.code}
                  onChange={(e) =>
                    setMeta({
                      ...meta,
                      code: e.target.value,
                    })
                  }
                  placeholder="CSE-101"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department
                </label>

                <input
                  value={meta.dept}
                  onChange={(e) =>
                    setMeta({
                      ...meta,
                      dept: e.target.value,
                    })
                  }
                  placeholder="Computer Science"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none"
                />
              </div>

            </div>

            <div className="grid sm:grid-cols-3 gap-4">

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category *
                </label>

                <select
                  value={meta.categoryId}
                  onChange={(e) =>
                    setMeta({
                      ...meta,
                      categoryId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                >
                  <option value="">
                    Select category
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.category_id}
                      value={category.category_id}
                    >
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Level
                </label>

                <select
                  value={meta.level}
                  onChange={(e) =>
                    setMeta({
                      ...meta,
                      level: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Duration (weeks)
                </label>

                <input
                  type="number"
                  min="1"
                  value={meta.durationWeeks}
                  onChange={(e) =>
                    setMeta({
                      ...meta,
                      durationWeeks: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description
              </label>

              <textarea
                rows="4"
                value={meta.description}
                onChange={(e) =>
                  setMeta({
                    ...meta,
                    description: e.target.value,
                  })
                }
                placeholder="Describe what students will learn..."
                className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Learning Outcomes
              </label>

              <textarea
                rows="4"
                value={meta.outcomes}
                onChange={(e) =>
                  setMeta({
                    ...meta,
                    outcomes: e.target.value,
                  })
                }
                placeholder={
                  'One outcome per line\nUnderstand JavaScript basics\n'
                }
                className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-medium"
              />
            </div>

            <div className="flex justify-end pt-4">

              <button
                disabled={loading}
                onClick={handleCreateCourse}
                className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-50"
              >
                {loading && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}

                Create Course & Continue →
              </button>

            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* STEP 2 */}
        {/* ================================================= */}

        {currentStep === 2 && (
          <div className="max-w-4xl mx-auto space-y-6">

            <div className="flex justify-between items-center">

              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Module & Lesson Outline
                </h3>

                <p className="text-xs text-slate-400 mt-1">
                  Create modules, lessons and upload any supported learning resources.
                </p>
              </div>

              <button
                onClick={openAddModule}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add New Module
              </button>

            </div>

            {modules.length === 0 && (
              <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">

                <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />

                <h3 className="text-sm font-bold text-slate-700">
                  No modules yet
                </h3>

                <p className="text-xs text-slate-400 mt-1">
                  Start by creating your first module.
                </p>

                <button
                  onClick={openAddModule}
                  className="mt-5 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold"
                >
                  + Create First Module
                </button>

              </div>
            )}

            <div className="space-y-4">

              {modules.map((module) => (

                <div
                  key={module.module_id}
                  className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6"
                >

                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">

                    <div className="flex items-center gap-3">

                      <GripVertical className="w-4 h-4 text-slate-300" />

                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {module.title}
                        </h4>

                        <p className="text-[10px] text-slate-400 mt-1">
                          {module.lessons?.length || 0} lesson(s)
                        </p>
                      </div>

                    </div>

                    <div className="flex items-center gap-3">

                      <button
                        onClick={() => openEditModule(module)}
                        className="text-xs font-bold text-slate-500 hover:text-brand-600"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline mr-1" />
                        Edit
                      </button>

                      <button
                        onClick={() => deleteModule(module)}
                        className="text-xs font-bold text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                        Delete
                      </button>

                      <button
                        onClick={() => openAddLesson(module)}
                        className="px-3 py-2 bg-brand-50 text-brand-600 rounded-xl text-xs font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Lesson
                      </button>

                    </div>

                  </div>

                  <div className="space-y-2 mt-4">

                    {(!module.lessons ||
                      module.lessons.length === 0) && (

                      <div className="py-6 text-center text-xs text-slate-400">
                        No lessons in this module yet.
                      </div>
                    )}

                    {module.lessons?.map((lesson) => (

                      <div
                        key={lesson.lesson_id}
                        className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between gap-4"
                      >

                        <div className="flex items-center gap-3 min-w-0">

                          <PlayCircle className="w-4 h-4 text-brand-600 flex-shrink-0" />

                          <div className="min-w-0">
                            <div className="font-bold text-xs text-slate-800 truncate">
                              {lesson.title}
                            </div>

                            {lesson.video_url && (
                              <div className="text-[10px] text-slate-400 mt-1">
                                Video content available
                              </div>
                            )}
                          </div>

                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">

                          <button
                            onClick={() =>
                              openEditLesson(module, lesson)
                            }
                            className="text-xs font-bold text-brand-600"
                          >
                            Edit Content
                          </button>

                          <button
                            onClick={() =>
                              deleteLesson(module, lesson)
                            }
                            className="text-xs font-bold text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>

                      </div>
                    ))}

                  </div>

                </div>
              ))}

            </div>

            <div className="flex justify-between pt-4 border-t border-slate-200">

              <button
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold"
              >
                ← Back
              </button>

              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold"
              >
                Continue to Pricing →
              </button>

            </div>

          </div>
        )}

        {/* ================================================= */}
        {/* STEP 3 */}
        {/* ================================================= */}

        {currentStep === 3 && (
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">

            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Course Access & Capacity
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">

              <div
                onClick={() =>
                  setPricing({
                    ...pricing,
                    tier: 'standard',
                  })
                }
                className={`p-5 rounded-2xl border-2 cursor-pointer ${
                  pricing.tier === 'standard'
                    ? 'border-brand-600 bg-brand-50/40'
                    : 'border-slate-200'
                }`}
              >

                <div className="font-bold text-xs text-brand-600 uppercase">
                  Paid Course
                </div>

                <div className="text-3xl font-extrabold text-slate-900 mt-2">
                  ${pricing.price}
                </div>

                <p className="text-[11px] text-slate-500 mt-1">
                  Full course access with certificate eligibility.
                </p>

              </div>

              <div
                onClick={() =>
                  setPricing({
                    ...pricing,
                    tier: 'free',
                  })
                }
                className={`p-5 rounded-2xl border-2 cursor-pointer ${
                  pricing.tier === 'free'
                    ? 'border-brand-600 bg-brand-50/40'
                    : 'border-slate-200'
                }`}
              >

                <div className="font-bold text-xs text-slate-600 uppercase">
                  Free Course
                </div>

                <div className="text-3xl font-extrabold text-slate-900 mt-2">
                  $0
                </div>

                <p className="text-[11px] text-slate-500 mt-1">
                  Students can access the course without payment.
                </p>

              </div>

            </div>

            {pricing.tier === 'standard' && (
              <div>

                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Course Price
                </label>

                <input
                  type="number"
                  min="0"
                  value={pricing.price}
                  onChange={(e) =>
                    setPricing({
                      ...pricing,
                      price: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                />

              </div>
            )}

            <div>

              <label className="block text-xs font-bold text-slate-700 mb-1">
                Maximum Enrolled Seat Limit
              </label>

              <input
                type="number"
                min="1"
                value={pricing.maxStudents}
                onChange={(e) =>
                  setPricing({
                    ...pricing,
                    maxStudents: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              />

            </div>

            <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer">

              <input
                type="checkbox"
                checked={pricing.certificateEnabled}
                onChange={(e) =>
                  setPricing({
                    ...pricing,
                    certificateEnabled: e.target.checked,
                  })
                }
              />

              <div>
                <div className="text-xs font-bold text-slate-800">
                  Enable Certificate
                </div>

                <div className="text-[10px] text-slate-400">
                  Students can receive a certificate after completing the course.
                </div>
              </div>

            </label>

            <div className="flex justify-between pt-4 border-t border-slate-100">

              <button
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold"
              >
                ← Back
              </button>

              <button
                disabled={loading}
                onClick={savePricing}
                className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save & Preview →'}
              </button>

            </div>

          </div>
        )}

        {/* ================================================= */}
        {/* STEP 4 */}
        {/* ================================================= */}

        {currentStep === 4 && (
          <div className="max-w-4xl mx-auto space-y-6">

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">

              <div className="h-56 bg-slate-950 relative p-8 flex flex-col justify-end text-white">

                <span className="text-[10px] font-bold text-brand-300 uppercase tracking-widest">
                  {meta.dept || 'EduPulse Course'}
                </span>

                <h1 className="text-2xl font-extrabold mt-1">
                  {meta.title || 'Untitled Course'}
                </h1>

                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  {meta.description || 'No description provided.'}
                </p>

              </div>

              <div className="p-8 space-y-6">

                <div>

                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                    Curriculum Preview
                  </h4>

                  <div className="space-y-4">

                    {modules.map((module) => (

                      <div key={module.module_id}>

                        <div className="font-bold text-sm text-slate-800 mb-2">
                          {module.title}
                        </div>

                        <div className="space-y-2">

                          {module.lessons?.map((lesson) => (

                            <div
                              key={lesson.lesson_id}
                              className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-700"
                            >

                              <span className="flex items-center gap-2">
                                <PlayCircle className="w-4 h-4 text-brand-600" />
                                {lesson.title}
                              </span>

                              <span className="text-slate-400">
                                Lesson
                              </span>

                            </div>

                          ))}

                        </div>

                      </div>
                    ))}

                  </div>

                </div>

                {/* COURSE PUBLISH STATUS */}
                <div
                  className={`p-4 rounded-2xl border ${
                    isPublished
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >

                  <div
                    className={`text-xs font-bold ${
                      isPublished
                        ? 'text-emerald-800'
                        : 'text-slate-800'
                    }`}
                  >
                    {isPublished
                      ? 'Course Published'
                      : 'Course Ready to Publish'}
                  </div>

                  <p
                    className={`text-[11px] mt-1 ${
                      isPublished
                        ? 'text-emerald-700'
                        : 'text-slate-600'
                    }`}
                  >
                    {isPublished
                      ? 'This course is published and available in the student catalog.'
                      : 'This course is saved as a draft. Approved instructors can publish it directly. Pending instructor accounts cannot publish until their instructor account is approved by the admin.'}
                  </p>

                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100 gap-3">

                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    ← Edit Pricing
                  </button>

                  <div className="flex items-center gap-3">

                    {!isPublished && (
                      <button
                        disabled={publishing}
                        onClick={handlePublishCourse}
                        className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-50"
                      >

                        {publishing && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}

                        {publishing
                          ? 'Publishing...'
                          : 'Publish Course'}
                      </button>
                    )}

                    <button
                      onClick={() =>
                        navigate('/instructor/courses')
                      }
                      className="px-6 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl text-xs font-bold"
                    >
                      Done — View My Courses
                    </button>

                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* ================================================= */}
      {/* MODULE MODAL */}
      {/* ================================================= */}

      {showModuleModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">

          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-6">

            <div className="flex justify-between items-center mb-5">

              <h2 className="text-lg font-extrabold text-slate-900">
                {editingModule
                  ? 'Edit Module'
                  : 'Create New Module'}
              </h2>

              <button
                onClick={() => setShowModuleModal(false)}
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>

            </div>

            <label className="block text-xs font-bold text-slate-700 mb-1">
              Module Title
            </label>

            <input
              autoFocus
              value={moduleTitle}
              onChange={(e) =>
                setModuleTitle(e.target.value)
              }
              placeholder="e.g. Module 1: JavaScript Basics"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500"
            />

            <button
              disabled={loading}
              onClick={saveModule}
              className="w-full mt-5 py-3 bg-brand-600 text-white rounded-xl text-xs font-bold"
            >
              {loading
                ? 'Saving...'
                : editingModule
                ? 'Update Module'
                : 'Create Module'}
            </button>

          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* LESSON MODAL */}
      {/* ================================================= */}

      {showLessonModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">

          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-6">

            <div className="flex justify-between items-center mb-5">

              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {editingLesson
                    ? 'Edit Lesson'
                    : 'Create Lesson'}
                </h2>

                <p className="text-[10px] text-slate-400 mt-1">
                  Module: {selectedModule?.title}
                </p>
              </div>

              <button
                onClick={() => setShowLessonModal(false)}
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>

            </div>

            <div className="space-y-4">

              {/* TITLE */}

              <div>

                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lesson Title *
                </label>

                <input
                  value={lessonForm.title}
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g. Introduction to Variables"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                />

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Short Description
                </label>

                <textarea
                  rows="2"
                  value={lessonForm.description}
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs"
                />

              </div>

              {/* CONTENT */}

              <div>

                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lesson Content / Notes
                </label>

                <textarea
                  rows="6"
                  value={lessonForm.content}
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      content: e.target.value,
                    })
                  }
                  placeholder="Write lesson notes, explanations, instructions, etc."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs"
                />

              </div>

              {/* VIDEO URL */}

              <div>

                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Video URL
                </label>

                <input
                  value={lessonForm.video_url}
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      video_url: e.target.value,
                    })
                  }
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
                />

              </div>

              {/* FILE UPLOAD */}

              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5">

                <div className="text-center">

                  <UploadCloud className="w-8 h-8 text-brand-600 mx-auto" />

                  <h3 className="text-xs font-bold text-slate-800 mt-2">
                    Upload Lesson Resources
                  </h3>

                  <p className="text-[10px] text-slate-400 mt-1">
                    Video, audio, PDF, PPT, DOC, ZIP, images, code files and more.
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) =>
                      setLessonFiles(
                        Array.from(e.target.files || [])
                      )
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="mt-3 px-4 py-2 bg-brand-50 text-brand-600 rounded-xl text-xs font-bold"
                  >
                    Choose Files
                  </button>

                </div>

                {lessonFiles.length > 0 && (
                  <div className="mt-4 space-y-2">

                    {lessonFiles.map((file, index) => (

                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between bg-slate-50 p-3 rounded-xl"
                      >

                        <div className="flex items-center gap-2 min-w-0">

                          <FileText className="w-4 h-4 text-brand-600 flex-shrink-0" />

                          <div className="min-w-0">

                            <div className="text-[10px] font-bold text-slate-700 truncate">
                              {file.name}
                            </div>

                            <div className="text-[9px] text-slate-400">
                              {formatSize(file.size)}
                            </div>

                          </div>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setLessonFiles((previous) =>
                              previous.filter(
                                (_, i) => i !== index
                              )
                            )
                          }
                          className="text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>

                      </div>

                    ))}

                  </div>
                )}

              </div>

              {/* EXISTING ATTACHMENTS */}

              {lessonAttachments.length > 0 && (
                <div>

                  <h3 className="text-xs font-bold text-slate-800 mb-2">
                    Existing Resources
                  </h3>

                  <div className="space-y-2">

                    {lessonAttachments.map((attachment) => (

                      <div
                        key={attachment.attachment_id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                      >

                        <a
                          href={fileUrl(attachment.file_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 min-w-0"
                        >

                          <span className="text-brand-600">
                            {getLessonIcon(attachment)}
                          </span>

                          <div className="min-w-0">

                            <div className="text-[10px] font-bold text-slate-700 truncate">
                              {attachment.original_name}
                            </div>

                            <div className="text-[9px] text-slate-400">
                              {formatSize(attachment.file_size)}
                            </div>

                          </div>

                        </a>

                        {editingLesson && (
                          <button
                            type="button"
                            onClick={() =>
                              deleteAttachment(attachment)
                            }
                            className="text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                      </div>

                    ))}

                  </div>

                </div>
              )}

              {/* SAVE */}

              <button
                disabled={loading}
                onClick={saveLesson}
                className="w-full py-3 bg-brand-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >

                {loading && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}

                {loading
                  ? 'Saving...'
                  : editingLesson
                  ? 'Update Lesson'
                  : 'Create Lesson'}

              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}