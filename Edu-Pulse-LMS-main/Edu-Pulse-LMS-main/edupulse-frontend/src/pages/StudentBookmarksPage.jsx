import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StudentSidebar from '../components/StudentSidebar';
import { api } from '../api/client';

import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Clock,
  PlayCircle,
  Trash2,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function StudentBookmarksPage() {
  const navigate = useNavigate();

  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // ============================================================
  // LOAD BOOKMARKS
  // ============================================================

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await api.get('/bookmarks');

      const list = Array.isArray(data?.bookmarks)
        ? data.bookmarks
        : [];

      setBookmarks(list);
    } catch (err) {
      console.error('Could not load bookmarks:', err);

      setError(
        err?.message ||
        'Could not load your bookmarks. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  // ============================================================
  // REMOVE BOOKMARK
  // ============================================================

  const handleRemoveBookmark = async (bookmarkId) => {
    if (!bookmarkId || removingId) return;

    try {
      setRemovingId(bookmarkId);
      setError('');
      setMessage('');

      await api.delete(`/bookmarks/${bookmarkId}`);

      setBookmarks((current) =>
        current.filter(
          (bookmark) =>
            Number(bookmark.bookmark_id) !== Number(bookmarkId)
        )
      );

      setMessage('Lesson removed from bookmarks.');
    } catch (err) {
      console.error('Could not remove bookmark:', err);

      setError(
        err?.message ||
        'Could not remove this bookmark.'
      );
    } finally {
      setRemovingId(null);
    }
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (value) => {
    if (!value) return '';

    const date = new Date(
      String(value).replace(' ', 'T')
    );

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <StudentSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* ================================================== */}
          {/* HEADER */}
          {/* ================================================== */}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <BookmarkCheck className="w-5 h-5" />
                </div>

                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600">
                  Saved Lessons
                </span>
              </div>

              <h1 className="text-2xl font-extrabold text-slate-900">
                My Bookmarks
              </h1>

              <p className="text-xs text-slate-500 mt-1">
                Keep your favorite lessons here so you can return to them easily.
              </p>
            </div>

            <Link
              to="/student/courses"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <BookOpen className="w-4 h-4" />
              My Courses
            </Link>

          </div>

          {/* ================================================== */}
          {/* SUCCESS MESSAGE */}
          {/* ================================================== */}

          {message && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-4 py-3 text-xs font-semibold">
              <BookmarkCheck className="w-4 h-4 shrink-0" />
              {message}
            </div>
          )}

          {/* ================================================== */}
          {/* ERROR */}
          {/* ================================================== */}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />

                <div>
                  <p className="text-xs font-bold text-red-700">
                    {error}
                  </p>

                  <button
                    type="button"
                    onClick={loadBookmarks}
                    className="mt-2 text-[11px] font-bold text-red-700 underline"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* LOADING */}
          {/* ================================================== */}

          {loading && (
            <div className="bg-white rounded-3xl border border-slate-100 p-14 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-7 h-7 text-brand-600 animate-spin mb-3" />

              <p className="text-sm font-bold text-slate-700">
                Loading your bookmarks...
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Please wait a moment.
              </p>
            </div>
          )}

          {/* ================================================== */}
          {/* EMPTY STATE */}
          {/* ================================================== */}

          {!loading && !error && bookmarks.length === 0 && (
            <div className="bg-white rounded-3xl border border-slate-100 p-14 text-center">

              <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-5">
                <Bookmark className="w-8 h-8" />
              </div>

              <h2 className="text-lg font-extrabold text-slate-900">
                No bookmarked lessons yet
              </h2>

              <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                Open a lesson from one of your courses and click the
                Bookmark button to save it here.
              </p>

              <Link
                to="/student/courses"
                className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition shadow-sm shadow-brand-500/20"
              >
                Browse My Courses
                <ArrowRight className="w-4 h-4" />
              </Link>

            </div>
          )}

          {/* ================================================== */}
          {/* BOOKMARK COUNT */}
          {/* ================================================== */}

          {!loading && bookmarks.length > 0 && (
            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-sm font-extrabold text-slate-900">
                  Saved Lessons
                </h2>

                <p className="text-[11px] text-slate-400 mt-0.5">
                  {bookmarks.length}{' '}
                  {bookmarks.length === 1
                    ? 'lesson'
                    : 'lessons'}{' '}
                  saved
                </p>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full">
                <BookmarkCheck className="w-3.5 h-3.5 text-brand-600" />

                <span className="text-[10px] font-bold text-slate-600">
                  {bookmarks.length} Bookmarked
                </span>
              </div>

            </div>
          )}

          {/* ================================================== */}
          {/* BOOKMARK CARDS */}
          {/* ================================================== */}

          {!loading && bookmarks.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.bookmark_id}
                  className="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition"
                >

                  {/* Card Top */}

                  <div>

                    <div className="flex items-start justify-between gap-3 mb-4">

                      <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveBookmark(
                            bookmark.bookmark_id
                          )
                        }
                        disabled={
                          removingId === bookmark.bookmark_id
                        }
                        title="Remove bookmark"
                        className="w-9 h-9 rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition flex items-center justify-center disabled:opacity-50"
                      >
                        {removingId === bookmark.bookmark_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>

                    </div>

                    {/* Course */}

                    <div className="mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                        {bookmark.course_title || 'Course'}
                      </span>
                    </div>

                    {/* Lesson title */}

                    <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                      {bookmark.lesson_title || 'Untitled Lesson'}
                    </h3>

                    {/* Date */}

                    <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-400">
                      <Clock className="w-3.5 h-3.5" />

                      <span>
                        Saved {formatDate(bookmark.created_at)}
                      </span>
                    </div>

                  </div>

                  {/* Card Bottom */}

                  <div className="mt-6 flex gap-2">

                    <Link
                      to={`/student/learn/${bookmark.course_id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Open Lesson
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/student/learn/${bookmark.course_id}?lesson=${bookmark.lesson_id}`
                        )
                      }
                      className="px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition"
                      title="Open this lesson"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>
      </main>
    </div>
  );
}