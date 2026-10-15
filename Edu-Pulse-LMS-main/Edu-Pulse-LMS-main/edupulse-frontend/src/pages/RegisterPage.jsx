import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  ArrowRight,
  UploadCloud,
  Briefcase,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
} from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [uploadedResume, setUploadedResume] = useState(null);
  const [submittedInstructor, setSubmittedInstructor] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ----------------------------------------------------
  // STUDENT FORM
  // ----------------------------------------------------

  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    studentId: '',
    degreeLevel: 'Undergraduate',
    major: '',
    password: '',
  });

  // ----------------------------------------------------
  // INSTRUCTOR FORM
  // ----------------------------------------------------

  const [instructorForm, setInstructorForm] = useState({
    title: 'Prof.',
    firstName: '',
    lastName: '',
    email: '',
    phdInstitution: '',
    department: 'Mathematics & Computer Science',
    specialization: '',
    coursePitch: '',
    password: '',
  });

  // ----------------------------------------------------
  // CHANGE ROLE
  // ----------------------------------------------------

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError('');
    setShowPassword(false);
    setSubmittedInstructor(false);
  };

  // ----------------------------------------------------
  // STUDENT REGISTER
  // ----------------------------------------------------

  const handleStudentSubmit = async (e) => {
    e.preventDefault();

    setError('');

    if (studentForm.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const data = await api.post('/auth/register/student', {
        name: `${studentForm.firstName} ${studentForm.lastName}`.trim(),
        email: studentForm.email.trim(),
        password: studentForm.password,

        // Extra information
        student_id: studentForm.studentId.trim(),
        degree_level: studentForm.degreeLevel,
        major: studentForm.major.trim(),
      });

      // Save login session returned by backend
      if (data?.token && data?.user) {
        localStorage.setItem('edupulse_token', data.token);
        localStorage.setItem(
          'edupulse_user',
          JSON.stringify(data.user)
        );
      }

      // Student registration successful
      navigate('/dashboard/student', { replace: true });

    } catch (err) {
      setError(
        err?.message ||
        'Student registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // INSTRUCTOR REGISTER
  // ----------------------------------------------------

  const handleInstructorSubmit = async (e) => {
    e.preventDefault();

    setError('');

    if (instructorForm.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!uploadedResume) {
      setError('Please upload your CV in PDF format.');
      return;
    }

    if (uploadedResume.type !== 'application/pdf') {
      setError('Only PDF CV files are allowed.');
      return;
    }

    if (uploadedResume.size > 25 * 1024 * 1024) {
      setError('CV must be smaller than 25 MB.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append(
        'name',
        `${instructorForm.title} ${instructorForm.firstName} ${instructorForm.lastName}`.trim()
      );

      formData.append(
        'email',
        instructorForm.email.trim()
      );

      formData.append(
        'password',
        instructorForm.password
      );

      formData.append(
        'qualification',
        `PhD, ${instructorForm.phdInstitution} (${instructorForm.department})`
      );

      formData.append(
        'experience',
        `${instructorForm.specialization}\n\n${instructorForm.coursePitch}`
      );

      // Send the actual selected PDF file.
      // Backend route must use upload.single('cv').
      formData.append('cv', uploadedResume);

      await api.upload(
        '/auth/register/instructor',
        formData
      );

      // Instructor is pending admin approval.
      localStorage.removeItem('edupulse_token');
      localStorage.removeItem('edupulse_user');

      setSubmittedInstructor(true);

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2200);

    } catch (err) {
      setError(
        err?.message ||
        'Instructor application failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center p-4 lg:p-8">

      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden grid lg:grid-cols-12 min-h-[640px]">

        {/* ==================================================
            LEFT SIDE
        ================================================== */}

        <div className="lg:col-span-5 bg-gradient-to-br from-brand-600 to-indigo-700 text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden hidden md:flex">

          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-black/20 rounded-full blur-3xl pointer-events-none" />

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 z-10"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>

            <div>
              <div className="font-extrabold text-lg leading-tight">
                EduPulse LMS
              </div>

              <span className="text-[10px] text-brand-200 tracking-widest uppercase font-bold">
                Academic Portal
              </span>
            </div>
          </Link>

          {/* Hero */}
          <div className="space-y-4 z-10 py-6">

            {role === 'student' ? (
              <>
                <span className="px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-brand-100">
                  Student Registration
                </span>

                <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                  Master Technical Skills with Verifiable Honors.
                </h2>

                <p className="text-xs text-brand-100 leading-relaxed">
                  Join EduPulse and access interactive coursework,
                  lectures, assignments, and instructor feedback.
                </p>

                <div className="space-y-2 pt-2 text-xs">

                  <div className="flex items-center gap-2 text-brand-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>
                      Access interactive video lectures
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-brand-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>
                      Submit assignments online
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-brand-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>
                      Track your learning progress
                    </span>
                  </div>

                </div>
              </>
            ) : (
              <>
                <span className="px-3 py-1 bg-amber-400 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Faculty Accreditation
                </span>

                <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                  Publish Coursework with Institutional Governance.
                </h2>

                <p className="text-xs text-brand-100 leading-relaxed">
                  Apply as an instructor and publish university-level
                  courses after administrative approval.
                </p>

                <div className="space-y-2 pt-2 text-xs">

                  <div className="flex items-center gap-2 text-brand-100">
                    <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>
                      Create and manage courses
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-brand-100">
                    <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>
                      Create assignments and lessons
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-brand-100">
                    <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>
                      Manage student submissions
                    </span>
                  </div>

                </div>
              </>
            )}

          </div>

          <div className="text-[11px] text-brand-200 z-10 flex justify-between items-center border-t border-white/10 pt-4">
            <span>© 2026 EduPulse Inc.</span>

            <Link
              to="/"
              className="underline hover:text-white transition"
            >
              Return to Home
            </Link>
          </div>
        </div>

        {/* ==================================================
            RIGHT SIDE
        ================================================== */}

        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center overflow-y-auto">

          {/* Role Switcher */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1.5 mb-6">

            <button
              type="button"
              onClick={() => handleRoleChange('student')}
              disabled={loading}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                role === 'student'
                  ? 'bg-white text-brand-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              } disabled:opacity-60`}
            >
              <User className="w-4 h-4" />
              Student Account
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('instructor')}
              disabled={loading}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                role === 'instructor'
                  ? 'bg-white text-brand-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              } disabled:opacity-60`}
            >
              <Briefcase className="w-4 h-4" />
              Instructor Application
            </button>

          </div>

          {/* Header */}
          <div className="mb-5">

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {role === 'student'
                ? 'Create Your Student Account'
                : 'Apply for Faculty Accreditation'}
            </h1>

            <p className="text-xs text-slate-500 mt-1">
              {role === 'student'
                ? 'Join EduPulse and start your academic journey.'
                : 'Submit your information for administrative review.'}
            </p>

          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* ==================================================
              STUDENT FORM
          ================================================== */}

          {role === 'student' && (

            <form
              onSubmit={handleStudentSubmit}
              className="space-y-4 text-xs"
            >

              {/* Name */}
              <div className="grid sm:grid-cols-2 gap-3">

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    First Name
                  </label>

                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />

                    <input
                      type="text"
                      required
                      disabled={loading}
                      placeholder="Jane"
                      value={studentForm.firstName}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          firstName: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Last Name
                  </label>

                  <input
                    type="text"
                    required
                    disabled={loading}
                    placeholder="Doe"
                    value={studentForm.lastName}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        lastName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50"
                  />
                </div>

              </div>

              {/* Email */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Academic Email
                </label>

                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />

                  <input
                    type="email"
                    required
                    disabled={loading}
                    placeholder="jane.doe@university.edu"
                    value={studentForm.email}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        email: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* Student ID + Degree */}
              <div className="grid sm:grid-cols-2 gap-3">

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Student ID
                  </label>

                  <input
                    type="text"
                    disabled={loading}
                    placeholder="e.g. 011231234"
                    value={studentForm.studentId}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        studentId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Study Level
                  </label>

                  <select
                    value={studentForm.degreeLevel}
                    disabled={loading}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        degreeLevel: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold outline-none disabled:bg-slate-50"
                  >
                    <option>Undergraduate</option>
                    <option>Graduate / Master's</option>
                    <option>Doctoral Candidate</option>
                    <option>Independent Scholar</option>
                  </select>
                </div>

              </div>

              {/* Major */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Major / Specialization
                </label>

                <input
                  type="text"
                  disabled={loading}
                  placeholder="e.g. Computer Science"
                  value={studentForm.major}
                  onChange={(e) =>
                    setStudentForm({
                      ...studentForm,
                      major: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Password
                </label>

                <div className="relative">

                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />

                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    disabled={loading}
                    placeholder="At least 8 characters"
                    value={studentForm.password}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        password: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 font-medium disabled:bg-slate-50"
                  />

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>

                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading
                    ? 'Creating Account...'
                    : 'Complete Student Enrollment'}

                  {!loading && (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </button>

              </div>

            </form>
          )}

          {/* ==================================================
              INSTRUCTOR FORM
          ================================================== */}

          {role === 'instructor' && (

            <div>

              {submittedInstructor ? (

                <div className="p-8 text-center bg-emerald-50 rounded-3xl border border-emerald-200 space-y-3">

                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                    <Check className="w-6 h-6" />
                  </div>

                  <h3 className="text-base font-black text-emerald-950">
                    Application Submitted!
                  </h3>

                  <p className="text-xs text-emerald-800 leading-relaxed max-w-md mx-auto">
                    Your instructor application has been submitted
                    successfully. An administrator must approve your
                    account before you can sign in.
                  </p>

                </div>

              ) : (

                <form
                  onSubmit={handleInstructorSubmit}
                  className="space-y-4 text-xs"
                >

                  {/* Name */}
                  <div className="grid sm:grid-cols-12 gap-3">

                    <div className="sm:col-span-3">
                      <label className="block font-bold text-slate-700 mb-1">
                        Prefix
                      </label>

                      <select
                        value={instructorForm.title}
                        disabled={loading}
                        onChange={(e) =>
                          setInstructorForm({
                            ...instructorForm,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold outline-none disabled:bg-slate-50"
                      >
                        <option>Prof.</option>
                        <option>Dr.</option>
                        <option>Assoc. Prof.</option>
                        <option>Lecturer</option>
                      </select>
                    </div>

                    <div className="sm:col-span-5">
                      <label className="block font-bold text-slate-700 mb-1">
                        First Name
                      </label>

                      <input
                        type="text"
                        required
                        disabled={loading}
                        placeholder="Sarah"
                        value={instructorForm.firstName}
                        onChange={(e) =>
                          setInstructorForm({
                            ...instructorForm,
                            firstName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block font-bold text-slate-700 mb-1">
                        Last Name
                      </label>

                      <input
                        type="text"
                        required
                        disabled={loading}
                        placeholder="Anderson"
                        value={instructorForm.lastName}
                        onChange={(e) =>
                          setInstructorForm({
                            ...instructorForm,
                            lastName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50"
                      />
                    </div>

                  </div>

                  {/* Email + Institution */}
                  <div className="grid sm:grid-cols-2 gap-3">

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Institutional Faculty Email
                      </label>

                      <input
                        type="email"
                        required
                        disabled={loading}
                        placeholder="s.anderson@university.edu"
                        value={instructorForm.email}
                        onChange={(e) =>
                          setInstructorForm({
                            ...instructorForm,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        PhD / Terminal Institution
                      </label>

                      <input
                        type="text"
                        required
                        disabled={loading}
                        placeholder="e.g. MIT, Cambridge, Stanford"
                        value={instructorForm.phdInstitution}
                        onChange={(e) =>
                          setInstructorForm({
                            ...instructorForm,
                            phdInstitution: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50"
                      />
                    </div>

                  </div>

                  {/* Department + Specialization */}
                  <div className="grid sm:grid-cols-2 gap-3">

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Primary Discipline
                      </label>

                      <select
                        value={instructorForm.department}
                        disabled={loading}
                        onChange={(e) =>
                          setInstructorForm({
                            ...instructorForm,
                            department: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold outline-none disabled:bg-slate-50"
                      >
                        <option>
                          Mathematics & Applied Science
                        </option>
                        <option>
                          Computer Science & AI
                        </option>
                        <option>
                          UI/UX & Product Design
                        </option>
                        <option>
                          Quantitative Finance & Economics
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Sub-Specialization
                      </label>

                      <input
                        type="text"
                        required
                        disabled={loading}
                        placeholder="e.g. Multivariable Calculus, NLP"
                        value={instructorForm.specialization}
                        onChange={(e) =>
                          setInstructorForm({
                            ...instructorForm,
                            specialization: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50"
                      />
                    </div>

                  </div>

                  {/* CV */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Curriculum Vitae / Teaching Credentials (PDF)
                    </label>

                    <label
                      htmlFor="cv-upload"
                      className={`border-2 border-dashed border-slate-200 hover:border-brand-500 hover:bg-brand-50/20 rounded-2xl p-3.5 text-center transition flex items-center justify-center gap-2 ${
                        loading
                          ? 'opacity-60 cursor-not-allowed'
                          : 'cursor-pointer'
                      }`}
                    >
                      <UploadCloud className="w-5 h-5 text-brand-600" />

                      <span className="font-semibold text-slate-700 truncate">
                        {uploadedResume
                          ? uploadedResume.name
                          : 'Click to attach CV (PDF, max 25 MB)'}
                      </span>
                    </label>

                    <input
                      id="cv-upload"
                      type="file"
                      accept=".pdf,application/pdf"
                      disabled={loading}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];

                        if (!file) return;

                        if (file.type !== 'application/pdf') {
                          setError('Only PDF CV files are allowed.');
                          setUploadedResume(null);
                          e.target.value = '';
                          return;
                        }

                        if (file.size > 25 * 1024 * 1024) {
                          setError('CV must be smaller than 25 MB.');
                          setUploadedResume(null);
                          e.target.value = '';
                          return;
                        }

                        setError('');
                        setUploadedResume(file);
                      }}
                    />

                    {uploadedResume && (
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-emerald-600 font-semibold">
                        <Check className="w-4 h-4" />
                        CV attached successfully
                      </div>
                    )}

                    <p className="text-[10px] text-slate-400 mt-1">
                      Upload your CV as a PDF. Maximum file size: 25 MB.
                    </p>
                  </div>

                  {/* Course Pitch */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Proposed Course Pitch / Statement
                    </label>

                    <textarea
                      rows="2"
                      required
                      disabled={loading}
                      placeholder="Briefly state the course curriculum or laboratory you plan to publish..."
                      value={instructorForm.coursePitch}
                      onChange={(e) =>
                        setInstructorForm({
                          ...instructorForm,
                          coursePitch: e.target.value,
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Create Password
                    </label>

                    <div className="relative">

                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />

                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        disabled={loading}
                        placeholder="At least 8 characters"
                        value={instructorForm.password}
                        onChange={(e) =>
                          setInstructorForm({
                            ...instructorForm,
                            password: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 font-medium disabled:bg-slate-50"
                      />

                      <button
                        type="button"
                        disabled={loading}
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>

                    </div>
                  </div>

                  {/* Submit */}
                  <div className="pt-2">

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading
                        ? 'Submitting Application...'
                        : 'Submit for Academic Committee Review'}

                      {!loading && (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </button>

                  </div>

                </form>
              )}

            </div>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-slate-500 mt-6 pt-4 border-t border-slate-100">
            Already registered on EduPulse?{' '}

            <Link
              to="/login"
              className="text-brand-600 font-bold hover:underline"
            >
              Sign In to Your Workspace
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}