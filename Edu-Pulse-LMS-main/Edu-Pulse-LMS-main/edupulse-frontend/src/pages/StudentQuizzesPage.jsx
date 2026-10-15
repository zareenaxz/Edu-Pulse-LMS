import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StudentSidebar from '../components/StudentSidebar';
import { api } from '../api/client';

import {
  HelpCircle,
  Clock3,
  CheckCircle2,
  PlayCircle,
  Loader2,
  AlertCircle,
  BookOpen,
  Award,
} from 'lucide-react';

export default function StudentQuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      setError('');

      const [quizResponse, attemptResponse] =
        await Promise.all([
          api.get('/quizzes'),
          api.get('/quizzes/attempts/me'),
        ]);

      setQuizzes(
        quizResponse?.quizzes || []
      );

      setAttempts(
        attemptResponse?.attempts || []
      );
    } catch (err) {
      console.error(
        'Failed to load student quizzes:',
        err
      );

      setError(
        err?.message ||
          'Unable to load quizzes.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getAttemptsForQuiz = (quizId) => {
    return attempts.filter(
      (attempt) =>
        Number(attempt.quiz_id) ===
        Number(quizId)
    );
  };

  const getLatestAttempt = (quizId) => {
    const quizAttempts =
      getAttemptsForQuiz(quizId);

    if (!quizAttempts.length) {
      return null;
    }

    return quizAttempts[0];
  };

  const formatScore = (attempt) => {
    if (!attempt) {
      return null;
    }

    return `${Number(attempt.score || 0)} / ${Number(
      attempt.total_marks || 0
    )}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <StudentSidebar />

      <main className="flex-1 min-w-0">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">

          {/* HEADER */}
          <div className="mb-7">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <HelpCircle className="w-6 h-6" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  My Quizzes
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                  Take quizzes from your enrolled courses and check your results.
                </p>
              </div>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* LOADING */}
          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 flex items-center justify-center">
              <div className="flex items-center gap-3 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-semibold">
                  Loading quizzes...
                </span>
              </div>
            </div>
          ) : quizzes.length === 0 ? (
            /* EMPTY */
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-slate-400" />
              </div>

              <h2 className="text-lg font-bold text-slate-800 mt-4">
                No quizzes available
              </h2>

              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                Quizzes created for your enrolled courses will appear here.
              </p>

              <Link
                to="/student/courses"
                className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700"
              >
                <BookOpen className="w-4 h-4" />
                View My Courses
              </Link>
            </div>
          ) : (
            /* QUIZ LIST */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {quizzes.map((quiz) => {
                const latestAttempt =
                  getLatestAttempt(
                    quiz.quiz_id
                  );

                const completed =
                  Boolean(
                    latestAttempt?.completed_at
                  );

                const attemptCount =
                  getAttemptsForQuiz(
                    quiz.quiz_id
                  ).length;

                return (
                  <div
                    key={quiz.quiz_id}
                    className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    {/* TOP */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                          <HelpCircle className="w-5 h-5" />
                        </div>

                        <div className="min-w-0">
                          <h2 className="font-bold text-slate-900 text-base truncate">
                            {quiz.title}
                          </h2>

                          <p className="text-xs text-brand-600 font-semibold mt-1">
                            {quiz.course_title ||
                              'Course'}
                          </p>
                        </div>
                      </div>

                      {completed && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Completed
                        </span>
                      )}
                    </div>

                    {/* DESCRIPTION */}
                    {quiz.description && (
                      <p className="text-sm text-slate-500 mt-4 line-clamp-2">
                        {quiz.description}
                      </p>
                    )}

                    {/* INFO */}
                    <div className="flex flex-wrap items-center gap-4 mt-5 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                        {quiz.questions_count || 0}{' '}
                        Questions
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-slate-400" />
                        {quiz.total_marks || 0}{' '}
                        Marks
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock3 className="w-3.5 h-3.5 text-slate-400" />
                        {attemptCount}{' '}
                        {attemptCount === 1
                          ? 'Attempt'
                          : 'Attempts'}
                      </div>
                    </div>

                    {/* PREVIOUS SCORE */}
                    {latestAttempt && (
                      <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500">
                            Latest Result
                          </span>

                          {latestAttempt.completed_at ? (
                            <span className="text-sm font-bold text-emerald-600">
                              {formatScore(
                                latestAttempt
                              )}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-amber-600">
                              In Progress
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ACTION */}
                    <div className="mt-5 flex justify-end">
                      <Link
                        to={`/student/quiz/${quiz.quiz_id}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700"
                      >
                        <PlayCircle className="w-4 h-4" />

                        {completed
                          ? 'Take Again'
                          : 'Start Quiz'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}