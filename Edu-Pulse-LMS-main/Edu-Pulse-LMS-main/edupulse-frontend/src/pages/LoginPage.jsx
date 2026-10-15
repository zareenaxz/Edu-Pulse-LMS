import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';
import { api } from '../api/client';

// Sample values shown only as placeholders.
// They are NOT filled into the form automatically.
const EMAIL_PLACEHOLDERS = {
  student: 'e.g. student@university.edu',
  instructor: 'e.g. instructor@edupulse.io',
  admin: 'e.g. admin@edupulse.io',
};

export default function LoginPage() {
  const navigate = useNavigate();

  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState('student');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      // Login through backend
      const user = await api.login(
        email.trim(),
        password
      );

      // Make sure selected role matches
      // the actual role stored in database
      if (user.role !== role) {
        await api.logout();

        throw new Error(
          `This account is registered as ${user.role}, not ${role}.`
        );
      }

      // Redirect according to database role
      if (user.role === 'admin') {
        navigate('/dashboard/admin', { replace: true });
      } else if (user.role === 'instructor') {
        navigate('/dashboard/instructor', { replace: true });
      } else if (user.role === 'student') {
        navigate('/dashboard/student', { replace: true });
      } else {
        await api.logout();
        throw new Error('Invalid account role.');
      }
    } catch (err) {
      setError(err?.message || 'Login failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden grid md:grid-cols-2">

        {/* Left Visual Hero */}
        <div className="bg-brand-600 text-white p-10 flex flex-col justify-between hidden md:flex relative overflow-hidden">

          <Link to="/" className="flex items-center gap-2.5 z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>

            <span className="font-extrabold text-lg">
              EduPulse LMS
            </span>
          </Link>

          <div className="space-y-3 z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-200 bg-white/10 px-2.5 py-1 rounded-full">
              University Portal
            </span>

            <h2 className="text-3xl font-black leading-tight">
              Empowering Your Academic Journey.
            </h2>

            <p className="text-xs text-brand-100 leading-relaxed">
              Access coursework, stream interactive lectures, and view
              confidential instructor feedback.
            </p>
          </div>

          <div className="text-[11px] text-brand-200 z-10 flex justify-between items-center">
            <span>© 2026 EduPulse Inc.</span>

            <Link
              to="/"
              className="underline hover:text-white"
            >
              Back to Home
            </Link>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">

          {/* Sign In / Sign Up */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">

            <button
              type="button"
              className="w-1/2 py-2 text-xs font-bold rounded-lg bg-white shadow-xs text-brand-600"
            >
              Sign In
            </button>

            <Link
              to="/register"
              className="w-1/2 py-2 text-xs font-bold text-center text-slate-500 hover:text-slate-900"
            >
              Sign Up
            </Link>
          </div>

          <h2 className="text-2xl font-black text-slate-900">
            Welcome Back
          </h2>

          <p className="text-xs text-slate-500 mt-1 mb-6">
            Enter your university credentials to continue.
          </p>

          <form
            onSubmit={handleLogin}
            className="space-y-4 text-xs"
          >

            {/* Role Switcher */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Select Your Academic Role
              </label>

              <div className="grid grid-cols-3 gap-2">
                {['student', 'instructor', 'admin'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleChange(r)}
                    disabled={loading}
                    className={`py-2 rounded-xl font-bold capitalize transition ${
                      role === r
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    } disabled:opacity-60`}
                  >
                    {r}
                  </button>
                ))}
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
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  required
                  disabled={loading}
                  placeholder={EMAIL_PLACEHOLDERS[role]}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 font-medium disabled:bg-slate-50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700">
                  Password
                </label>

                <Link
                  to="/reset-password"
                  className="text-brand-600 hover:underline font-bold"
                >
                  Forgot?
                </Link>
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />

                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  required
                  disabled={loading}
                  placeholder="e.g. Password123"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 font-medium disabled:bg-slate-50"
                />

                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  disabled={loading}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-rose-600 font-semibold bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 disabled:opacity-60 disabled:cursor-not-allowed bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition shadow-sm flex items-center justify-center gap-1.5"
            >
              {loading ? 'Signing in...' : 'Sign In to Dashboard'}

              {!loading && (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-400 mt-6">
            Protected by Institutional Single Sign-On (SSO).
          </p>
        </div>
      </div>
    </div>
  );
}