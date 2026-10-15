import React, {
  useEffect,
  useState
} from 'react';

import {
  useParams,
  Link
} from 'react-router-dom';

import DashboardSidebar
  from '../components/InstructorSidebar';

import {
  ArrowLeft,
  FileText,
  Calendar,
  Check,
  AlertCircle,
  Download,
  RefreshCw,
  User,
  ExternalLink
} from 'lucide-react';

import {
  api,
  fileUrl
} from '../api/client';


export default function AssignmentDedicatedPage() {

  const {
    courseId,
    asgnId
  } = useParams();


  // ============================================================
  // STATE
  // ============================================================

  const [assignment, setAssignment] =
    useState(null);

  const [submissions, setSubmissions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [selectedStudentId, setSelectedStudentId] =
    useState(null);

  const [enteredGrade, setEnteredGrade] =
    useState('');

  const [feedback, setFeedback] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  const [saveSuccess, setSaveSuccess] =
    useState(false);


  // ============================================================
  // LOAD ASSIGNMENT + SUBMISSIONS
  // ============================================================

  const loadData = async () => {

    try {

      setLoading(true);
      setError('');


      const [
        assignmentResponse,
        submissionResponse
      ] = await Promise.all([

        api.get(
          `/assignments/${asgnId}`
        ),

        api.get(
          `/assignments/${asgnId}/submissions`
        )

      ]);


      const loadedAssignment =
        assignmentResponse?.assignment;


      const loadedSubmissions =
        submissionResponse?.submissions ||
        [];


      setAssignment(
        loadedAssignment
      );


      setSubmissions(
        loadedSubmissions
      );


      // ----------------------------------------------------------
      // Select first submission automatically
      // ----------------------------------------------------------

      if (
        loadedSubmissions.length > 0
      ) {

        const first =
          loadedSubmissions[0];


        setSelectedStudentId(
          first.submission_id
        );


        setEnteredGrade(
          first.marks !== null &&
          first.marks !== undefined
            ? String(first.marks)
            : ''
        );


        setFeedback(
          first.feedback || ''
        );

      } else {

        setSelectedStudentId(null);
        setEnteredGrade('');
        setFeedback('');

      }

    }

    catch (err) {

      console.error(
        'Failed to load assignment:',
        err
      );


      setError(
        err.message ||
        'Unable to load assignment data.'
      );

    }

    finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    loadData();

  }, [asgnId]);


  // ============================================================
  // SELECT STUDENT
  // ============================================================

  const selectSubmission = (
    submission
  ) => {

    setSelectedStudentId(
      submission.submission_id
    );


    setEnteredGrade(
      submission.marks !== null &&
      submission.marks !== undefined
        ? String(submission.marks)
        : ''
    );


    setFeedback(
      submission.feedback || ''
    );


    setSaveSuccess(false);

  };


  // ============================================================
  // ACTIVE SUBMISSION
  // ============================================================

  const activeSubmission =
    submissions.find(
      (submission) =>
        submission.submission_id ===
        selectedStudentId
    ) || null;


  // ============================================================
  // SAVE GRADE
  // ============================================================

  const handleSaveGrade = async () => {

    if (!activeSubmission) {

      return;

    }


    if (
      enteredGrade === ''
    ) {

      alert(
        'Please enter a grade.'
      );

      return;

    }


    const marks =
      Number(
        enteredGrade
      );


    const maxMarks =
      Number(
        assignment?.max_marks || 0
      );


    if (
      Number.isNaN(marks) ||
      marks < 0 ||
      marks > maxMarks
    ) {

      alert(
        `Marks must be between 0 and ${maxMarks}.`
      );

      return;

    }


    try {

      setSaving(true);
      setError('');
      setSaveSuccess(false);


      const response =
        await api.patch(
          `/submissions/${activeSubmission.submission_id}/grade`,
          {
            marks,
            feedback
          }
        );


      const updated =
        response?.submission;


      setSubmissions(
        (current) =>
          current.map(
            (submission) => {

              if (
                submission.submission_id !==
                activeSubmission.submission_id
              ) {

                return submission;

              }


              return {
                ...submission,

                marks:
                  updated?.marks ??
                  marks,

                feedback:
                  updated?.feedback ??
                  feedback,

                status:
                  updated?.status ||
                  'graded',

                graded_at:
                  updated?.graded_at ||
                  new Date().toISOString()
              };

            }
          )
      );


      setSaveSuccess(true);


      setTimeout(
        () => {
          setSaveSuccess(false);
        },
        2500
      );

    }

    catch (err) {

      console.error(
        'Failed to save grade:',
        err
      );


      setError(
        err.message ||
        'Failed to save grade.'
      );

    }

    finally {

      setSaving(false);

    }

  };


  // ============================================================
  // DATE
  // ============================================================

  const formatDateTime = (
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

      return value;

    }


    return date.toLocaleString(
      'en-US',
      {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
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
              Loading assignment...
            </p>

          </div>

        </main>

      </div>

    );

  }


  // ============================================================
  // ERROR
  // ============================================================

  if (error && !assignment) {

    return (

      <div className="flex min-h-screen bg-[#F8F9FD]">

        <DashboardSidebar
          role="instructor"
          title="EduPulse"
        />


        <main className="flex-1 p-8">

          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5">

            <p className="text-sm font-semibold text-rose-600">
              {error}
            </p>

            <button
              onClick={loadData}
              className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
            >
              Try Again
            </button>

          </div>

        </main>

      </div>

    );

  }


  // ============================================================
  // STATS
  // ============================================================

  const totalSubmissions =
    submissions.length;


  const gradedSubmissions =
    submissions.filter(
      (submission) =>
        submission.marks !== null &&
        submission.marks !== undefined
    ).length;


  const pendingSubmissions =
    totalSubmissions -
    gradedSubmissions;


  // ============================================================
  // MAIN PAGE
  // ============================================================

  return (

    <div className="flex min-h-screen bg-[#F8F9FD]">

      <DashboardSidebar
        role="instructor"
        title="EduPulse"
      />


      <main className="flex-1 p-8 overflow-y-auto space-y-7">


        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col lg:flex-row justify-between gap-4">

          <div className="flex items-start gap-3">

            <Link
              to="/instructor/assignments"
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900"
            >

              <ArrowLeft className="w-4 h-4" />

            </Link>


            <div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded">

                Assignment Evaluation

              </span>


              <h1 className="text-xl font-extrabold text-slate-900 mt-1">

                {assignment?.title ||
                  'Assignment'}

              </h1>


              <p className="text-xs text-slate-500 mt-1">

                {assignment?.course_title ||
                  `Course ${courseId}`}

              </p>

            </div>

          </div>


          <button
            onClick={loadData}
            className="self-start px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
          >

            <RefreshCw className="w-3.5 h-3.5" />

            Refresh

          </button>

        </div>


        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (

          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">

            <p className="text-xs font-semibold text-rose-600">
              {error}
            </p>

          </div>

        )}


        {/* ======================================================
            ASSIGNMENT INFORMATION
        ====================================================== */}

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">


          <div className="flex flex-col lg:flex-row justify-between gap-5">


            <div className="flex-1">

              <h2 className="text-sm font-bold text-slate-900">
                Assignment Details
              </h2>


              <p className="text-xs text-slate-500 mt-2 whitespace-pre-line leading-5">

                {assignment?.description ||
                  'No assignment description was provided.'}

              </p>

            </div>


            <div className="grid grid-cols-2 gap-3 min-w-[280px]">


              <div className="p-4 bg-slate-50 rounded-2xl">

                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Maximum Points
                </span>

                <div className="text-xl font-extrabold text-slate-900 mt-1">

                  {assignment?.max_marks || 0}

                </div>

              </div>


              <div className="p-4 bg-slate-50 rounded-2xl">

                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Deadline
                </span>

                <div className="text-xs font-extrabold text-slate-900 mt-2">

                  {formatDateTime(
                    assignment?.deadline
                  )}

                </div>

              </div>

            </div>

          </div>


          {/* QUESTION FILE */}

          {assignment?.attachment_url && (

            <div className="mt-5 p-4 rounded-2xl bg-brand-50 border border-brand-100 flex flex-col sm:flex-row justify-between gap-3">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">

                  <FileText className="w-5 h-5 text-brand-600" />

                </div>


                <div>

                  <p className="text-xs font-bold text-slate-800">

                    {assignment.attachment_name ||
                      'Assignment Question File'}

                  </p>


                  <p className="text-[10px] text-slate-400 mt-1">

                    {assignment.attachment_mime_type ||
                      'File'}

                  </p>

                </div>

              </div>


              <a
                href={fileUrl(
                  assignment.attachment_url
                )}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >

                <Download className="w-3.5 h-3.5" />

                Open Question

              </a>

            </div>

          )}

        </div>


        {/* ======================================================
            GRADING STATS
        ====================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">


          <div className="bg-white p-5 rounded-2xl border border-slate-100">

            <p className="text-xs text-slate-500 font-semibold">
              Submissions
            </p>

            <p className="text-2xl font-extrabold text-slate-900 mt-2">
              {totalSubmissions}
            </p>

          </div>


          <div className="bg-white p-5 rounded-2xl border border-slate-100">

            <p className="text-xs text-slate-500 font-semibold">
              Graded
            </p>

            <p className="text-2xl font-extrabold text-emerald-600 mt-2">
              {gradedSubmissions}
            </p>

          </div>


          <div className="bg-white p-5 rounded-2xl border border-slate-100">

            <p className="text-xs text-slate-500 font-semibold">
              Pending Grading
            </p>

            <p className="text-2xl font-extrabold text-amber-600 mt-2">
              {pendingSubmissions}
            </p>

          </div>

        </div>


        {/* ======================================================
            GRADING AREA
        ====================================================== */}

        <div className="grid lg:grid-cols-12 gap-6 items-start">


          {/* STUDENT LIST */}

          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 shadow-xs p-4">

            <div className="flex justify-between items-center px-2 pb-3">

              <h3 className="text-xs font-bold text-slate-900">

                Student Submissions

              </h3>


              <span className="text-[10px] text-slate-400 font-bold">
                {submissions.length}
              </span>

            </div>


            <div className="space-y-2">


              {submissions.map(
                (submission) => {

                  const isActive =
                    submission.submission_id ===
                    selectedStudentId;


                  const graded =
                    submission.marks !== null &&
                    submission.marks !== undefined;


                  return (

                    <button
                      key={
                        submission.submission_id
                      }
                      type="button"
                      onClick={() =>
                        selectSubmission(
                          submission
                        )
                      }
                      className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition ${
                        isActive
                          ? 'bg-brand-50 border border-brand-200'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >

                      <div className="flex items-center gap-3 min-w-0">

                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">

                          <User className="w-4 h-4" />

                        </div>


                        <div className="min-w-0">

                          <p className="text-xs font-bold text-slate-900 truncate">

                            {submission.student_name}

                          </p>


                          <p className="text-[10px] text-slate-400 truncate">

                            {submission.student_email}

                          </p>


                          <p
                            className={`text-[10px] mt-1 ${
                              submission.status === 'late'
                                ? 'text-rose-500 font-bold'
                                : 'text-slate-400'
                            }`}
                          >

                            {formatDateTime(
                              submission.submitted_at
                            )}

                            {submission.status ===
                              'late' &&
                              ' • Late'}

                          </p>

                        </div>

                      </div>


                      <div className="text-right shrink-0">

                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                            graded
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-amber-50 text-amber-600'
                          }`}
                        >

                          {graded
                            ? 'GRADED'
                            : 'PENDING'}

                        </span>


                        <div className="text-xs font-bold text-slate-700 mt-1">

                          {graded
                            ? `${submission.marks}/${assignment?.max_marks}`
                            : `--/${assignment?.max_marks}`}

                        </div>

                      </div>

                    </button>

                  );

                }
              )}


              {submissions.length === 0 && (

                <div className="py-10 text-center">

                  <FileText className="w-7 h-7 text-slate-300 mx-auto" />

                  <p className="text-xs font-semibold text-slate-500 mt-2">
                    No submissions yet.
                  </p>

                </div>

              )}

            </div>

          </div>


          {/* SUBMISSION + GRADING */}

          <div className="lg:col-span-8 space-y-6">


            {!activeSubmission ? (

              <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center">

                <User className="w-8 h-8 text-slate-300 mx-auto" />

                <p className="text-sm font-semibold text-slate-500 mt-3">
                  Select a student submission to grade.
                </p>

              </div>

            ) : (

              <>


                {/* SUBMISSION */}

                <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">


                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">

                    <div className="flex justify-between items-center gap-4">

                      <div>

                        <h3 className="text-sm font-bold text-slate-900">

                          {activeSubmission.student_name}

                        </h3>


                        <p className="text-[11px] text-slate-400 mt-0.5">

                          Submitted{' '}

                          {formatDateTime(
                            activeSubmission.submitted_at
                          )}

                        </p>

                      </div>


                      {activeSubmission.status ===
                        'late' && (

                        <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold">

                          Late Submission

                        </span>

                      )}

                    </div>

                  </div>


                  <div className="p-6 space-y-5">


                    {/* SUBMISSION TEXT */}

                    {activeSubmission.submission_text && (

                      <div>

                        <h4 className="text-xs font-bold text-slate-800 mb-2">
                          Student Note
                        </h4>


                        <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-600 whitespace-pre-line">

                          {activeSubmission.submission_text}

                        </div>

                      </div>

                    )}


                    {/* FILE */}

                    {activeSubmission.file_url && (

                      <div className="p-4 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">

                        <div className="flex items-center gap-3 min-w-0">

                          <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">

                            <FileText className="w-5 h-5" />

                          </div>


                          <div className="min-w-0">

                            <p className="text-xs font-bold text-slate-800">
                              Student Submission
                            </p>

                            <p className="text-[10px] text-slate-400 mt-1 truncate">
                              {activeSubmission.file_url}
                            </p>

                          </div>

                        </div>


                        <a
                          href={fileUrl(
                            activeSubmission.file_url
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
                        >

                          <ExternalLink className="w-3.5 h-3.5" />

                          Open Work

                        </a>

                      </div>

                    )}


                    {!activeSubmission.file_url &&
                      !activeSubmission.submission_text && (

                      <div className="p-5 bg-slate-50 rounded-2xl text-center">

                        <AlertCircle className="w-6 h-6 text-slate-300 mx-auto" />

                        <p className="text-xs text-slate-400 mt-2">
                          No submission content was provided.
                        </p>

                      </div>

                    )}

                  </div>

                </div>


                {/* GRADING CONSOLE */}

                <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6">

                  <div className="flex items-center justify-between mb-5">

                    <div>

                      <h3 className="text-sm font-bold text-slate-900">
                        Grade Submission
                      </h3>

                      <p className="text-[11px] text-slate-400 mt-1">
                        Record marks and feedback in the database.
                      </p>

                    </div>


                    {saveSuccess && (

                      <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold flex items-center gap-1">

                        <Check className="w-3 h-3" />

                        Grade Saved

                      </span>

                    )}

                  </div>


                  <div className="grid md:grid-cols-12 gap-5">


                    {/* GRADE */}

                    <div className="md:col-span-3">

                      <label className="text-xs font-bold text-slate-700">
                        Grade
                      </label>


                      <div className="flex items-center gap-2 mt-2">

                        <input
                          type="number"
                          min="0"
                          max={
                            assignment?.max_marks ||
                            100
                          }
                          step="0.5"
                          value={enteredGrade}
                          onChange={(e) =>
                            setEnteredGrade(
                              e.target.value
                            )
                          }
                          className="w-24 px-3 py-2.5 text-center text-lg font-extrabold rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                        />


                        <span className="text-sm font-bold text-slate-400">

                          /

                          {assignment?.max_marks ||
                            100}

                        </span>

                      </div>

                    </div>


                    {/* FEEDBACK */}

                    <div className="md:col-span-6">

                      <label className="text-xs font-bold text-slate-700">
                        Feedback
                      </label>


                      <textarea
                        rows="3"
                        value={feedback}
                        onChange={(e) =>
                          setFeedback(
                            e.target.value
                          )
                        }
                        placeholder="Write constructive feedback for the student..."
                        className="w-full mt-2 p-3 text-xs rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                      />

                    </div>


                    {/* SAVE */}

                    <div className="md:col-span-3 flex items-end">

                      <button
                        type="button"
                        disabled={saving}
                        onClick={
                          handleSaveGrade
                        }
                        className="w-full py-3 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 disabled:opacity-60 flex items-center justify-center gap-2"
                      >

                        {saving ? (

                          <RefreshCw className="w-4 h-4 animate-spin" />

                        ) : (

                          <Check className="w-4 h-4" />

                        )}

                        {saving
                          ? 'Saving...'
                          : 'Save Grade'}

                      </button>

                    </div>

                  </div>

                </div>

              </>

            )}

          </div>

        </div>

      </main>

    </div>

  );

}