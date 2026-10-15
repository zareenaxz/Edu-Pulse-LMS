import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import {
  ArrowLeft,
  ArrowRight,
  PlayCircle,
  CheckCircle2,
  FileText,
  MessageSquare,
  Send,
  BookOpen,
  Clock,
  HelpCircle,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';

export default function StudentCoursePlayerPage() {
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);

  const [progress, setProgress] = useState({
    completed: 0,
    total: 0,
    percentage: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Bookmark state
  const [bookmarkedLessonIds, setBookmarkedLessonIds] = useState(new Set());
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const [playerTab, setPlayerTab] = useState('notes');

  // Discussion state
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [discussionLoading, setDiscussionLoading] = useState(false);
  const [discussionPosting, setDiscussionPosting] = useState(false);
  const [discussionError, setDiscussionError] = useState('');
  const [selectedDiscussionId, setSelectedDiscussionId] = useState(null);
  const [replies, setReplies] = useState([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyPosting, setReplyPosting] = useState(false);

  const videoRef = useRef(null);
  const contentRef = useRef(null);
  const completingLessonRef = useRef(null);
  const lessonBottomRef = useRef(null);

  const token = localStorage.getItem('edupulse_token');

  /*
   * Normalize the progress response returned by the backend.
   * The backend returns: { progress: { total, done, percent }, lessons: [...] }
   * so progressData.progress is an OBJECT, not a number.
   */
  const normalizeProgress = (payload, fallbackTotal = 0, fallbackCompleted = 0) => {
    const source =
      payload?.progress &&
      typeof payload.progress === 'object'
        ? payload.progress
        : payload || {};

    const completedRaw =
      source.done ??
      source.completed ??
      source.completedLessons ??
      payload?.done ??
      payload?.completed ??
      payload?.completedLessons ??
      fallbackCompleted;

    const totalRaw =
      source.total ??
      source.totalLessons ??
      payload?.total ??
      payload?.totalLessons ??
      fallbackTotal;

    const percentRaw =
      source.percent ??
      source.percentage ??
      payload?.percentage;

    const completed = Number(completedRaw) || 0;
    const total = Number(totalRaw) || 0;

    const percentage =
      Number.isFinite(Number(percentRaw))
        ? Number(percentRaw)
        : total > 0
          ? Math.round((completed / total) * 100)
          : 0;

    return {
      completed,
      total,
      percentage: Math.min(100, Math.max(0, percentage))
    };
  };

  /*
   * Convert YouTube URL to embed URL
   */
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;

    try {
      const parsed = new URL(url);

      if (parsed.hostname.includes('youtu.be')) {
        const videoId = parsed.pathname.replace('/', '');

        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }

      if (
        parsed.hostname.includes('youtube.com') &&
        parsed.searchParams.get('v')
      ) {
        return `https://www.youtube.com/embed/${parsed.searchParams.get('v')}`;
      }

      if (
        parsed.hostname.includes('youtube.com') &&
        parsed.pathname.startsWith('/embed/')
      ) {
        return url;
      }

      return null;
    } catch {
      return null;
    }
  };

  /*
   * Load the student's bookmarks.
   *
   * The backend returns:
   * { success: true, count, bookmarks: [{ bookmark_id, lesson_id, ... }] }
   */
  useEffect(() => {
    const loadBookmarks = async () => {
      if (!token) return;

      try {
        const data = await api.get('/bookmarks');
        const ids = new Set(
          (Array.isArray(data?.bookmarks) ? data.bookmarks : [])
            .map((item) => Number(item.lesson_id))
            .filter((id) => Number.isFinite(id))
        );

        setBookmarkedLessonIds(ids);
      } catch (err) {
        console.error('Bookmark loading error:', err);
      }
    };

    loadBookmarks();
  }, [token]);

  /*
   * Add/remove bookmark for the active lesson.
   */
  const handleToggleBookmark = async () => {
    if (!activeLesson || bookmarkLoading) return;

    const lessonId = Number(activeLesson.lesson_id);
    if (!Number.isFinite(lessonId)) return;

    const isBookmarked = bookmarkedLessonIds.has(lessonId);

    setBookmarkLoading(true);
    setError('');
    setMessage('');

    try {
      if (isBookmarked) {
        // We need the bookmark record id for DELETE.
        const data = await api.get('/bookmarks');
        const currentBookmark = (data?.bookmarks || []).find(
          (item) => Number(item.lesson_id) === lessonId
        );

        if (!currentBookmark?.bookmark_id) {
          throw new Error('Bookmark record was not found.');
        }

        await api.delete(`/bookmarks/${currentBookmark.bookmark_id}`);

        setBookmarkedLessonIds((previous) => {
          const next = new Set(previous);
          next.delete(lessonId);
          return next;
        });

        setMessage('Lesson removed from bookmarks.');
      } else {
        await api.post('/bookmarks', { lesson_id: lessonId });

        setBookmarkedLessonIds((previous) => {
          const next = new Set(previous);
          next.add(lessonId);
          return next;
        });

        setMessage('Lesson bookmarked.');
      }
    } catch (err) {
      console.error('Bookmark update error:', err);
      setError(err.message || 'Could not update the bookmark.');
    } finally {
      setBookmarkLoading(false);
    }
  };

  /*
   * Load course information
   */
  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId || !token) return;

      try {
        const response = await fetch(
          `http://localhost:5000/api/courses/${courseId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (response.ok && data.course) {
          setCourse(data.course);
        } else {
          console.error('Could not load course:', data);
        }
      } catch (err) {
        console.error('Could not load course:', err);
      }
    };

    loadCourse();
  }, [courseId, token]);

  /*
   * Load lessons and student progress
   */
  useEffect(() => {
    const loadLearningData = async () => {
      setLoading(true);
      setError('');

      if (!token) {
        setError('Please log in again.');
        setLoading(false);
        return;
      }

      try {
        /*
         * Load lessons
         */
        const lessonResponse = await fetch(
          `http://localhost:5000/api/courses/${courseId}/lessons`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const lessonData = await lessonResponse.json();

        if (!lessonResponse.ok) {
          setError(
            lessonData.message ||
              'Could not load the lessons for this course.'
          );
          setLoading(false);
          return;
        }

        const backendLessons = lessonData.lessons || [];

        setLessons(backendLessons);

        /*
         * Load progress
         */
        let completedLessonIds = new Set();

        try {
          const progressResponse = await fetch(
            `http://localhost:5000/api/progress/courses/${courseId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          const progressData = await progressResponse.json();

          if (progressResponse.ok) {
            const normalized = normalizeProgress(
              progressData,
              backendLessons.length,
              0
            );

            setProgress(normalized);

            /*
             * The backend returns per-lesson progress in
             * progressData.lessons.
             */
            const progressLessons = Array.isArray(progressData.lessons)
              ? progressData.lessons
              : [];

            completedLessonIds = new Set(
              progressLessons
                .filter((item) => Number(item.completed) === 1 || item.completed === true)
                .map((item) => Number(item.lesson_id))
            );

            setLessons(
              backendLessons.map((lesson) => ({
                ...lesson,
                completed: completedLessonIds.has(Number(lesson.lesson_id))
              }))
            );
          } else {
            setProgress({
              completed: 0,
              total: backendLessons.length,
              percentage: 0
            });
          }
        } catch (progressError) {
          console.error(
            'Progress loading error:',
            progressError
          );

          setProgress({
            completed: 0,
            total: backendLessons.length,
            percentage: 0
          });
        }

        /*
         * Open the first incomplete lesson automatically.
         */
        const firstIncompleteIndex = backendLessons.findIndex(
          (lesson) => !completedLessonIds.has(Number(lesson.lesson_id))
        );

        if (firstIncompleteIndex >= 0) {
          setActiveLessonIndex(firstIncompleteIndex);
        } else if (backendLessons.length > 0) {
          setActiveLessonIndex(0);
        }

        setLoading(false);
      } catch (err) {
        console.error(
          'Learning data loading error:',
          err
        );

        setError(
          'Could not connect to the backend.'
        );

        setLoading(false);
      }
    };

    if (courseId) {
      loadLearningData();
    }
  }, [courseId, token]);

  const activeLesson =
    lessons[activeLessonIndex];

  /*
   * Save lesson completion in the backend.
   * This is the single completion function used by:
   * 1. The manual "Mark Lesson Complete" button
   * 2. Text lesson bottom detection
   * 3. Native video completion
   * 4. Next Lesson navigation
   *
   * The manual button is especially important for the final lesson,
   * because there is no next-lesson navigation action after it.
   */
  const markLessonComplete = async (lesson) => {
    if (!lesson) return false;

    if (lesson.completed) {
      return true;
    }

    if (
      completingLessonRef.current ===
      lesson.lesson_id
    ) {
      return false;
    }

    if (!token) {
      setError('Please log in again.');
      return false;
    }

    completingLessonRef.current = lesson.lesson_id;
    setError('');
    setMessage('');

    try {
      const data = await api.post(
        `/progress/lessons/${lesson.lesson_id}/complete`
      );

      /* Update the lesson immediately in the UI. */
      setLessons((previousLessons) =>
        previousLessons.map((item) =>
          Number(item.lesson_id) === Number(lesson.lesson_id)
            ? { ...item, completed: true }
            : item
        )
      );

      /*
       * Prefer the backend response, then refresh from the database.
       * This makes the final lesson reliably become 100%.
       */
      let normalized = normalizeProgress(
        data,
        progress.total || lessons.length,
        progress.completed + 1
      );

      try {
        const latestProgress = await api.get(
          `/progress/courses/${courseId}`
        );

        normalized = normalizeProgress(
          latestProgress,
          lessons.length,
          normalized.completed
        );

        const progressLessons = Array.isArray(latestProgress?.lessons)
          ? latestProgress.lessons
          : [];

        const completedIds = new Set(
          progressLessons
            .filter(
              (item) =>
                Number(item.completed) === 1 ||
                item.completed === true ||
                item.status === 'completed'
            )
            .map((item) => Number(item.lesson_id))
        );

        setLessons((previousLessons) =>
          previousLessons.map((item) => ({
            ...item,
            completed: completedIds.has(Number(item.lesson_id))
          }))
        );
      } catch (refreshError) {
        console.warn(
          'Could not refresh course progress after completion:',
          refreshError
        );
      }

      /* Never allow the UI to show more than 100%. */
      normalized = {
        ...normalized,
        percentage: Math.min(100, Math.max(0, normalized.percentage)),
        completed: Math.min(
          lessons.length,
          Math.max(0, normalized.completed)
        ),
        total: lessons.length || normalized.total
      };

      setProgress(normalized);

      if (normalized.completed >= normalized.total && normalized.total > 0) {
        setMessage('Congratulations! You completed the course.');
      } else {
        setMessage('Lesson completed successfully.');
      }

      return true;
    } catch (err) {
      console.error('Lesson completion error:', err);
      setError(
        err?.message ||
          'Could not save your lesson progress.'
      );
      return false;
    } finally {
      setTimeout(() => {
        completingLessonRef.current = null;
      }, 500);
    }
  };

  /*
   * Automatically complete a lesson and move to the next one.
   * The final lesson stays on screen and shows the completion message.
   */
  const completeLessonAutomatically = async (lesson) => {
    if (!lesson || lesson.completed) {
      return;
    }

    const completed = await markLessonComplete(lesson);

    if (!completed) {
      return;
    }

    const nextIndex = activeLessonIndex + 1;

    if (nextIndex < lessons.length) {
      setTimeout(() => {
        setActiveLessonIndex(nextIndex);
        setMessage('');
      }, 1200);
    }
  };

  /*
   * Automatically complete video lessons
   * when 90% of the video has been watched.
   */
  const handleVideoProgress = () => {
    const video = videoRef.current;

    if (!video || !activeLesson) {
      return;
    }

    if (
      !video.duration ||
      !isFinite(video.duration)
    ) {
      return;
    }

    const percentageWatched =
      (video.currentTime / video.duration) * 100;

    if (percentageWatched >= 90) {
      completeLessonAutomatically(activeLesson);
    }
  };

  const handleVideoEnded = () => {
    if (!activeLesson || activeLesson.completed) return;
    completeLessonAutomatically(activeLesson);
  };

  /*
   * Automatically complete text lessons when the student
   * reaches the bottom of the lesson content.
   *
   * We check BOTH the lesson's own scroll container and the
   * browser window. This is important because a short lesson
   * may not create an inner scrollbar, so the student actually
   * scrolls the page instead.
   */
  const handleContentScroll = () => {
    const element = contentRef.current;

    if (!element || !activeLesson || activeLesson.completed) {
      return;
    }

    const distanceFromBottom =
      element.scrollHeight -
      element.scrollTop -
      element.clientHeight;

    if (distanceFromBottom <= 30) {
      completeLessonAutomatically(activeLesson);
    }
  };

  const handlePageScroll = () => {
    const textLesson =
      Boolean(activeLesson?.content) &&
      !activeLesson?.video_url;

    if (!activeLesson || activeLesson.completed || !textLesson) {
      return;
    }

    // If the lesson has its own scroll area, its scroll handler
    // will handle completion. For normal page scrolling, check
    // whether the browser has reached the bottom of the page.
    const pageBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 50;

    if (pageBottom) {
      completeLessonAutomatically(activeLesson);
      return;
    }

    // Also check the lesson content itself. This handles pages
    // where the lesson content ends before the document bottom.
    const element = contentRef.current;
    if (element) {
      const rect = element.getBoundingClientRect();
      const reachedBottomOfContent =
        rect.bottom <= window.innerHeight + 40;

      if (reachedBottomOfContent) {
        completeLessonAutomatically(activeLesson);
      }
    }
  };

  /*
   * Watch the actual bottom of the lesson in the browser page.
   * This makes automatic completion work even when the page,
   * rather than the lesson-content box, is being scrolled.
   */
  useEffect(() => {
    const textLesson =
      Boolean(activeLesson?.content) &&
      !activeLesson?.video_url;

    if (!activeLesson || !textLesson || activeLesson.completed) {
      return undefined;
    }

    window.addEventListener('scroll', handlePageScroll, { passive: true });
    window.addEventListener('resize', handlePageScroll);

    const timer = setTimeout(handlePageScroll, 300);

    return () => {
      window.removeEventListener('scroll', handlePageScroll);
      window.removeEventListener('resize', handlePageScroll);
      clearTimeout(timer);
    };
  }, [activeLessonIndex, activeLesson?.lesson_id, activeLesson?.completed]);

  /*
   * Watch the bottom sentinel of a text lesson.
   * This is more reliable than relying only on window scroll events,
   * especially when the lesson content has its own scroll container.
   */
  useEffect(() => {
    const textLesson =
      Boolean(activeLesson?.content) &&
      !activeLesson?.video_url;

    if (
      !activeLesson ||
      !textLesson ||
      activeLesson.completed ||
      !lessonBottomRef.current
    ) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry?.isIntersecting) {
          completeLessonAutomatically(activeLesson);
        }
      },
      {
        root: contentRef.current || null,
        threshold: 0.1
      }
    );

    observer.observe(lessonBottomRef.current);

    return () => observer.disconnect();
  }, [
    activeLessonIndex,
    activeLesson?.lesson_id,
    activeLesson?.completed
  ]);

  /*
   * Reset player when lesson changes.
   */
  useEffect(() => {
    if (!activeLesson) return;

    completingLessonRef.current = null;

    setMessage('');
    setError('');

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }

    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [activeLessonIndex]);

  /*
   * Previous lesson
   */
  const handlePrevious = () => {
    if (activeLessonIndex > 0) {
      setActiveLessonIndex(
        activeLessonIndex - 1
      );
    }
  };

  /*
   * Next lesson
   */
  const handleNext = async () => {
    if (activeLessonIndex >= lessons.length - 1) {
      return;
    }

    const currentLesson = lessons[activeLessonIndex];

    if (currentLesson && !currentLesson.completed) {
      const completed = await markLessonComplete(currentLesson);

      if (!completed) {
        return;
      }
    }

    setActiveLessonIndex(activeLessonIndex + 1);
    setMessage('');
    setError('');
  };

  /*
   * DISCUSSIONS
   * The backend discussion API is course-level, so the same discussion
   * list is shown from every lesson in this course.
   */
  const loadDiscussions = async () => {
    if (!courseId) return;

    setDiscussionLoading(true);
    setDiscussionError('');

    try {
      const data = await api.get(`/discussions?course_id=${courseId}`);
      setComments(Array.isArray(data.discussions) ? data.discussions : []);
    } catch (err) {
      console.error('Discussion loading error:', err);
      setDiscussionError(err.message || 'Could not load course discussions.');
    } finally {
      setDiscussionLoading(false);
    }
  };

  useEffect(() => {
    if (playerTab === 'discussion' && courseId) {
      loadDiscussions();
    }
  }, [playerTab, courseId]);

  const loadReplies = async (discussionId) => {
    if (!discussionId) return;

    setSelectedDiscussionId(discussionId);
    setRepliesLoading(true);
    setDiscussionError('');

    try {
      const data = await api.get(`/discussions/${discussionId}`);
      setReplies(Array.isArray(data.replies) ? data.replies : []);
    } catch (err) {
      console.error('Reply loading error:', err);
      setReplies([]);
      setDiscussionError(err.message || 'Could not load replies.');
    } finally {
      setRepliesLoading(false);
    }
  };

  const handlePostComment = async (event) => {
    event.preventDefault();

    const text = commentText.trim();
    if (!text || discussionPosting) return;

    setDiscussionPosting(true);
    setDiscussionError('');

    try {
      await api.post('/discussions', {
        course_id: Number(courseId),
        title: text.length > 80 ? `${text.slice(0, 77)}...` : text,
        content: text
      });

      setCommentText('');
      await loadDiscussions();
    } catch (err) {
      console.error('Discussion posting error:', err);
      setDiscussionError(err.message || 'Could not post your question.');
    } finally {
      setDiscussionPosting(false);
    }
  };

  const handlePostReply = async (event) => {
    event.preventDefault();

    const text = replyText.trim();
    if (!text || !selectedDiscussionId || replyPosting) return;

    setReplyPosting(true);
    setDiscussionError('');

    try {
      await api.post(`/discussions/${selectedDiscussionId}/replies`, {
        content: text
      });

      setReplyText('');
      await loadReplies(selectedDiscussionId);
      await loadDiscussions();
    } catch (err) {
      console.error('Reply posting error:', err);
      setDiscussionError(err.message || 'Could not post your reply.');
    } finally {
      setReplyPosting(false);
    }
  };

  const formatDiscussionTime = (value) => {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleString([], {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  };

  /*
   * Loading
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm px-10 py-8 text-center">
          <div className="w-10 h-10 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>

          <h2 className="text-lg font-bold text-slate-900">
            Loading lesson...
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Connecting to EduPulse.
          </p>
        </div>
      </div>
    );
  }

  /*
   * Error / no lessons
   */
  if (
    error ||
    lessons.length === 0
  ) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex flex-col">
        <div className="bg-white border-b border-slate-100 px-6 py-5">
          <Link
            to={`/student/course/${courseId}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 max-w-lg w-full text-center">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-5">
              <HelpCircle className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-extrabold text-slate-900">
              {error
                ? 'Unable to load lessons'
                : 'No lessons available'}
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              {error ||
                'This course does not have any lessons available yet.'}
            </p>

            <Link
              to={`/student/course/${courseId}`}
              className="inline-flex items-center justify-center mt-6 px-6 py-3 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700"
            >
              Back to Course
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const youtubeEmbedUrl =
    getYouTubeEmbedUrl(
      activeLesson?.video_url
    );

  const hasTextContent =
    Boolean(activeLesson?.content) &&
    !activeLesson?.video_url;

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex flex-col">

      {/* TOP BAR */}
      <header className="bg-white border-b border-slate-100 px-6 py-3.5 flex justify-between items-center sticky top-0 z-30 shadow-sm">

        <div className="flex items-center gap-3 min-w-0">

          <Link
            to={`/student/course/${courseId}`}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="min-w-0">

            <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest bg-brand-50 px-2 py-0.5 rounded">
              Active Lecture Room
            </span>

            <h1 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 truncate">
              {course?.title || 'Course'} •{' '}
              {activeLesson?.title || 'Lesson'}
            </h1>

          </div>
        </div>

        <div className="flex items-center gap-2">

          <button
            onClick={handlePrevious}
            disabled={
              activeLessonIndex === 0
            }
            className="p-2.5 rounded-xl border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleNext}
            disabled={
              activeLessonIndex ===
              lessons.length - 1
            }
            className="p-2.5 rounded-xl border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          {activeLesson?.completed && (
            <div className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              Completed
            </div>
          )}

        </div>
      </header>

      {/* MESSAGE */}
      {(message || error) && (
        <div className="px-6 pt-4">

          {message && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm font-semibold">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-xl px-4 py-3 text-sm font-semibold">
              {error}
            </div>
          )}

        </div>
      )}

      {/* MAIN */}
      <div className="flex-1 grid lg:grid-cols-[minmax(0,1fr)_390px]">

        {/* LEFT */}
        <main className="p-5 lg:p-6">

          {/* VIDEO */}
          <div className="bg-black rounded-3xl overflow-hidden shadow-lg border-4 border-slate-900">

            {youtubeEmbedUrl ? (
              <>
                <div className="relative w-full aspect-video">
                  <iframe
                    src={youtubeEmbedUrl}
                    title={activeLesson?.title || 'Lesson Video'}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>

                <div className="px-4 py-2 bg-slate-900 text-slate-300 text-[10px] text-center">
                  YouTube lesson: completion is saved when the lesson's completion rule is triggered.
                </div>
              </>
            ) : activeLesson?.video_url ? (
              <video
                ref={videoRef}
                key={activeLesson.video_url}
                src={activeLesson.video_url}
                controls
                onTimeUpdate={handleVideoProgress}
                onEnded={handleVideoEnded}
                className="w-full aspect-video bg-black"
              >
                Your browser does not support video playback.
              </video>
            ) : (
              <div className="aspect-video flex items-center justify-center text-white">

                <div className="text-center">

                  <PlayCircle className="w-14 h-14 mx-auto text-slate-400" />

                  <p className="mt-3 font-bold">
                    No video uploaded for this lesson
                  </p>

                  <p className="text-sm text-slate-400 mt-1">
                    Read the lesson content below to complete this lesson.
                  </p>

                </div>

              </div>
            )}

          </div>

          {/* LESSON INFORMATION */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm mt-5 p-6">

            <div className="flex items-start justify-between gap-4">

              <div>

                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-2 py-1 rounded">
                  Lesson {activeLessonIndex + 1}
                </span>

                <h2 className="text-xl font-extrabold text-slate-900 mt-3">
                  {activeLesson?.title}
                </h2>

              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activeLesson?.completed ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    Completed
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => markLessonComplete(activeLesson)}
                    disabled={
                      completingLessonRef.current ===
                      activeLesson?.lesson_id
                    }
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark Lesson Complete
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleToggleBookmark}
                  disabled={bookmarkLoading}
                  title={
                    bookmarkedLessonIds.has(Number(activeLesson?.lesson_id))
                      ? 'Remove bookmark'
                      : 'Bookmark lesson'
                  }
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition ${
                    bookmarkedLessonIds.has(Number(activeLesson?.lesson_id))
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {bookmarkedLessonIds.has(Number(activeLesson?.lesson_id)) ? (
                    <BookmarkCheck className="w-4 h-4" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                  {bookmarkLoading
                    ? 'Saving...'
                    : bookmarkedLessonIds.has(Number(activeLesson?.lesson_id))
                      ? 'Bookmarked'
                      : 'Bookmark'}
                </button>
              </div>

            </div>

            {activeLesson?.description && (
              <p className="text-sm text-slate-600 leading-6 mt-4">
                {activeLesson.description}
              </p>
            )}

            {activeLesson?.content && (
              <div
                ref={contentRef}
                onScroll={
                  hasTextContent
                    ? handleContentScroll
                    : undefined
                }
                className={`mt-6 pt-6 border-t border-slate-100 ${
                  hasTextContent
                    ? 'max-h-[500px] overflow-y-auto pr-3'
                    : ''
                }`}
              >

                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-600" />
                  Lesson Content
                </h3>

                <div className="mt-3 text-sm text-slate-600 leading-7 whitespace-pre-wrap">
                  {activeLesson.content}
                </div>

                {hasTextContent &&
                  !activeLesson.completed && (
                    <>
                      <div className="mt-6 p-3 bg-brand-50 border border-brand-100 rounded-xl text-xs text-brand-700 font-semibold">
                        Scroll to the bottom of the lesson to automatically mark it as completed.
                      </div>
                      <div ref={lessonBottomRef} className="h-8 w-full" aria-hidden="true" />
                    </>
                  )}

              </div>
            )}

          </div>

          {/* TABS */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm mt-5 overflow-hidden">

            <div className="flex border-b border-slate-100">

              <button
                onClick={() =>
                  setPlayerTab('notes')
                }
                className={`px-5 py-4 text-xs font-bold flex items-center gap-2 ${
                  playerTab === 'notes'
                    ? 'text-brand-600 border-b-2 border-brand-600'
                    : 'text-slate-500'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Notes
              </button>

              <button
                onClick={() =>
                  setPlayerTab('discussion')
                }
                className={`px-5 py-4 text-xs font-bold flex items-center gap-2 ${
                  playerTab === 'discussion'
                    ? 'text-brand-600 border-b-2 border-brand-600'
                    : 'text-slate-500'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Discussion
              </button>

              <button
                onClick={() =>
                  setPlayerTab('resources')
                }
                className={`px-5 py-4 text-xs font-bold flex items-center gap-2 ${
                  playerTab === 'resources'
                    ? 'text-brand-600 border-b-2 border-brand-600'
                    : 'text-slate-500'
                }`}
              >
                <FileText className="w-4 h-4" />
                Resources
              </button>

            </div>

            <div className="p-5">

              {/* NOTES */}
              {playerTab === 'notes' && (
                <div>

                  <h3 className="font-bold text-slate-900 text-sm">
                    Lesson Notes
                  </h3>

                  <p className="text-sm text-slate-500 mt-2">
                    Take notes while studying this lesson.
                  </p>

                  <textarea
                    placeholder="Write your notes here..."
                    className="w-full mt-4 min-h-32 rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-brand-500"
                  />

                </div>
              )}

              {/* DISCUSSION */}
              {playerTab === 'discussion' && (
                <div>

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        Course Discussion
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Ask questions and discuss this course with other learners.
                      </p>
                    </div>

                    <span className="text-[10px] text-slate-400">
                      {comments.length} {comments.length === 1 ? 'discussion' : 'discussions'}
                    </span>
                  </div>

                  {discussionError && (
                    <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl px-4 py-3 text-xs font-semibold">
                      {discussionError}
                    </div>
                  )}

                  {discussionLoading ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Loading discussions...
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="mt-4 bg-slate-50 rounded-2xl p-5">
                      <p className="text-sm font-semibold text-slate-700">
                        No discussions yet.
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Be the first student to ask a question.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 mt-4">
                      {comments.map((comment) => {
                        const isSelected = Number(selectedDiscussionId) === Number(comment.discussion_id);

                        return (
                          <div key={comment.discussion_id} className="bg-slate-50 rounded-2xl p-4">
                            <button
                              type="button"
                              onClick={() => loadReplies(comment.discussion_id)}
                              className="w-full text-left"
                            >
                              <div className="flex justify-between gap-3">
                                <span className="font-bold text-xs text-slate-900">
                                  {comment.author_name || 'Student'}
                                </span>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  {formatDiscussionTime(comment.created_at)}
                                </span>
                              </div>

                              <p className="text-xs font-semibold text-slate-900 mt-2">
                                {comment.title}
                              </p>

                              <p className="text-xs text-slate-600 mt-1 leading-5">
                                {comment.content}
                              </p>

                              <p className="text-[10px] text-brand-600 font-semibold mt-3">
                                {comment.replies_count || 0} {Number(comment.replies_count) === 1 ? 'reply' : 'replies'}
                              </p>
                            </button>

                            {isSelected && (
                              <div className="mt-4 pt-4 border-t border-slate-200">
                                {repliesLoading ? (
                                  <p className="text-[11px] text-slate-400">
                                    Loading replies...
                                  </p>
                                ) : replies.length === 0 ? (
                                  <p className="text-[11px] text-slate-400">
                                    No replies yet.
                                  </p>
                                ) : (
                                  <div className="space-y-3">
                                    {replies.map((reply) => (
                                      <div key={reply.reply_id} className="bg-white border border-slate-100 rounded-xl p-3">
                                        <div className="flex justify-between gap-3">
                                          <span className="text-[11px] font-bold text-slate-800">
                                            {reply.author_name || 'Student'}
                                          </span>
                                          <span className="text-[10px] text-slate-400">
                                            {formatDiscussionTime(reply.created_at)}
                                          </span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-2 leading-5">
                                          {reply.content}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <form onSubmit={handlePostReply} className="flex gap-2 mt-3">
                                  <input
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Write a reply..."
                                    disabled={replyPosting}
                                    className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500 disabled:bg-slate-50"
                                  />
                                  <button
                                    type="submit"
                                    disabled={replyPosting || !replyText.trim()}
                                    className="px-3 rounded-xl bg-brand-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {replyPosting ? '...' : <Send className="w-4 h-4" />}
                                  </button>
                                </form>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <form onSubmit={handlePostComment} className="flex gap-2 mt-5">
                    <input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Ask a question..."
                      disabled={discussionPosting}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500 disabled:bg-slate-50 disabled:text-slate-400"
                    />

                    <button
                      type="submit"
                      disabled={discussionPosting || !commentText.trim()}
                      className="px-4 rounded-xl bg-brand-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {discussionPosting ? (
                        <span className="text-xs font-bold">...</span>
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </form>

                </div>
              )}

              {/* RESOURCES */}
              {playerTab === 'resources' && (
                <div>

                  <h3 className="font-bold text-slate-900 text-sm">
                    Lesson Resources
                  </h3>

                  <div className="mt-4 p-4 bg-slate-50 rounded-2xl flex items-center gap-3">

                    <FileText className="w-5 h-5 text-brand-600" />

                    <div>

                      <p className="text-xs font-bold text-slate-900">
                        Lesson Materials
                      </p>

                      <p className="text-[10px] text-slate-500 mt-1">
                        Resources for this lesson will appear here.
                      </p>

                    </div>

                  </div>

                </div>
              )}

            </div>

          </div>

        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="bg-white border-l border-slate-100 p-5 lg:p-6">

          <div className="sticky top-24">

            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600">
              Course
            </span>

            <h2 className="text-lg font-extrabold text-slate-900 mt-1">
              {course?.title || 'Course'}
            </h2>

            {course?.instructor_name && (
              <p className="text-xs text-slate-400 mt-1">
                Instructor: {course.instructor_name}
              </p>
            )}

            {/* PROGRESS */}
            <div className="mt-7">

              <div className="flex justify-between items-center">

                <h3 className="text-sm font-bold text-slate-900">
                  Course Progress
                </h3>

                <span className="text-sm font-extrabold text-brand-600">
                  {progress.percentage}%
                </span>

              </div>

              <div className="h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">

                <div
                  className="h-full bg-brand-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        progress.percentage
                      )
                    )}%`
                  }}
                />

              </div>

              <p className="text-[10px] text-slate-400 mt-2">
                {progress.completed} of{' '}
                {progress.total} lessons completed
              </p>

            </div>

            {/* SYLLABUS */}
            <div className="mt-8">

              <div className="flex justify-between items-center">

                <h3 className="text-sm font-bold text-slate-900">
                  Course Syllabus
                </h3>

                <span className="text-[10px] text-slate-400">
                  {lessons.length} Lessons
                </span>

              </div>

              <div className="space-y-2 mt-3">

                {lessons.map(
                  (lesson, index) => {
                    const isActive =
                      index ===
                      activeLessonIndex;

                    return (
                      <button
                        key={lesson.lesson_id}
                        onClick={() => {
                          setActiveLessonIndex(
                            index
                          );
                          setMessage('');
                          setError('');
                        }}
                        className={`w-full text-left rounded-2xl p-4 border transition ${
                          isActive
                            ? 'bg-brand-50 border-brand-200'
                            : 'bg-white border-slate-100 hover:bg-slate-50'
                        }`}
                      >

                        <div className="flex items-center gap-3">

                          {lesson.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          ) : (
                            <PlayCircle
                              className={`w-5 h-5 shrink-0 ${
                                isActive
                                  ? 'text-brand-600'
                                  : 'text-slate-400'
                              }`}
                            />
                          )}

                          <div className="min-w-0">

                            <p className="text-xs font-bold text-slate-900 truncate">
                              {index + 1}.{' '}
                              {lesson.title}
                            </p>

                            <div className="flex items-center gap-1 mt-1">

                              <Clock className="w-3 h-3 text-slate-400" />

                              <span className="text-[10px] text-slate-400">
                                {lesson.completed
                                  ? 'Completed'
                                  : 'Not completed'}
                              </span>

                            </div>

                          </div>

                        </div>

                      </button>
                    );
                  }
                )}

              </div>

            </div>

            {/* NAVIGATION */}
            <div className="grid grid-cols-2 gap-3 mt-6">

              <button
                onClick={handlePrevious}
                disabled={
                  activeLessonIndex === 0
                }
                className="px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 disabled:opacity-40"
              >
                Previous
              </button>

              <button
                onClick={handleNext}
                disabled={
                  activeLessonIndex ===
                  lessons.length - 1
                }
                className="px-4 py-3 rounded-xl bg-brand-600 text-white text-xs font-bold disabled:opacity-40"
              >
                Next Lesson
              </button>

            </div>

          </div>

        </aside>

      </div>
    </div>
  );
}