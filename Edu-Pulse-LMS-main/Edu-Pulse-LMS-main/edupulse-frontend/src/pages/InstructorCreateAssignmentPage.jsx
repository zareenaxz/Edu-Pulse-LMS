import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import InstructorSidebar from '../components/InstructorSidebar';
import { api } from '../api/client';
import {
  Calendar,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  UploadCloud,
  FileText,
  X,
} from 'lucide-react';

const formatCourseName = (course) => {
  if (!course) return 'Course';

  return (
    course.title ||
    course.course_name ||
    `Course #${course.course_id}`
  );
};

const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_ATTACHMENT_EXTENSIONS = ['.pdf', '.doc', '.docx'];

export default function CreateAssignmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const attachmentInputRef = useRef(null);

  const courseIdFromUrl = searchParams.get('courseId');

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(
    courseIdFromUrl || ''
  );

  const [title, setTitle] = useState('');
  const [points, setPoints] = useState(100);
  const [dueDate, setDueDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [attachment, setAttachment] = useState(null);

  const [rubricItems, setRubricItems] = useState([
    {
      id: 1,
      criterion: 'Understanding and correctness',
      max: 50,
    },
    {
      id: 2,
      criterion: 'Clarity and presentation',
      max: 30,
    },
    {
      id: 3,
      criterion: 'Completeness and formatting',
      max: 20,
    },
  ]);

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        setError('');

        const response = await api.get('/courses');
        const loadedCourses = response?.courses || [];

        setCourses(loadedCourses);

        if (courseIdFromUrl) {
          const exists = loadedCourses.some(
            (course) =>
              String(course.course_id) === String(courseIdFromUrl)
          );

          if (exists) {
            setSelectedCourse(String(courseIdFromUrl));
          } else if (loadedCourses.length > 0) {
            setSelectedCourse(String(loadedCourses[0].course_id));
          }
        } else if (loadedCourses.length > 0) {
          setSelectedCourse(String(loadedCourses[0].course_id));
        }
      } catch (err) {
        console.error('Failed to load instructor courses:', err);
        setError(err?.message || 'Unable to load your courses.');
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCourses();
  }, [courseIdFromUrl]);

  const addRubricRow = () => {
    setRubricItems((current) => [
      ...current,
      {
        id: Date.now(),
        criterion: '',
        max: 10,
      },
    ]);
  };

  const updateRubricRow = (id, field, value) => {
    setRubricItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const removeRubricRow = (id) => {
    setRubricItems((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files?.[0] || null;
    setError('');

    if (!file) {
      setAttachment(null);
      return;
    }

    const extension = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;
    const typeAllowed = ALLOWED_ATTACHMENT_TYPES.includes(file.type);
    const extensionAllowed = ALLOWED_ATTACHMENT_EXTENSIONS.includes(extension);

    if (!typeAllowed && !extensionAllowed) {
      setAttachment(null);
      e.target.value = '';
      setError('Only PDF, DOC, or DOCX files are allowed for assignment questions.');
      return;
    }

    if (file.size > MAX_ATTACHMENT_SIZE) {
      setAttachment(null);
      e.target.value = '';
      setError('Assignment question file must be 25 MB or smaller.');
      return;
    }

    setAttachment(file);
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setMessage('');

    if (!selectedCourse) {
      setError('Please select a course.');
      return;
    }

    if (!title.trim()) {
      setError('Assignment title is required.');
      return;
    }

    const numericPoints = Number(points);

    if (!Number.isFinite(numericPoints) || numericPoints <= 0) {
      setError('Total points must be greater than 0.');
      return;
    }

    if (!dueDate) {
      setError('Please select a due date.');
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();

      formData.append('course_id', String(Number(selectedCourse)));
      formData.append('title', title.trim());
      formData.append('description', instructions.trim());
      formData.append('deadline', `${dueDate} 23:59:00`);
      formData.append('max_marks', String(numericPoints));

      if (attachment) {
        formData.append('attachment', attachment);
      }

      const response = await api.upload('/assignments', formData);
      const createdAssignment =
        response?.assignment || response?.data?.assignment;

      if (!createdAssignment?.assignment_id) {
        throw new Error('Assignment was not created correctly.');
      }

      setMessage('Assignment published successfully.');

      setTimeout(() => {
        navigate(`/instructor/courses/${selectedCourse}`, {
          replace: true,
        });
      }, 700);
    } catch (err) {
      console.error('Failed to create assignment:', err);
      setError(
        err?.message ||
          'Failed to create assignment. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingCourses) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FD]">
        <InstructorSidebar role="instructor" title="EduPulse" />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading your courses...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <InstructorSidebar role="instructor" title="EduPulse" />

      <main className="flex-1 p-8 overflow-y-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            to={
              selectedCourse
                ? `/instructor/courses/${selectedCourse}`
                : '/instructor/courses'
            }
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Create Course Assignment
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Create an assignment, attach the question file, and publish it to your selected course.
            </p>
          </div>
        </div>

        {message && (
          <div className="max-w-4xl flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {message}
          </div>
        )}

        {error && (
          <div className="max-w-4xl flex items-start gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
              Assignment Details
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Course
              </label>

              {courses.length === 0 ? (
                <div className="px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-700">
                  You do not have any courses available. Create a course first.
                </div>
              ) : (
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  disabled={saving}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50"
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option
                      key={course.course_id}
                      value={course.course_id}
                    >
                      {formatCourseName(course)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Assignment Title
              </label>
              <input
                type="text"
                required
                disabled={saving}
                placeholder="e.g. Midterm Problem Set 4"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-none disabled:bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Total Points
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  disabled={saving}
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Due Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    required
                    disabled={saving}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Instructions & Requirements
              </label>
              <textarea
                rows="5"
                disabled={saving}
                placeholder="Write instructions, expectations, formatting rules, or submission requirements..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50"
              />
            </div>

            {/* Assignment Question File */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Assignment Question File
                  </label>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Upload the question sheet students need to solve.
                  </p>
                </div>
                <span className="text-[10px] text-slate-400">
                  PDF, DOC, DOCX • Max 25 MB
                </span>
              </div>

              {!attachment ? (
                <div
                  onClick={() => attachmentInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-brand-500 hover:bg-brand-50/20 rounded-2xl p-6 text-center cursor-pointer transition"
                >
                  <UploadCloud className="w-9 h-9 text-brand-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800">
                    Click to upload assignment question
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Students will see this file when they open the assignment.
                  </p>
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={handleAttachmentChange}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-brand-50 border border-brand-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-brand-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {attachment.name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatFileSize(attachment.size)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={removeAttachment}
                    disabled={saving}
                    className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-white disabled:opacity-50"
                    title="Remove question file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Rubric */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Grading Rubric Criteria
                </h3>
                <p className="text-[11px] text-slate-400">
                  You can prepare grading criteria here. The current database stores the assignment total points, not individual rubric rows.
                </p>
              </div>

              <button
                type="button"
                onClick={addRubricRow}
                disabled={saving}
                className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Criterion
              </button>
            </div>

            <div className="space-y-2">
              {rubricItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={item.criterion}
                    disabled={saving}
                    onChange={(e) =>
                      updateRubricRow(item.id, 'criterion', e.target.value)
                    }
                    placeholder="Evaluation criterion"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50"
                  />

                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      value={item.max}
                      disabled={saving}
                      onChange={(e) =>
                        updateRubricRow(item.id, 'max', e.target.value)
                      }
                      className="w-16 px-2 py-2 text-center rounded-xl border border-slate-200 text-xs outline-none font-bold focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50"
                    />
                    <span className="text-xs text-slate-400">pts</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeRubricRow(item.id)}
                    disabled={saving || rubricItems.length === 1}
                    className="p-2 text-slate-400 hover:text-rose-500 disabled:opacity-30"
                    title="Remove criterion"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                navigate(
                  selectedCourse
                    ? `/instructor/courses/${selectedCourse}`
                    : '/instructor/courses'
                )
              }
              className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || courses.length === 0 || !selectedCourse}
              className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 shadow-md shadow-brand-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Publish Assignment to Course
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
