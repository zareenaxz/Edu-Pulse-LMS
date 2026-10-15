import React, { useEffect, useRef, useState } from 'react';
import InstructorSidebar from '../components/InstructorSidebar';
import {
  User,
  Mail,
  Bell,
  Shield,
  Calendar,
  Check,
  Camera,
  Lock,
  Save,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api } from '../api/client';

const PROFILE_EXTRA_KEY =
  'edupulse_instructor_profile_extra';

const PREFERENCES_KEY =
  'edupulse_instructor_preferences';

const DEFAULT_EXTRA = {
  title: '',
  bio: '',
  officeHours: '',
};

const DEFAULT_PREFERENCES = {
  allowLateSubmissions: true,
  emailNotifications: true,
  gradingNotifications: true,
  studentMessages: true,
};

const readLocalObject = (
  key,
  fallback
) => {
  try {
    const saved =
      localStorage.getItem(key);

    if (!saved) {
      return fallback;
    }

    const parsed =
      JSON.parse(saved);

    return {
      ...fallback,
      ...parsed,
    };
  } catch {
    return fallback;
  }
};

export default function InstructorSettingsPage() {
  const [loading, setLoading] =
    useState(true);

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [savingPreferences, setSavingPreferences] =
    useState(false);

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [profile, setProfile] =
    useState({
      userId: null,
      name: '',
      email: '',
      profileImage: '',
      title: '',
      bio: '',
      officeHours: '',
    });

  const [preferences, setPreferences] =
    useState(() =>
      readLocalObject(
        PREFERENCES_KEY,
        DEFAULT_PREFERENCES
      )
    );

  const [passwords, setPasswords] =
    useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [selectedImage, setSelectedImage] =
    useState(null);

  const [previewImage, setPreviewImage] =
    useState('');

  const fileInputRef =
    useRef(null);

  /* =========================================================
     LOAD SETTINGS
  ========================================================= */

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');

      const response =
        await api.get('/users/me');

      const user =
        response?.user || {};

      const extra =
        readLocalObject(
          PROFILE_EXTRA_KEY,
          DEFAULT_EXTRA
        );

      setProfile({
        userId:
          user.user_id || null,

        name:
          user.name || '',

        email:
          user.email || '',

        profileImage:
          user.profile_image || '',

        title:
          extra.title || '',

        bio:
          extra.bio || '',

        officeHours:
          extra.officeHours || '',
      });

      setPreviewImage(
        user.profile_image || ''
      );

      setPreferences(
        readLocalObject(
          PREFERENCES_KEY,
          DEFAULT_PREFERENCES
        )
      );
    } catch (err) {
      console.error(
        'Failed to load instructor settings:',
        err
      );

      setError(
        err?.message ||
        'Could not load your settings.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     PROFILE INPUT
  ========================================================= */

  const handleProfileChange = (
    field,
    value
  ) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* =========================================================
     IMAGE SELECT
  ========================================================= */

  const handleImageSelect = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        'image/'
      )
    ) {
      setError(
        'Please select an image file.'
      );

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        'Profile image must be smaller than 5 MB.'
      );

      return;
    }

    setError('');

    setSelectedImage(file);

    const objectUrl =
      URL.createObjectURL(file);

    setPreviewImage(objectUrl);
  };

  /* =========================================================
     SAVE PROFILE
  ========================================================= */

  const handleSaveProfile = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSavingProfile(true);
      setError('');
      setSuccess('');

      let response;

      /*
        If image selected:
        multipart/form-data
      */

      if (selectedImage) {
        const formData =
          new FormData();

        formData.append(
          'name',
          profile.name.trim()
        );

        formData.append(
          'profile_image',
          selectedImage
        );

        response =
          await api.upload(
            '/users/me',
            formData,
            'PATCH'
          );
      } else {
        /*
          Normal JSON profile update
        */

        response =
          await api.patch(
            '/users/me',
            {
              name:
                profile.name.trim(),
            }
          );
      }

      /*
        Save fields that are not currently
        part of the users table.
      */

      localStorage.setItem(
        PROFILE_EXTRA_KEY,
        JSON.stringify({
          title:
            profile.title.trim(),

          bio:
            profile.bio.trim(),

          officeHours:
            profile.officeHours.trim(),
        })
      );

      const updatedUser =
        response?.user;

      if (updatedUser) {
        setProfile((prev) => ({
          ...prev,

          userId:
            updatedUser.user_id ||
            prev.userId,

          name:
            updatedUser.name ||
            prev.name,

          email:
            updatedUser.email ||
            prev.email,

          profileImage:
            updatedUser.profile_image ||
            prev.profileImage,
        }));

        setPreviewImage(
          updatedUser.profile_image ||
          previewImage
        );
      }

      setSelectedImage(null);

      /*
        Refresh current user data in localStorage
        through the existing API helper.
      */

      try {
        await api.getMe();
      } catch {
        // Profile was already saved.
      }

      setSuccess(
        'Profile settings saved successfully.'
      );

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error(
        'Failed to save profile:',
        err
      );

      setError(
        err?.message ||
        'Could not save your profile.'
      );
    } finally {
      setSavingProfile(false);
    }
  };

  /* =========================================================
     SAVE PREFERENCES
  ========================================================= */

  const handleSavePreferences = (
    event
  ) => {
    event.preventDefault();

    try {
      setSavingPreferences(true);

      setError('');
      setSuccess('');

      localStorage.setItem(
        PREFERENCES_KEY,
        JSON.stringify(
          preferences
        )
      );

      setSuccess(
        'Grading and notification preferences saved.'
      );

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } finally {
      setSavingPreferences(false);
    }
  };

  /* =========================================================
     CHANGE PASSWORD
  ========================================================= */

  const handleChangePassword = async (
    event
  ) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = passwords;

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setError(
        'Please fill in all password fields.'
      );

      return;
    }

    if (
      newPassword.length < 6
    ) {
      setError(
        'New password must be at least 6 characters.'
      );

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        'New password and confirmation password do not match.'
      );

      return;
    }

    if (
      currentPassword ===
      newPassword
    ) {
      setError(
        'New password must be different from your current password.'
      );

      return;
    }

    try {
      setChangingPassword(true);

      await api.patch(
        '/users/me/password',
        {
          currentPassword,
          newPassword,
        }
      );

      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setSuccess(
        'Password changed successfully.'
      );

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error(
        'Password change failed:',
        err
      );

      setError(
        err?.message ||
        'Could not change your password.'
      );
    } finally {
      setChangingPassword(false);
    }
  };

  /* =========================================================
     TOGGLE PREFERENCE
  ========================================================= */

  const togglePreference = (
    field
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [field]:
        !prev[field],
    }));
  };

  /* =========================================================
     PROFILE IMAGE
  ========================================================= */

  const getInitial = () => {
    return (
      profile.name
        ?.charAt(0)
        ?.toUpperCase() ||
      'I'
    );
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FD]">

        <InstructorSidebar />

        <main className="flex-1 flex items-center justify-center">

          <div className="flex flex-col items-center gap-3">

            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />

            <p className="text-sm font-semibold text-slate-500">
              Loading your settings...
            </p>

          </div>

        </main>

      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">

      <InstructorSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="mb-7">

          <h1 className="text-2xl font-bold text-slate-900">
            Workspace Settings
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            Manage your instructor profile,
            grading preferences, notifications,
            and account security.
          </p>

        </div>

        {/* ===================================================
            GLOBAL ERROR
        =================================================== */}

        {error && (
          <div className="mb-5 flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700">

            <AlertCircle className="w-5 h-5 shrink-0" />

            <div>

              <p className="text-xs font-bold">
                Something went wrong
              </p>

              <p className="text-xs mt-1">
                {error}
              </p>

            </div>

          </div>
        )}

        {/* ===================================================
            GLOBAL SUCCESS
        =================================================== */}

        {success && (
          <div className="mb-5 flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700">

            <Check className="w-5 h-5" />

            <p className="text-xs font-bold">
              {success}
            </p>

          </div>
        )}

        <div className="max-w-5xl space-y-6">

          {/* =================================================
              PROFILE
          ================================================= */}

          <form
            onSubmit={
              handleSaveProfile
            }
            className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6"
          >

            <div>

              <h3 className="text-sm font-bold text-slate-900">
                Public Instructor Identity
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                This information can be used
                across your instructor profile.
              </p>

            </div>

            {/* PROFILE HEADER */}

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

              <div className="relative">

                {previewImage ? (
                  <img
                    src={
                      previewImage
                    }
                    alt="Instructor profile"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-100"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-brand-50 border-2 border-brand-100 flex items-center justify-center text-2xl font-extrabold text-brand-600">
                    {getInitial()}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="w-7 h-7 bg-brand-600 text-white rounded-lg flex items-center justify-center absolute -bottom-1.5 -right-1.5 shadow-md hover:bg-brand-700 transition"
                  title="Change profile picture"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>

                <input
                  ref={
                    fileInputRef
                  }
                  type="file"
                  accept="image/*"
                  onChange={
                    handleImageSelect
                  }
                  className="hidden"
                />

              </div>

              <div>

                <h4 className="font-bold text-slate-800 text-sm">
                  {profile.name ||
                    'Instructor'}
                </h4>

                <p className="text-xs text-slate-400 mt-1">
                  {profile.email ||
                    'No email'}
                </p>

                <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <Check className="w-3 h-3" />
                  Verified Faculty Member
                </span>

              </div>

            </div>

            {/* NAME + EMAIL */}

            <div className="grid sm:grid-cols-2 gap-4">

              <div>

                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>

                <div className="relative">

                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                  <input
                    type="text"
                    value={
                      profile.name
                    }
                    onChange={(e) =>
                      handleProfileChange(
                        'name',
                        e.target.value
                      )
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400"
                    placeholder="Your full name"
                    required
                  />

                </div>

              </div>

              <div>

                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>

                <div className="relative">

                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                  <input
                    type="email"
                    value={
                      profile.email
                    }
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500 cursor-not-allowed"
                  />

                </div>

                <p className="text-[10px] text-slate-400 mt-1">
                  Email is managed by your
                  EduPulse account.
                </p>

              </div>

            </div>

            {/* ACADEMIC TITLE */}

            <div>

              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Academic Title
              </label>

              <input
                type="text"
                value={
                  profile.title
                }
                onChange={(e) =>
                  handleProfileChange(
                    'title',
                    e.target.value
                  )
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400"
                placeholder="e.g. Assistant Professor of Computer Science"
              />

            </div>

            {/* BIO */}

            <div>

              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Instructor Biography
              </label>

              <textarea
                rows="4"
                value={
                  profile.bio
                }
                onChange={(e) =>
                  handleProfileChange(
                    'bio',
                    e.target.value
                  )
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400 resize-none"
                placeholder="Tell students a little about yourself..."
              />

            </div>

            {/* OFFICE HOURS */}

            <div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1.5">

                <Calendar className="w-3.5 h-3.5 text-slate-400" />

                Published Office Hours

              </label>

              <input
                type="text"
                value={
                  profile.officeHours
                }
                onChange={(e) =>
                  handleProfileChange(
                    'officeHours',
                    e.target.value
                  )
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400"
                placeholder="e.g. Sunday & Tuesday, 2:00 PM - 4:00 PM"
              />

            </div>

            {/* SAVE PROFILE */}

            <div className="flex justify-end pt-2">

              <button
                type="submit"
                disabled={
                  savingProfile
                }
                className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 flex items-center gap-2 shadow-md shadow-brand-500/20 disabled:opacity-60"
              >

                {savingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}

                {savingProfile
                  ? 'Saving...'
                  : 'Save Profile'}

              </button>

            </div>

          </form>

          {/* =================================================
              GRADING PREFERENCES
          ================================================= */}

          <form
            onSubmit={
              handleSavePreferences
            }
            className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-5"
          >

            <div>

              <h3 className="text-sm font-bold text-slate-900">
                Grading & Submission Policies
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Configure how you want to handle
                student submissions.
              </p>

            </div>

            {/* LATE SUBMISSIONS */}

            <label className="flex items-start gap-3 cursor-pointer p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition">

              <input
                type="checkbox"
                checked={
                  preferences.allowLateSubmissions
                }
                onChange={() =>
                  togglePreference(
                    'allowLateSubmissions'
                  )
                }
                className="w-4 h-4 mt-0.5 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />

              <div>

                <p className="text-xs text-slate-800 font-bold">
                  Allow late submissions
                </p>

                <p className="text-[11px] text-slate-500 mt-1">
                  Allow students to submit problem
                  sets after the deadline with a
                  late flag.
                </p>

              </div>

            </label>

            {/* GRADING NOTIFICATIONS */}

            <label className="flex items-start gap-3 cursor-pointer p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition">

              <input
                type="checkbox"
                checked={
                  preferences.gradingNotifications
                }
                onChange={() =>
                  togglePreference(
                    'gradingNotifications'
                  )
                }
                className="w-4 h-4 mt-0.5 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />

              <div>

                <p className="text-xs text-slate-800 font-bold">
                  Grading notifications
                </p>

                <p className="text-[11px] text-slate-500 mt-1">
                  Keep grading-related notifications
                  enabled.
                </p>

              </div>

            </label>

            <div className="flex justify-end">

              <button
                type="submit"
                disabled={
                  savingPreferences
                }
                className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 flex items-center gap-2 disabled:opacity-60"
              >

                {savingPreferences ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}

                {savingPreferences
                  ? 'Saving...'
                  : 'Save Preferences'}

              </button>

            </div>

          </form>

          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          <div className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-5">

            <div>

              <h3 className="text-sm font-bold text-slate-900">
                Notification Preferences
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Choose which instructor notifications
                you want enabled.
              </p>

            </div>

            <label className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50">

              <div className="flex items-start gap-3">

                <Bell className="w-5 h-5 text-brand-600 mt-0.5" />

                <div>

                  <p className="text-xs font-bold text-slate-800">
                    Email Notifications
                  </p>

                  <p className="text-[11px] text-slate-500 mt-1">
                    Receive important EduPulse
                    notifications.
                  </p>

                </div>

              </div>

              <input
                type="checkbox"
                checked={
                  preferences.emailNotifications
                }
                onChange={() =>
                  togglePreference(
                    'emailNotifications'
                  )
                }
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />

            </label>

            <label className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50">

              <div className="flex items-start gap-3">

                <User className="w-5 h-5 text-brand-600 mt-0.5" />

                <div>

                  <p className="text-xs font-bold text-slate-800">
                    Student Messages
                  </p>

                  <p className="text-[11px] text-slate-500 mt-1">
                    Keep student communication
                    notifications enabled.
                  </p>

                </div>

              </div>

              <input
                type="checkbox"
                checked={
                  preferences.studentMessages
                }
                onChange={() =>
                  togglePreference(
                    'studentMessages'
                  )
                }
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />

            </label>

            <div className="flex justify-end">

              <button
                type="button"
                onClick={
                  handleSavePreferences
                }
                disabled={
                  savingPreferences
                }
                className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 flex items-center gap-2 disabled:opacity-60"
              >

                <Save className="w-4 h-4" />

                Save Notification Settings

              </button>

            </div>

          </div>

          {/* =================================================
              PASSWORD / SECURITY
          ================================================= */}

          <form
            onSubmit={
              handleChangePassword
            }
            className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6"
          >

            <div>

              <div className="flex items-center gap-2">

                <Shield className="w-5 h-5 text-brand-600" />

                <h3 className="text-sm font-bold text-slate-900">
                  Security & Password
                </h3>

              </div>

              <p className="text-xs text-slate-400 mt-1">
                Change your EduPulse account password.
              </p>

            </div>

            {/* CURRENT PASSWORD */}

            <div>

              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Current Password
              </label>

              <div className="relative">

                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                <input
                  type={
                    showCurrentPassword
                      ? 'text'
                      : 'password'
                  }
                  value={
                    passwords.currentPassword
                  }
                  onChange={(e) =>
                    setPasswords(
                      (prev) => ({
                        ...prev,
                        currentPassword:
                          e.target.value,
                      })
                    )
                  }
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Enter current password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowCurrentPassword(
                      (prev) => !prev
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>

              </div>

            </div>

            {/* NEW PASSWORD */}

            <div className="grid sm:grid-cols-2 gap-4">

              <div>

                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  New Password
                </label>

                <div className="relative">

                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                  <input
                    type={
                      showNewPassword
                        ? 'text'
                        : 'password'
                    }
                    value={
                      passwords.newPassword
                    }
                    onChange={(e) =>
                      setPasswords(
                        (prev) => ({
                          ...prev,
                          newPassword:
                            e.target.value,
                        })
                      )
                    }
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Minimum 6 characters"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowNewPassword(
                        (prev) => !prev
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>

                </div>

              </div>

              {/* CONFIRM */}

              <div>

                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm New Password
                </label>

                <div className="relative">

                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                  <input
                    type={
                      showConfirmPassword
                        ? 'text'
                        : 'password'
                    }
                    value={
                      passwords.confirmPassword
                    }
                    onChange={(e) =>
                      setPasswords(
                        (prev) => ({
                          ...prev,
                          confirmPassword:
                            e.target.value,
                        })
                      )
                    }
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Repeat new password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (prev) => !prev
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>

                </div>

              </div>

            </div>

            <div className="flex justify-end">

              <button
                type="submit"
                disabled={
                  changingPassword
                }
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 flex items-center gap-2 disabled:opacity-60"
              >

                {changingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}

                {changingPassword
                  ? 'Updating...'
                  : 'Update Password'}

              </button>

            </div>

          </form>

        </div>

      </main>

    </div>
  );
}