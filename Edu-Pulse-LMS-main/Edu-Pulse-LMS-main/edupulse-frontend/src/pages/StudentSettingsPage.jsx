import React, { useEffect, useRef, useState } from 'react';
import StudentSidebar from '../components/StudentSidebar';
import {
  User,
  Mail,
  Camera,
  Check,
  Lock,
  Save,
  AlertCircle,
} from 'lucide-react';
import api, {
  fileUrl,
  getUser,
  setSession,
} from '../api/client';

export default function StudentSettingsPage() {
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(getUser());

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const [profileImage, setProfileImage] = useState(
    fileUrl(user?.profile_image || '')
  );

  const [selectedImage, setSelectedImage] = useState(null);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // ======================================================
  // LOAD CURRENT USER FROM DATABASE
  // ======================================================

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoadingProfile(true);
        setProfileError('');

        // IMPORTANT:
        // The backend profile endpoint is /api/users/me
        const data = await api.get('/users/me');

        if (data?.user) {
          setUser(data.user);
          setName(data.user.name || '');
          setEmail(data.user.email || '');

          setProfileImage(
            fileUrl(data.user.profile_image || '')
          );

          const token = localStorage.getItem('edupulse_token');

          if (token) {
            setSession(token, data.user);
          }
        }
      } catch (error) {
        console.error('Could not load profile:', error);
        setProfileError(
          error.message || 'Could not load your profile.'
        );
      } finally {
        setLoadingProfile(false);
      }
    };

    loadUser();
  }, []);

  // ======================================================
  // SELECT PROFILE IMAGE
  // ======================================================

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError('Profile image must be smaller than 5 MB.');
      return;
    }

    setSelectedImage(file);
    setProfileError('');
    setProfileMessage('');

    // Show preview immediately
    setProfileImage(URL.createObjectURL(file));
  };

  // ======================================================
  // SAVE PROFILE
  // ======================================================

  const handleProfileSave = async (event) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setProfileError('Name cannot be empty.');
      return;
    }

    try {
      setSavingProfile(true);
      setProfileError('');
      setProfileMessage('');

      const formData = new FormData();

      formData.append('name', trimmedName);

      if (selectedImage) {
        formData.append('profile_image', selectedImage);
      }

      // Backend:
      // PATCH /api/users/me
      const data = await api.upload('/users/me', formData, 'PATCH');

      if (data?.user) {
        setUser(data.user);

        setName(data.user.name || '');
        setEmail(data.user.email || '');

        const image = fileUrl(
          data.user.profile_image || ''
        );

        setProfileImage(image);
        setSelectedImage(null);

        // Update saved login user
        const token = localStorage.getItem('edupulse_token');

        if (token) {
          setSession(token, data.user);
        }
      }

      setProfileMessage(
        'Profile updated successfully.'
      );
    } catch (error) {
      console.error('Profile update failed:', error);

      setProfileError(
        error.message || 'Could not update profile.'
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // ======================================================
  // CHANGE PASSWORD
  // ======================================================

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    setPasswordError('');
    setPasswordMessage('');

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordError(
        'Please fill in all password fields.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        'New passwords do not match.'
      );
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(
        'New password must be at least 6 characters.'
      );
      return;
    }

    try {
      setChangingPassword(true);

      await api.patch('/users/me/password', {
        currentPassword,
        newPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setPasswordMessage(
        'Password changed successfully.'
      );
    } catch (error) {
      console.error(
        'Password change failed:',
        error
      );

      setPasswordError(
        error.message ||
          'Could not change your password.'
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <StudentSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* PAGE HEADER */}
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Student Profile & Settings
            </h1>

            <p className="text-xs text-slate-500 mt-1">
              Manage your profile information and account security.
            </p>
          </div>

          {/* ==================================================
              PROFILE
          ================================================== */}

          <form
            onSubmit={handleProfileSave}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">
                  Profile Information
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Update your name and profile picture.
                </p>
              </div>

              <User className="w-5 h-5 text-brand-600" />
            </div>

            {/* PROFILE HEADER */}
            <div className="flex items-center gap-5 mb-7">
              <div className="relative">

                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-24 h-24 rounded-2xl object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 text-2xl font-extrabold">
                    {(name || 'S')
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-md hover:bg-brand-700"
                >
                  <Camera className="w-4 h-4" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  {name || 'Student'}
                </h3>

                <p className="text-xs text-slate-400 mt-1">
                  {email}
                </p>

                <span className="inline-block mt-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase">
                  Student
                </span>
              </div>
            </div>

            {/* ERROR */}
            {profileError && (
              <div className="mb-4 flex items-center gap-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl px-4 py-3 text-xs font-semibold">
                <AlertCircle className="w-4 h-4" />
                {profileError}
              </div>
            )}

            {/* SUCCESS */}
            {profileMessage && (
              <div className="mb-4 flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl px-4 py-3 text-xs font-semibold">
                <Check className="w-4 h-4" />
                {profileMessage}
              </div>
            )}

            {/* FIELDS */}
            <div className="space-y-4">

              {/* NAME */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  disabled={loadingProfile}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50"
                  placeholder="Enter your full name"
                />
              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  University Email
                </label>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-500 outline-none"
                  />
                </div>

                <p className="text-[10px] text-slate-400 mt-1.5">
                  Your login email is managed by the account system.
                </p>
              </div>

            </div>

            {/* SAVE */}
            <div className="flex justify-end mt-6">
              <button
                type="submit"
                disabled={savingProfile || loadingProfile}
                className="px-5 py-3 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />

                {savingProfile
                  ? 'Saving...'
                  : 'Save Profile'}
              </button>
            </div>
          </form>

          {/* ==================================================
              PASSWORD
          ================================================== */}

          <form
            onSubmit={handlePasswordChange}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">
                  Change Password
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Update your EduPulse account password.
                </p>
              </div>

              <Lock className="w-5 h-5 text-brand-600" />
            </div>

            {passwordError && (
              <div className="mb-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl px-4 py-3 text-xs font-semibold">
                {passwordError}
              </div>
            )}

            {passwordMessage && (
              <div className="mb-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl px-4 py-3 text-xs font-semibold">
                {passwordMessage}
              </div>
            )}

            <div className="space-y-4">

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Current Password
                </label>

                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) =>
                    setCurrentPassword(e.target.value)
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  New Password
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirm New Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

            </div>

            <div className="flex justify-end mt-6">
              <button
                type="submit"
                disabled={changingPassword}
                className="px-5 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-50"
              >
                {changingPassword
                  ? 'Changing...'
                  : 'Change Password'}
              </button>
            </div>
          </form>

        </div>
      </main>
    </div>
  );
}