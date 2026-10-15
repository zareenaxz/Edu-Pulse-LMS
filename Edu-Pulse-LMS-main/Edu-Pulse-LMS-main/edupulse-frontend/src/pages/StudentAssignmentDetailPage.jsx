import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import StudentSidebar from '../components/StudentSidebar';
import {
  ArrowLeft,
  Calendar,
  FileText,
  UploadCloud,
  CheckCircle2,
  Check,
  AlertCircle,
  Download,
} from 'lucide-react';
import { api, fileUrl } from '../api/client';

const formatDate = (value) => {
  if (!value) return 'No deadline';
  const d = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(d.getTime())
    ? String(value)
    : d.toLocaleString([], {
        dateStyle: 'full',
        timeStyle: 'short',
      });
};

const prettySize = (bytes) =>
  bytes >= 1048576
    ? `${(bytes / 1048576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const getAttachmentSize = (bytes) => {
  if (!bytes) return '';
  return bytes >= 1048576
    ? `${(bytes / 1048576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

export default function StudentAssignmentDetailPage() {
  const { asgnId } = useParams();
  const fileInput = useRef(null);

  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [pickedFile, setPickedFile] = useState(null);
  const [studentNote, setStudentNote] = useState('');
  const [sending, setSending] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [a, s] = await Promise.all([
          api.get(`/assignments/${asgnId}`),
          api.get(`/assignments/${asgnId}/submissions/me`),
        ]);

        setAssignment(a.assignment);
        setSubmission(s.submission);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [asgnId]);

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!pickedFile && !studentNote.trim()) {
      setError(
        'Please choose a file (or write your answer in the note) before turning in.'
      );
      return;
    }

    setSending(true);

    try {
      const fd = new FormData();

      if (pickedFile) {
        fd.append('file', pickedFile);
      }

      if (studentNote.trim()) {
        fd.append('submission_text', studentNote.trim());
      }

      const d = await api.upload(
        `/assignments/${asgnId}/submissions`,
        fd
      );

      setSubmission(d.submission);
      setPickedFile(null);
      setStudentNote('');
      setResubmitting(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FD]">
        <StudentSidebar />
        <main className="flex-1 p-8">
          <p className="text-xs text-slate-400">
            Loading assignment…
          </p>
        </main>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FD]">
        <StudentSidebar />
        <main className="flex-1 p-8 space-y-4">
          <p className="text-xs font-semibold text-rose-600 bg-rose-50 rounded-xl px-4 py-3">
            {error || 'Assignment not found'}
          </p>
          <Link
            to="/student/assignments"
            className="text-xs font-bold text-brand-600"
          >
            ← Back to Assignments List
          </Link>
        </main>
      </div>
    );
  }

  const graded =
    submission &&
    (submission.graded_at || submission.marks !== null);

  const pastDeadline =
    assignment.deadline &&
    new Date() >
      new Date(String(assignment.deadline).replace(' ', 'T'));

  const showForm = !submission || resubmitting;

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <StudentSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-8">
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/student/assignments"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Assignments List
          </Link>

          <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
            Course:{' '}
            <strong className="text-brand-600">
              {assignment.course_title}
            </strong>
          </span>
        </div>

        {/* Assignment Details */}
        <div className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                Official Coursework Assignment
              </span>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {assignment.title}
              </h1>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-brand-600" />
                Due: {formatDate(assignment.deadline)}
              </span>
              <span>•</span>
              <span>
                Maximum Points:{' '}
                <strong className="text-slate-900">
                  {assignment.max_marks}
                </strong>
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Instructions & Expectations
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {assignment.description ||
                'Your instructor did not add any instructions for this assignment.'}
            </p>
          </div>

          {/* Instructor Question File */}
          {assignment.attachment_url && (
            <div className="p-4 rounded-2xl bg-brand-50 border border-brand-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-brand-600" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {assignment.attachment_name ||
                      'Assignment Question File'}
                  </p>

                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {assignment.attachment_mime_type ||
                      'Assignment question file'}
                    {assignment.attachment_size
                      ? ` • ${getAttachmentSize(
                          assignment.attachment_size
                        )}`
                      : ''}
                  </p>
                </div>
              </div>

              <a
                href={fileUrl(assignment.attachment_url)}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Open Question File
              </a>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Result */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Your Result
            </h3>

            {!submission && (
              <p className="text-xs text-slate-500">
                You have not submitted this assignment yet. Upload your work using the form.
              </p>
            )}

            {submission && !graded && (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-xs text-blue-800 font-semibold">
                Submitted — waiting for your instructor to grade it.
              </div>
            )}

            {graded && (
              <div className="space-y-3">
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">
                    Score Received
                  </span>
                  <div className="text-3xl font-black text-emerald-600">
                    {Number(submission.marks)} / {assignment.max_marks}
                  </div>
                </div>

                {submission.feedback && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700">
                    <strong className="text-slate-900">
                      Faculty Review:
                    </strong>{' '}
                    "{submission.feedback}"
                  </div>
                )}
              </div>
            )}

            {pastDeadline && !graded && (
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
                <AlertCircle className="w-4 h-4" />
                The deadline has passed. New submissions are marked as late.
              </p>
            )}
          </div>

          {/* Upload Submission */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900">
              Your Work Submission
            </h3>

            {error && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            {submission && !resubmitting && (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />

                <h4 className="text-sm font-bold text-emerald-900">
                  {graded
                    ? 'Your submission was graded'
                    : 'Turned In Successfully!'}
                </h4>

                {submission.file_url && (
                  <p className="text-xs text-emerald-700">
                    File:{' '}
                    <a
                      href={fileUrl(submission.file_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold underline inline-flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Open my submitted file
                    </a>
                  </p>
                )}

                {submission.submission_text && (
                  <p className="text-xs text-emerald-800 bg-white/70 rounded-xl p-3 text-left whitespace-pre-line">
                    {submission.submission_text}
                  </p>
                )}

                <p className="text-[11px] text-emerald-700">
                  Submitted: {formatDate(submission.submitted_at)}
                </p>

                <span className="inline-block px-3 py-1 bg-white text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                  Status:{' '}
                  {graded
                    ? 'Graded'
                    : submission.status === 'late'
                    ? 'Late • Under Faculty Review'
                    : 'Under Faculty Review'}
                </span>

                <div>
                  <button
                    type="button"
                    onClick={() => setResubmitting(true)}
                    className="text-xs font-bold text-brand-600 hover:underline"
                  >
                    Submit a new version
                  </button>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Your earlier version is kept in the history.
                  </p>
                </div>
              </div>
            )}

            {showForm && (
              <form onSubmit={handleFinalSubmit} className="space-y-4">
                <div
                  onClick={() =>
                    fileInput.current && fileInput.current.click()
                  }
                  className="border-2 border-dashed border-slate-200 hover:border-brand-500 hover:bg-brand-50/20 rounded-2xl p-8 text-center cursor-pointer transition"
                >
                  <UploadCloud className="w-10 h-10 text-brand-600 mx-auto mb-2" />

                  <p className="text-xs font-bold text-slate-800">
                    {pickedFile
                      ? pickedFile.name
                      : 'Click to select your solution file (PDF, DOCX, ZIP, image...)'}
                  </p>

                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {pickedFile
                      ? `Ready to turn in (${prettySize(
                          pickedFile.size
                        )})`
                      : 'Any file type up to 25 MB'}
                  </span>

                  <input
                    ref={fileInput}
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      setPickedFile(e.target.files[0] || null)
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Student Note / Written Answer (Optional)
                  </label>

                  <textarea
                    rows="3"
                    value={studentNote}
                    onChange={(e) => setStudentNote(e.target.value)}
                    placeholder="Include any comments regarding question assumptions, software versions used, etc..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    <Check className="w-4 h-4" />
                    {sending ? 'Uploading…' : 'Turn In Assignment'}
                  </button>

                  {resubmitting && (
                    <button
                      type="button"
                      onClick={() => {
                        setResubmitting(false);
                        setPickedFile(null);
                        setError('');
                      }}
                      className="px-5 py-3 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
