import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import InstructorSidebar from '../components/InstructorSidebar';
import { LessonFilesManager } from '../components/LessonFiles';
import {
  ArrowLeft,
  Video,
  FileText,
  Code2,
  Save,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { api } from '../api/client';

export default function LessonEditorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const courseId = searchParams.get('courseId');
  const lessonId = searchParams.get('lessonId');

  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  const [lessonType, setLessonType] = useState('video');

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');

  // IMPORTANT:
  // This fixes the "module_id is not defined" problem.
  const [moduleId, setModuleId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');

  // --------------------------------------------------
  // LOAD EXISTING LESSON
  // --------------------------------------------------

  useEffect(() => {
    const loadLesson = async () => {
      if (!courseId || !lessonId) {
        setLoading(false);
        setError('Course ID or Lesson ID is missing.');
        return;
      }

      try {
        setLoading(true);
        setError('');

        const data = await api.get(
          `/courses/${courseId}/lessons/${lessonId}`
        );

        const lesson = data?.lesson;

        if (!lesson) {
          throw new Error('Lesson data was not returned by the server.');
        }

        // ----------------------------------------------
        // REAL DATABASE VALUES
        // ----------------------------------------------

        setTitle(lesson.title || '');
        setDescription(lesson.description || '');
        setContent(lesson.content || '');
        setVideoUrl(lesson.video_url || '');

        // This is the important part.
        setModuleId(
          lesson.module_id !== undefined && lesson.module_id !== null
            ? lesson.module_id
            : null
        );

        // ----------------------------------------------
        // Detect lesson type from actual data
        // ----------------------------------------------

        if (lesson.video_url) {
          setLessonType('video');
        } else if (lesson.content) {
          setLessonType('article');
        } else {
          setLessonType('quiz');
        }

      } catch (err) {
        console.error('Failed to load lesson:', err);

        setError(
          err?.message ||
            err?.response?.data?.message ||
            'Failed to load lesson.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [courseId, lessonId]);

  // --------------------------------------------------
  // SAVE LESSON
  // --------------------------------------------------

  const handleSave = async (e) => {
    e.preventDefault();

    if (!courseId || !lessonId) {
      setError('Cannot save: Course ID or Lesson ID is missing.');
      return;
    }

    if (!title.trim()) {
      setError('Lesson title is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setIsSaved(false);

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        content: content || null,
        video_url: videoUrl.trim() || null,

        // IMPORTANT:
        // module_id is now a defined state variable.
        module_id: moduleId || null,
      };

      console.log('Saving lesson:', payload);

      const data = await api.patch(
        `/courses/${courseId}/lessons/${lessonId}`,
        payload
      );

      console.log('Lesson saved:', data);

      setIsSaved(true);

      // Give the user a moment to see "Saved"
      setTimeout(() => {
        navigate(`/instructor/courses/${courseId}`);
      }, 700);

    } catch (err) {
      console.error('Failed to save lesson:', err);

      setError(
        err?.message ||
          err?.response?.data?.message ||
          'Failed to save lesson.'
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FD]">
        <InstructorSidebar role="instructor" title="EduPulse" />

        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">
              Loading lesson...
            </span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <InstructorSidebar role="instructor" title="EduPulse" />

      <main className="flex-1 p-8 overflow-y-auto">

        {/* --------------------------------------------------
            HEADER
        -------------------------------------------------- */}

        <div className="flex items-center justify-between border-b border-slate-200 pb-5 mb-6">

          <div className="flex items-center gap-3">

            <Link
              to={`/instructor/courses/${courseId}`}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                Course Authoring Studio
              </span>

              <h1 className="text-xl font-bold text-slate-900 mt-1">
                Lesson & Resource Editor
              </h1>
            </div>

          </div>

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() =>
                navigate(`/instructor/courses/${courseId}`)
              }
              className="px-4 py-2 border border-slate-200 bg-white text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="lesson-editor-form"
              disabled={saving}
              className="px-5 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 shadow-md shadow-brand-500/20 flex items-center gap-1.5 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSaved ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}

              {saving
                ? 'Saving...'
                : isSaved
                ? 'Saved'
                : 'Save Lesson'}
            </button>

          </div>
        </div>

        {/* --------------------------------------------------
            ERROR
        -------------------------------------------------- */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* --------------------------------------------------
            FORM
        -------------------------------------------------- */}

        <form
          id="lesson-editor-form"
          onSubmit={handleSave}
          className="max-w-5xl space-y-6"
        >

          {/* --------------------------------------------------
              FORMAT SELECTOR
          -------------------------------------------------- */}

          <div className="grid grid-cols-3 gap-4">

            {/* VIDEO */}

            <button
              type="button"
              onClick={() => setLessonType('video')}
              className={`text-left p-4 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                lessonType === 'video'
                  ? 'border-brand-600 bg-brand-50/50 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Video Lesson
                </h4>

                <p className="text-[11px] text-slate-400">
                  Streamed video with resources
                </p>
              </div>
            </button>

            {/* ARTICLE */}

            <button
              type="button"
              onClick={() => setLessonType('article')}
              className={`text-left p-4 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                lessonType === 'article'
                  ? 'border-brand-600 bg-brand-50/50 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Interactive Reading
                </h4>

                <p className="text-[11px] text-slate-400">
                  Markdown, equations, notes
                </p>
              </div>
            </button>

            {/* QUIZ */}

            <button
              type="button"
              onClick={() => setLessonType('quiz')}
              className={`text-left p-4 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                lessonType === 'quiz'
                  ? 'border-brand-600 bg-brand-50/50 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Knowledge Check
                </h4>

                <p className="text-[11px] text-slate-400">
                  In-line practice questions
                </p>
              </div>
            </button>

          </div>

          {/* --------------------------------------------------
              LESSON IDENTIFICATION
          -------------------------------------------------- */}

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">

            <h3 className="text-sm font-bold text-slate-900">
              Lesson Identification
            </h3>

            <div className="grid sm:grid-cols-3 gap-4">

              <div className="sm:col-span-2">

                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lesson Title
                </label>

                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                />

              </div>

              <div>

                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Duration
                </label>

                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 15:00 or 25 mins"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-none"
                />

              </div>

            </div>

          </div>

          {/* --------------------------------------------------
              DESCRIPTION
          -------------------------------------------------- */}

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">

            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Lesson Description
            </h3>

            <textarea
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what students will learn in this lesson..."
              className="w-full p-4 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-brand-500"
            />

          </div>

          {/* --------------------------------------------------
              VIDEO CONTENT
          -------------------------------------------------- */}

          {lessonType === 'video' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">

              <h3 className="text-sm font-bold text-slate-900">
                Video Master File
              </h3>

              <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-4">
                Upload video files from the Lesson Files section below.
                Video files are stored on the server and can be accessed
                by students.
              </p>

              <div>

                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Video URL
                </label>

                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Optional YouTube / Vimeo / direct video URL"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                />

              </div>

            </div>
          )}

          {/* --------------------------------------------------
              ARTICLE CONTENT
          -------------------------------------------------- */}

          {lessonType === 'article' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">

              <h3 className="text-sm font-bold text-slate-900">
                Rich Lecture Material
              </h3>

              <textarea
                rows="12"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter lecture content, theorem proofs, explanations, Markdown, equations, notes..."
                className="w-full p-4 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:ring-2 focus:ring-brand-500"
              />

            </div>
          )}

          {/* --------------------------------------------------
              KNOWLEDGE CHECK
          -------------------------------------------------- */}

          {lessonType === 'quiz' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">

              <h3 className="text-sm font-bold text-slate-900 mb-2">
                Knowledge Check
              </h3>

              <p className="text-xs text-slate-500">
                Quiz questions can be connected through the quiz system.
                The lesson information itself will still be saved here.
              </p>

              <textarea
                rows="8"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Optional lesson instructions or knowledge-check notes..."
                className="mt-4 w-full p-4 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:ring-2 focus:ring-brand-500"
              />

            </div>
          )}

          {/* --------------------------------------------------
              LESSON FILES
          -------------------------------------------------- */}

          {lessonId && (
            <LessonFilesManager
              courseId={courseId}
              lessonId={lessonId}
            />
          )}

        </form>
      </main>
    </div>
  );
}