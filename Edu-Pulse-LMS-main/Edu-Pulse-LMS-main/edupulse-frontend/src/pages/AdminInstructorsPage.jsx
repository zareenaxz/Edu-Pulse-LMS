import React, { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import api from '../api/client';

import {
  Check,
  X,
  FileText,
  ExternalLink,
  ShieldCheck,
  Clock,
  RefreshCw,
  AlertCircle,
  Mail,
  GraduationCap,
  Briefcase,
} from 'lucide-react';


export default function AdminInstructorsPage() {

  // ============================================================
  // STATE
  // ============================================================

  const [candidates, setCandidates] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const [actionError, setActionError] =
    useState('');

  const [selectedReview, setSelectedReview] =
    useState(null);

  const [processingId, setProcessingId] =
    useState(null);


  // ============================================================
  // LOAD PENDING APPLICATIONS
  // ============================================================

  const loadApplications = async (
    showRefresh = false
  ) => {

    try {

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');
      setActionError('');


      const data =
        await api.get(
          '/instructor-applications?status=pending'
        );


      setCandidates(
        data?.applications || []
      );

    }

    catch (err) {

      console.error(
        'Failed to load instructor applications:',
        err
      );

      setError(
        err.message ||
        'Could not load instructor applications.'
      );

    }

    finally {

      setLoading(false);
      setRefreshing(false);

    }

  };


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    loadApplications();

  }, []);


  // ============================================================
  // APPROVE / REJECT
  // ============================================================

  const handleReview = async (
    application,
    decision
  ) => {

    if (
      !application?.application_id
    ) {

      setActionError(
        'Invalid application. Application ID is missing.'
      );

      return;

    }


    const applicantName =
      application.name ||
      'this instructor';


    const actionText =
      decision === 'approved'
        ? 'approve'
        : 'reject';


    const confirmed =
      window.confirm(
        `Are you sure you want to ${actionText} ${applicantName}'s instructor application?`
      );


    if (!confirmed) {
      return;
    }


    try {

      setProcessingId(
        application.application_id
      );

      setActionError('');


      await api.patch(
        `/instructor-applications/${application.application_id}/review`,
        {
          decision,
        }
      );


      // Remove resolved application
      // from pending list
      setCandidates(
        (current) =>
          current.filter(
            (item) =>
              item.application_id !==
              application.application_id
          )
      );


      setSelectedReview(null);

    }

    catch (err) {

      console.error(
        `Failed to ${decision} instructor application:`,
        err
      );


      setActionError(
        err.message ||
        `Could not ${actionText} the application.`
      );

    }

    finally {

      setProcessingId(null);

    }

  };


  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (
    dateValue
  ) => {

    if (!dateValue) {
      return 'Not available';
    }


    const date =
      new Date(dateValue);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return dateValue;

    }


    return date.toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    );

  };


  // ============================================================
  // GET INITIALS
  // ============================================================

  const getInitials = (
    name = ''
  ) => {

    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part[0]?.toUpperCase()
      )
      .join('');

  };


  // ============================================================
  // OPEN CV
  //
  // CV is already coming from the database as Base64
  // through the instructor application API.
  // ============================================================

  const openCV = (
    application
  ) => {

    if (
      !application?.cv_data
    ) {

      setActionError(
        'CV file is not available for this application.'
      );

      return;

    }


    try {

      let base64Data =
        application.cv_data;


      const mimeType =
        application.cv_mime_type ||
        'application/pdf';


      // ----------------------------------------------
      // Remove data URL prefix if it already exists
      // ----------------------------------------------

      if (
        base64Data.includes(
          'base64,'
        )
      ) {

        base64Data =
          base64Data.split(
            'base64,'
          )[1];

      }


      // ----------------------------------------------
      // Decode Base64
      // ----------------------------------------------

      const byteCharacters =
        atob(base64Data);


      const byteNumbers =
        new Array(
          byteCharacters.length
        );


      for (
        let i = 0;
        i < byteCharacters.length;
        i++
      ) {

        byteNumbers[i] =
          byteCharacters.charCodeAt(i);

      }


      const byteArray =
        new Uint8Array(
          byteNumbers
        );


      const blob =
        new Blob(
          [byteArray],
          {
            type: mimeType
          }
        );


      const blobUrl =
        URL.createObjectURL(
          blob
        );


      // ----------------------------------------------
      // Open CV in new browser tab
      // ----------------------------------------------

      const newWindow =
        window.open(
          blobUrl,
          '_blank'
        );


      if (!newWindow) {

        // Popup blocker fallback
        const link =
          document.createElement(
            'a'
          );

        link.href =
          blobUrl;

        link.target =
          '_blank';

        link.rel =
          'noopener noreferrer';

        document.body.appendChild(
          link
        );

        link.click();

        link.remove();

      }


      // ----------------------------------------------
      // Clean object URL later
      // ----------------------------------------------

      setTimeout(
        () => {
          URL.revokeObjectURL(
            blobUrl
          );
        },
        60000
      );

    }

    catch (err) {

      console.error(
        'Could not open CV:',
        err
      );


      setActionError(
        'Could not open the CV file. The stored CV data may be invalid.'
      );

    }

  };


  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loading) {

    return (

      <div className="flex min-h-screen bg-[#F8F9FD]">

        <AdminSidebar title="LearnFlow" />


        <main className="flex-1 p-8 overflow-y-auto">

          <div className="max-w-6xl mx-auto">

            <div className="flex items-center justify-between mb-8">

              <div>

                <h1 className="text-2xl font-extrabold text-slate-900">
                  Instructor Approval
                </h1>

                <p className="text-xs text-slate-500 mt-1">
                  Review and approve instructor applications.
                </p>

              </div>

            </div>


            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">

              <RefreshCw className="w-7 h-7 text-brand-600 animate-spin mx-auto mb-3" />

              <p className="text-sm font-bold text-slate-700">
                Loading instructor applications...
              </p>

            </div>

          </div>

        </main>

      </div>

    );

  }


  // ============================================================
  // MAIN UI
  // ============================================================

  return (

    <div className="flex min-h-screen bg-[#F8F9FD]">

      <AdminSidebar title="LearnFlow" />


      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">

        <div className="max-w-6xl mx-auto space-y-7">


          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>

              <h1 className="text-2xl font-extrabold text-slate-900">
                Instructor Approval
              </h1>

              <p className="text-xs text-slate-500 mt-1">
                Review instructor applications and authorize
                teaching access.
              </p>

            </div>


            <button
              type="button"
              onClick={() =>
                loadApplications(true)
              }
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 disabled:opacity-60"
            >

              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  refreshing
                    ? 'animate-spin'
                    : ''
                }`}
              />

              {refreshing
                ? 'Refreshing...'
                : 'Refresh'}

            </button>

          </div>


          {/* ==================================================
              ERROR
          ================================================== */}

          {(error || actionError) && (

            <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4">

              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />


              <div className="flex-1">

                <p className="text-xs font-bold">
                  {error || actionError}
                </p>

              </div>


              <button
                type="button"
                onClick={() => {

                  setError('');
                  setActionError('');

                }}
                className="text-rose-400 hover:text-rose-700"
              >

                <X className="w-4 h-4" />

              </button>

            </div>

          )}


          {/* ==================================================
              SUMMARY
          ================================================== */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">


            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">

                  <Clock className="w-5 h-5" />

                </div>


                <div>

                  <p className="text-[11px] text-slate-400 font-semibold">
                    Pending Applications
                  </p>

                  <p className="text-xl font-extrabold text-slate-900">
                    {candidates.length}
                  </p>

                </div>

              </div>

            </div>


            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">

                  <ShieldCheck className="w-5 h-5" />

                </div>


                <div>

                  <p className="text-[11px] text-slate-400 font-semibold">
                    Status
                  </p>

                  <p className="text-sm font-extrabold text-emerald-600">
                    Admin Review Queue
                  </p>

                </div>

              </div>

            </div>

          </div>


          {/* ==================================================
              APPLICATION LIST
          ================================================== */}

          <div className="space-y-4">


            {candidates.map(
              (application) => {

                const isProcessing =
                  processingId ===
                  application.application_id;


                const name =
                  application.name ||
                  'Unknown Instructor';


                const qualification =
                  application.qualification ||
                  'Not provided';


                const experience =
                  application.experience ||
                  'Not provided';


                const cvName =
                  application.cv_file_name ||
                  application.resume_filename ||
                  'Instructor_CV.pdf';


                const hasCV =
                  Boolean(
                    application.cv_data
                  );


                return (

                  <div
                    key={
                      application.application_id
                    }
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5"
                  >


                    {/* ------------------------------------------
                        TOP SECTION
                    ------------------------------------------ */}

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 border-b border-slate-100 pb-5">


                      <div className="flex items-center gap-4">

                        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-extrabold">

                          {getInitials(name)}

                        </div>


                        <div>

                          <h3 className="text-sm font-extrabold text-slate-900">

                            {name}

                          </h3>


                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-400">

                            <span className="inline-flex items-center gap-1">

                              <Mail className="w-3 h-3" />

                              {application.email}

                            </span>


                            <span>

                              Applied:{' '}

                              {formatDate(
                                application.applied_at
                              )}

                            </span>

                          </div>

                        </div>

                      </div>


                      {/* APPROVE / REJECT */}

                      <div className="flex items-center gap-2">


                        <button
                          type="button"
                          disabled={
                            isProcessing
                          }
                          onClick={() =>
                            handleReview(
                              application,
                              'approved'
                            )
                          }
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                        >

                          {isProcessing ? (

                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />

                          ) : (

                            <Check className="w-3.5 h-3.5" />

                          )}

                          Approve

                        </button>


                        <button
                          type="button"
                          disabled={
                            isProcessing
                          }
                          onClick={() =>
                            handleReview(
                              application,
                              'rejected'
                            )
                          }
                          className="px-4 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                        >

                          <X className="w-3.5 h-3.5" />

                          Reject

                        </button>

                      </div>

                    </div>


                    {/* ------------------------------------------
                        APPLICATION INFORMATION
                    ------------------------------------------ */}

                    <div className="grid md:grid-cols-2 gap-4">


                      {/* QUALIFICATION */}

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">

                        <div className="flex items-center gap-2 mb-2">

                          <GraduationCap className="w-4 h-4 text-brand-600" />

                          <span className="text-xs font-extrabold text-slate-800">
                            Qualification
                          </span>

                        </div>


                        <p className="text-xs text-slate-500 leading-5">

                          {qualification}

                        </p>

                      </div>


                      {/* EXPERIENCE */}

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">

                        <div className="flex items-center gap-2 mb-2">

                          <Briefcase className="w-4 h-4 text-brand-600" />

                          <span className="text-xs font-extrabold text-slate-800">
                            Experience
                          </span>

                        </div>


                        <p className="text-xs text-slate-500 leading-5">

                          {experience}

                        </p>

                      </div>

                    </div>


                    {/* ------------------------------------------
                        CV SECTION
                    ------------------------------------------ */}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl border border-slate-100 bg-white">


                      <div className="flex items-center gap-3 min-w-0">

                        <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">

                          <FileText className="w-5 h-5" />

                        </div>


                        <div className="min-w-0">

                          <p className="text-xs font-extrabold text-slate-800 truncate">

                            {cvName}

                          </p>


                          <p className="text-[10px] text-slate-400 mt-0.5">

                            {hasCV
                              ? 'CV available'
                              : 'CV not available'}

                          </p>

                        </div>

                      </div>


                      {/* VIEW CV BUTTON */}

                      <button
                        type="button"
                        disabled={!hasCV}
                        onClick={() =>
                          openCV(
                            application
                          )
                        }
                        className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                          hasCV
                            ? 'bg-slate-900 text-white hover:bg-slate-800'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >

                        <ExternalLink className="w-3.5 h-3.5" />

                        {hasCV
                          ? 'View CV'
                          : 'CV Unavailable'}

                      </button>

                    </div>

                  </div>

                );

              }
            )}


            {/* ==================================================
                EMPTY STATE
            ================================================== */}

            {candidates.length === 0 && (

              <div className="py-16 bg-white rounded-3xl border border-slate-100 text-center">

                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">

                  <ShieldCheck className="w-7 h-7" />

                </div>


                <h3 className="text-sm font-extrabold text-slate-800">
                  No Pending Applications
                </h3>


                <p className="text-xs text-slate-400 mt-1">

                  There are currently no instructor applications
                  waiting for admin approval.

                </p>

              </div>

            )}

          </div>

        </div>

      </main>


      {/* ========================================================
          APPLICATION DETAILS MODAL
      ======================================================== */}

      {selectedReview && (

        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() =>
            setSelectedReview(null)
          }
        >

          <div
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 lg:p-8 shadow-2xl border border-slate-100"
            onClick={(event) =>
              event.stopPropagation()
            }
          >


            {/* MODAL HEADER */}

            <div className="flex justify-between items-start border-b border-slate-100 pb-5 mb-6">

              <div>

                <h3 className="font-extrabold text-slate-900 text-base">
                  Instructor Application
                </h3>

                <p className="text-xs text-slate-400 mt-1">
                  Review the applicant information and CV.
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  setSelectedReview(null)
                }
                className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >

                <X className="w-4 h-4" />

              </button>

            </div>


            {/* APPLICANT */}

            <div className="flex items-center gap-4 mb-6">

              <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-extrabold">

                {getInitials(
                  selectedReview.name
                )}

              </div>


              <div>

                <h4 className="text-sm font-extrabold text-slate-900">

                  {selectedReview.name}

                </h4>


                <p className="text-xs text-slate-500 mt-1">

                  {selectedReview.email}

                </p>

              </div>

            </div>


            {/* DETAILS */}

            <div className="space-y-4">


              {/* QUALIFICATION */}

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">

                <p className="text-[11px] font-extrabold text-slate-800 mb-1">
                  Qualification
                </p>


                <p className="text-xs text-slate-500 leading-5">

                  {selectedReview.qualification ||
                    'Not provided'}

                </p>

              </div>


              {/* EXPERIENCE */}

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">

                <p className="text-[11px] font-extrabold text-slate-800 mb-1">
                  Experience
                </p>


                <p className="text-xs text-slate-500 leading-5 whitespace-pre-wrap">

                  {selectedReview.experience ||
                    'Not provided'}

                </p>

              </div>


              {/* CV */}

              <div className="p-4 rounded-2xl border border-slate-200">

                <div className="flex items-center gap-3">


                  <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">

                    <FileText className="w-5 h-5" />

                  </div>


                  <div className="flex-1 min-w-0">

                    <p className="text-xs font-extrabold text-slate-800 truncate">

                      {selectedReview.cv_file_name ||
                        selectedReview.resume_filename ||
                        'Instructor CV'}

                    </p>


                    <p className="text-[10px] text-slate-400 mt-1">

                      {selectedReview.cv_mime_type ||
                        'application/pdf'}

                    </p>

                  </div>


                  <button
                    type="button"
                    disabled={
                      !selectedReview.cv_data
                    }
                    onClick={() =>
                      openCV(
                        selectedReview
                      )
                    }
                    className={`px-3 py-2 rounded-xl text-[11px] font-bold inline-flex items-center gap-1.5 ${
                      selectedReview.cv_data
                        ? 'bg-slate-900 text-white hover:bg-slate-800'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >

                    <ExternalLink className="w-3 h-3" />

                    {selectedReview.cv_data
                      ? 'Open CV'
                      : 'CV Unavailable'}

                  </button>

                </div>

              </div>

            </div>


            {/* ACTIONS */}

            <div className="flex justify-end gap-3 mt-7 pt-5 border-t border-slate-100">


              <button
                type="button"
                disabled={
                  processingId ===
                  selectedReview.application_id
                }
                onClick={() =>
                  handleReview(
                    selectedReview,
                    'rejected'
                  )
                }
                className="px-5 py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-50 disabled:opacity-60"
              >

                Reject Application

              </button>


              <button
                type="button"
                disabled={
                  processingId ===
                  selectedReview.application_id
                }
                onClick={() =>
                  handleReview(
                    selectedReview,
                    'approved'
                  )
                }
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-60 inline-flex items-center gap-1.5"
              >

                {processingId ===
                selectedReview.application_id ? (

                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />

                ) : (

                  <Check className="w-3.5 h-3.5" />

                )}

                Approve Application

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}