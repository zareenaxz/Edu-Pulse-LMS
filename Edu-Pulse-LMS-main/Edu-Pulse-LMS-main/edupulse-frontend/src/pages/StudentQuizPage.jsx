import React, { useEffect, useState } from 'react';

import {
  Link,
  useParams,
} from 'react-router-dom';

import StudentSidebar from '../components/StudentSidebar';
import { api } from '../api/client';

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Loader2,
  AlertCircle,
  Award,
  Send,
  PlayCircle,
  XCircle,
} from 'lucide-react';

export default function StudentQuizPage() {
  const { quizId } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [answers, setAnswers] = useState({});
  const [attemptId, setAttemptId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);

  // ============================================================
  // LOAD QUIZ
  // ============================================================

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(
        `/quizzes/${quizId}`
      );

      setQuiz(response?.quiz || null);

      setQuestions(
        Array.isArray(response?.questions)
          ? response.questions
          : []
      );
    } catch (err) {
      console.error(
        'Failed to load quiz:',
        err
      );

      setError(
        err?.message ||
          'Unable to load this quiz.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // START QUIZ
  // ============================================================

  const startQuiz = async () => {
    try {
      setStarting(true);
      setError('');

      const response = await api.post(
        `/quizzes/${quizId}/attempts`
      );

      if (!response?.attempt_id) {
        throw new Error(
          'Could not start the quiz attempt.'
        );
      }

      setAttemptId(response.attempt_id);
      setAnswers({});
      setCurrentQuestion(0);
      setResult(null);
    } catch (err) {
      console.error(
        'Failed to start quiz:',
        err
      );

      setError(
        err?.message ||
          'Unable to start the quiz.'
      );
    } finally {
      setStarting(false);
    }
  };

  // ============================================================
  // SELECT ANSWER
  // ============================================================

  const selectAnswer = (
    questionId,
    answer
  ) => {
    if (result) {
      return;
    }

    setAnswers((current) => ({
      ...current,
      [questionId]: answer,
    }));
  };

  // ============================================================
  // SUBMIT QUIZ
  // ============================================================

  const submitQuiz = async () => {
    if (!attemptId) {
      setError(
        'Quiz attempt has not started.'
      );
      return;
    }

    const unanswered =
      questions.filter(
        (question) =>
          !answers[
            question.question_id
          ]
      );

    if (unanswered.length > 0) {
      const confirmed = window.confirm(
        `You have ${unanswered.length} unanswered question${
          unanswered.length === 1
            ? ''
            : 's'
        }. Do you still want to submit?`
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      setSubmitting(true);
      setError('');

      const answerPayload =
        questions.map((question) => ({
          question_id:
            question.question_id,

          selected_answer:
            answers[
              question.question_id
            ] || null,
        }));

      const response = await api.post(
        `/quizzes/attempts/${attemptId}/submit`,
        {
          answers: answerPayload,
        }
      );

      /*
       * IMPORTANT
       *
       * The backend already gives us the score.
       * We keep the questions and student's answers
       * in state so we can show the answer review.
       */

      setResult({
        score: Number(
          response?.score || 0
        ),

        total_marks: Number(
          response?.total_marks ||
            quiz?.total_marks ||
            0
        ),
      });
    } catch (err) {
      console.error(
        'Failed to submit quiz:',
        err
      );

      setError(
        err?.message ||
          'Unable to submit the quiz.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // NAVIGATION
  // ============================================================

  const goNext = () => {
    if (
      currentQuestion <
      questions.length - 1
    ) {
      setCurrentQuestion(
        (current) => current + 1
      );
    }
  };

  const goPrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(
        (current) => current - 1
      );
    }
  };

  // ============================================================
  // COUNTERS
  // ============================================================

  const answeredCount =
    questions.filter(
      (question) =>
        Boolean(
          answers[
            question.question_id
          ]
        )
    ).length;

  const percentage =
    result &&
    Number(result.total_marks) > 0
      ? Math.round(
          (Number(result.score) /
            Number(result.total_marks)) *
            100
        )
      : 0;

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex">

        <StudentSidebar />

        <main className="flex-1 flex items-center justify-center">

          <div className="flex items-center gap-3 text-slate-500">

            <Loader2 className="w-5 h-5 animate-spin" />

            <span className="text-sm font-semibold">
              Loading quiz...
            </span>

          </div>

        </main>

      </div>
    );
  }

  // ============================================================
  // QUIZ NOT FOUND
  // ============================================================

  if (!quiz) {
    return (
      <div className="min-h-screen bg-slate-50 flex">

        <StudentSidebar />

        <main className="flex-1 flex items-center justify-center p-8">

          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center max-w-md w-full">

            <AlertCircle className="w-10 h-10 mx-auto text-red-500" />

            <h1 className="text-lg font-bold text-slate-900 mt-4">
              Quiz not found
            </h1>

            <p className="text-sm text-slate-500 mt-2">
              {error ||
                'This quiz could not be loaded.'}
            </p>

            <Link
              to="/student/quizzes"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Quizzes
            </Link>

          </div>

        </main>

      </div>
    );
  }

  // ============================================================
  // RESULT + ANSWER REVIEW
  // ============================================================

  if (result) {
    return (
      <div className="min-h-screen bg-slate-50 flex">

        <StudentSidebar />

        <main className="flex-1 min-w-0">

          <div className="max-w-5xl mx-auto p-6 lg:p-10">

            {/* RESULT HEADER */}

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">

              <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <p className="text-xs font-bold uppercase tracking-wider text-brand-600 mt-6">
                Quiz Completed
              </p>

              <h1 className="text-2xl font-bold text-slate-900 mt-2">
                {quiz.title}
              </h1>

              {/* SCORE */}

              <div className="mt-8">

                <div className="text-5xl font-extrabold text-brand-600">
                  {result.score}
                </div>

                <div className="text-sm text-slate-400 mt-1">
                  out of {result.total_marks}
                </div>

              </div>

              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-slate-700 text-sm font-bold">

                <Award className="w-4 h-4 text-amber-500" />

                {percentage}% Score

              </div>

              {/* ACTIONS */}

              <div className="flex justify-center gap-3 mt-8">

                <Link
                  to="/student/quizzes"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  My Quizzes
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setAttemptId(null);
                    setAnswers({});
                    setCurrentQuestion(0);
                    setError('');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700"
                >
                  <PlayCircle className="w-4 h-4" />
                  Take Again
                </button>

              </div>

            </div>

            {/* ================================================= */}
            {/* ANSWER REVIEW */}
            {/* ================================================= */}

            <div className="mt-6">

              <div className="flex items-center justify-between mb-4">

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Answer Review
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    Review your answers and see the correct answers.
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs font-semibold">

                  <span className="inline-flex items-center gap-1.5 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    Correct
                  </span>

                  <span className="inline-flex items-center gap-1.5 text-red-600">
                    <XCircle className="w-4 h-4" />
                    Wrong
                  </span>

                </div>

              </div>

              <div className="space-y-5">

                {questions.map(
                  (question, index) => {

                    const selectedAnswer =
                      answers[
                        question.question_id
                      ] || null;

                    const correctAnswer =
                      String(
                        question.correct_answer ||
                          ''
                      ).toUpperCase();

                    const normalizedSelected =
                      String(
                        selectedAnswer || ''
                      ).toUpperCase();

                    const isCorrect =
                      normalizedSelected ===
                        correctAnswer &&
                      correctAnswer !== '';

                    const options = [
                      {
                        key: 'A',
                        value:
                          question.option_a,
                      },
                      {
                        key: 'B',
                        value:
                          question.option_b,
                      },
                      {
                        key: 'C',
                        value:
                          question.option_c,
                      },
                      {
                        key: 'D',
                        value:
                          question.option_d,
                      },
                    ];

                    return (
                      <div
                        key={
                          question.question_id
                        }
                        className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6"
                      >

                        {/* QUESTION HEADER */}

                        <div className="flex items-start justify-between gap-4">

                          <div className="flex items-start gap-3">

                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                isCorrect
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-red-50 text-red-600'
                              }`}
                            >

                              {isCorrect ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : (
                                <XCircle className="w-5 h-5" />
                              )}

                            </div>

                            <div>

                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Question {index + 1}
                              </p>

                              <h3 className="text-base font-bold text-slate-900 mt-1 leading-6">
                                {
                                  question.question_text
                                }
                              </h3>

                            </div>

                          </div>

                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {isCorrect
                              ? 'Correct'
                              : 'Wrong'}
                          </span>

                        </div>

                        {/* OPTIONS */}

                        <div className="space-y-2.5 mt-5">

                          {options.map(
                            (option) => {

                              const isStudentAnswer =
                                normalizedSelected ===
                                option.key;

                              const isCorrectOption =
                                correctAnswer ===
                                option.key;

                              let optionClass =
                                'border-slate-200 bg-white text-slate-700';

                              if (
                                isCorrectOption
                              ) {
                                optionClass =
                                  'border-emerald-300 bg-emerald-50 text-emerald-800';
                              } else if (
                                isStudentAnswer
                              ) {
                                optionClass =
                                  'border-red-300 bg-red-50 text-red-800';
                              }

                              return (
                                <div
                                  key={
                                    option.key
                                  }
                                  className={`rounded-xl border px-4 py-3 ${optionClass}`}
                                >

                                  <div className="flex items-center gap-3">

                                    <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold shrink-0">
                                      {
                                        option.key
                                      }
                                    </span>

                                    <span className="text-sm font-medium flex-1">
                                      {
                                        option.value ||
                                        '—'
                                      }
                                    </span>

                                    {isCorrectOption && (
                                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Correct Answer
                                      </span>
                                    )}

                                    {isStudentAnswer &&
                                      !isCorrectOption && (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700">
                                          <XCircle className="w-4 h-4" />
                                          Your Answer
                                        </span>
                                      )}

                                  </div>

                                </div>
                              );
                            }
                          )}

                        </div>

                        {/* UNANSWERED */}

                        {!selectedAnswer && (
                          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">

                            <p className="text-xs font-bold text-amber-700">
                              You did not answer this question.
                            </p>

                            <p className="text-xs text-amber-600 mt-1">
                              Correct answer:{' '}
                              <span className="font-bold">
                                {correctAnswer}
                              </span>
                            </p>

                          </div>
                        )}

                        {/* ANSWER SUMMARY */}

                        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs">

                          <span className="text-slate-500">
                            Your answer:{' '}
                            <strong
                              className={
                                isCorrect
                                  ? 'text-emerald-600'
                                  : 'text-red-600'
                              }
                            >
                              {selectedAnswer ||
                                'Not answered'}
                            </strong>
                          </span>

                          <span className="text-slate-500">
                            Correct answer:{' '}
                            <strong className="text-emerald-600">
                              {correctAnswer}
                            </strong>
                          </span>

                          <span className="text-slate-500">
                            Marks:{' '}
                            <strong className="text-slate-700">
                              {question.marks ||
                                1}
                            </strong>
                          </span>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            </div>

          </div>

        </main>

      </div>
    );
  }

  // ============================================================
  // START SCREEN
  // ============================================================

  if (!attemptId) {
    return (
      <div className="min-h-screen bg-slate-50 flex">

        <StudentSidebar />

        <main className="flex-1 min-w-0">

          <div className="max-w-3xl mx-auto p-6 lg:p-10">

            <Link
              to="/student/quizzes"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to My Quizzes
            </Link>

            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                <AlertCircle className="w-5 h-5 shrink-0" />

                <span>{error}</span>

              </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">

              <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <HelpCircle className="w-7 h-7" />
              </div>

              <h1 className="text-2xl font-bold text-slate-900 mt-5">
                {quiz.title}
              </h1>

              {quiz.description && (
                <p className="text-sm text-slate-500 mt-3 leading-6">
                  {quiz.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 mt-7">

                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">

                  <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                    Questions
                  </p>

                  <p className="text-xl font-bold text-slate-900 mt-1">
                    {questions.length}
                  </p>

                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">

                  <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                    Total Marks
                  </p>

                  <p className="text-xl font-bold text-slate-900 mt-1">
                    {quiz.total_marks || 0}
                  </p>

                </div>

              </div>

              <div className="mt-7 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-4 text-sm text-brand-800">
                Select the best answer for each question and submit the quiz when you are finished.
              </div>

              {questions.length === 0 ? (
                <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
                  This quiz does not have any questions yet.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startQuiz}
                  disabled={starting}
                  className="mt-7 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50"
                >

                  {starting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      Start Quiz
                    </>
                  )}

                </button>
              )}

            </div>

          </div>

        </main>

      </div>
    );
  }

  // ============================================================
  // NO QUESTIONS SAFETY
  // ============================================================

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex">

        <StudentSidebar />

        <main className="flex-1 flex items-center justify-center p-8">

          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center max-w-md w-full">

            <AlertCircle className="w-10 h-10 mx-auto text-amber-500" />

            <h1 className="text-lg font-bold text-slate-900 mt-4">
              No questions available
            </h1>

            <p className="text-sm text-slate-500 mt-2">
              This quiz does not contain any questions.
            </p>

            <Link
              to="/student/quizzes"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Quizzes
            </Link>

          </div>

        </main>

      </div>
    );
  }

  // ============================================================
  // CURRENT QUESTION
  // ============================================================

  const question =
    questions[currentQuestion];

  if (!question) {
    return null;
  }

  const options = [
    {
      key: 'A',
      value: question.option_a,
    },
    {
      key: 'B',
      value: question.option_b,
    },
    {
      key: 'C',
      value: question.option_c,
    },
    {
      key: 'D',
      value: question.option_d,
    },
  ];

  const selectedAnswer =
    answers[question.question_id];

  // ============================================================
  // QUIZ QUESTION SCREEN
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50 flex">

      <StudentSidebar />

      <main className="flex-1 min-w-0">

        <div className="max-w-5xl mx-auto p-6 lg:p-8">

          {/* HEADER */}

          <div className="flex items-center justify-between gap-4 mb-6">

            <div>

              <Link
                to="/student/quizzes"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                My Quizzes
              </Link>

              <h1 className="text-xl font-bold text-slate-900">
                {quiz.title}
              </h1>

            </div>

            <div className="text-right">

              <p className="text-xs font-semibold text-slate-400">
                Progress
              </p>

              <p className="text-sm font-bold text-slate-800">
                {answeredCount} / {questions.length}
              </p>

            </div>

          </div>

          {/* PROGRESS */}

          <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-6">

            <div
              className="h-full bg-brand-600 transition-all"
              style={{
                width: `${
                  questions.length > 0
                    ? ((currentQuestion + 1) /
                        questions.length) *
                      100
                    : 0
                }%`,
              }}
            />

          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

              <AlertCircle className="w-5 h-5 shrink-0" />

              <span>{error}</span>

            </div>
          )}

          {/* QUESTION CARD */}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8">

            <div className="flex items-center justify-between gap-4 mb-6">

              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-xs font-bold">
                Question {currentQuestion + 1} of{' '}
                {questions.length}
              </span>

              <span className="text-xs font-bold text-slate-400">
                {question.marks || 1}{' '}
                {Number(question.marks || 1) === 1
                  ? 'Mark'
                  : 'Marks'}
              </span>

            </div>

            <h2 className="text-lg lg:text-xl font-bold text-slate-900 leading-7">
              {question.question_text}
            </h2>

            {/* OPTIONS */}

            <div className="space-y-3 mt-7">

              {options.map((option) => {

                const isSelected =
                  selectedAnswer ===
                  option.key;

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() =>
                      selectAnswer(
                        question.question_id,
                        option.key
                      )
                    }
                    className={`w-full text-left rounded-2xl border px-4 py-4 transition ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >

                    <div className="flex items-start gap-3">

                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                          isSelected
                            ? 'bg-brand-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {option.key}
                      </span>

                      <span
                        className={`text-sm leading-6 pt-1 ${
                          isSelected
                            ? 'text-brand-900 font-semibold'
                            : 'text-slate-700'
                        }`}
                      >
                        {option.value || '—'}
                      </span>

                    </div>

                  </button>
                );
              })}

            </div>

            {/* NAVIGATION */}

            <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-slate-100">

              <button
                type="button"
                onClick={goPrevious}
                disabled={
                  currentQuestion === 0
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 disabled:opacity-40"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>

              {currentQuestion <
              questions.length - 1 ? (

                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>

              ) : (

                <button
                  type="button"
                  onClick={submitQuiz}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
                >

                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}

                  {submitting
                    ? 'Submitting...'
                    : 'Submit Quiz'}

                </button>

              )}

            </div>

          </div>

          {/* QUESTION NAVIGATOR */}

          <div className="bg-white rounded-2xl border border-slate-200 p-4 mt-5">

            <p className="text-xs font-bold text-slate-500 mb-3">
              Questions
            </p>

            <div className="flex flex-wrap gap-2">

              {questions.map(
                (item, index) => {

                  const answered =
                    Boolean(
                      answers[
                        item.question_id
                      ]
                    );

                  return (
                    <button
                      key={item.question_id}
                      type="button"
                      onClick={() =>
                        setCurrentQuestion(
                          index
                        )
                      }
                      className={`w-9 h-9 rounded-lg text-xs font-bold ${
                        index ===
                        currentQuestion
                          ? 'bg-brand-600 text-white'
                          : answered
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                }
              )}

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}