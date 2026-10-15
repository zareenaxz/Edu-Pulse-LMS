import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import InstructorSidebar from '../components/InstructorSidebar';
import { api } from '../api/client';

import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  X,
  HelpCircle,
} from 'lucide-react';

const createEmptyQuestion = () => ({
  id: `${Date.now()}-${Math.random()}`,
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_answer: 'A',
  marks: 1,
});

export default function InstructorCreateQuizPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const courseId = searchParams.get('courseId');

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lessonId, setLessonId] = useState('');

  const [questions, setQuestions] = useState([
    createEmptyQuestion(),
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!courseId) {
      setError('Course ID is missing.');
      setLoading(false);
      return;
    }

    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      setError('');

      const [courseResponse, lessonsResponse] =
        await Promise.all([
          api.get(`/courses/${courseId}`),
          api.get(`/courses/${courseId}/lessons`),
        ]);

      setCourse(courseResponse?.course || null);
      setLessons(lessonsResponse?.lessons || []);
    } catch (err) {
      console.error('Failed to load course:', err);

      setError(
        err?.message ||
          'Unable to load course information.'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateQuestion = (
    questionId,
    field,
    value
  ) => {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              [field]: value,
            }
          : question
      )
    );
  };

  const addQuestion = () => {
    setQuestions((current) => [
      ...current,
      createEmptyQuestion(),
    ]);
  };

  const removeQuestion = (questionId) => {
    setQuestions((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter(
        (question) =>
          question.id !== questionId
      );
    });
  };

  const validateForm = () => {
    if (!title.trim()) {
      return 'Quiz title is required.';
    }

    if (questions.length === 0) {
      return 'Add at least one question.';
    }

    for (
      let index = 0;
      index < questions.length;
      index += 1
    ) {
      const question = questions[index];

      if (!question.question_text.trim()) {
        return `Question ${index + 1}: question text is required.`;
      }

      if (!question.option_a.trim()) {
        return `Question ${index + 1}: Option A is required.`;
      }

      if (!question.option_b.trim()) {
        return `Question ${index + 1}: Option B is required.`;
      }

      if (!question.option_c.trim()) {
        return `Question ${index + 1}: Option C is required.`;
      }

      if (!question.option_d.trim()) {
        return `Question ${index + 1}: Option D is required.`;
      }

      if (
        !['A', 'B', 'C', 'D'].includes(
          question.correct_answer
        )
      ) {
        return `Question ${index + 1}: select the correct answer.`;
      }

      if (
        !Number.isFinite(Number(question.marks)) ||
        Number(question.marks) <= 0
      ) {
        return `Question ${index + 1}: marks must be greater than 0.`;
      }
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        course_id: Number(courseId),

        lesson_id: lessonId
          ? Number(lessonId)
          : null,

        title: title.trim(),

        description:
          description.trim() || null,

        questions: questions.map(
          (question) => ({
            question_text:
              question.question_text.trim(),

            option_a:
              question.option_a.trim(),

            option_b:
              question.option_b.trim(),

            option_c:
              question.option_c.trim(),

            option_d:
              question.option_d.trim(),

            correct_answer:
              question.correct_answer,

            marks: Number(question.marks),
          })
        ),
      };

      const response = await api.post(
        '/quizzes',
        payload
      );

      if (!response?.quiz?.quiz_id) {
        throw new Error(
          'Quiz was not created correctly.'
        );
      }

      setSuccess(
        'Quiz created successfully.'
      );

      setTimeout(() => {
        navigate(
          `/instructor/courses/${courseId}`,
          {
            replace: true,
          }
        );
      }, 800);
    } catch (err) {
      console.error(
        'Failed to create quiz:',
        err
      );

      setError(
        err?.message ||
          'Failed to create quiz. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const totalMarks = questions.reduce(
    (total, question) =>
      total + Number(question.marks || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FD]">
        <InstructorSidebar />

        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
            Loading course...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <InstructorSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">

          {/* HEADER */}

          <div className="flex items-center gap-3 mb-6">
            <Link
              to={`/instructor/courses/${courseId}`}
              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-brand-600" />

                <h1 className="text-2xl font-bold text-slate-900">
                  Create Quiz
                </h1>
              </div>

              <p className="text-xs text-slate-500 mt-1">
                Add a quiz to{' '}
                <span className="font-semibold text-slate-700">
                  {course?.title || 'this course'}
                </span>
              </p>
            </div>
          </div>

          {/* SUCCESS */}

          {success && (
            <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              {success}
            </div>
          )}

          {/* ERROR */}

          {error && (
            <div className="mb-5 flex items-start gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* QUIZ INFORMATION */}

            <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7">

              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Quiz Information
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    Set the basic information for your quiz.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5 mt-5">

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Quiz Title
                  </label>

                  <input
                    type="text"
                    value={title}
                    onChange={(e) =>
                      setTitle(e.target.value)
                    }
                    disabled={saving}
                    placeholder="e.g. JavaScript Fundamentals Quiz"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(e) =>
                      setDescription(
                        e.target.value
                      )
                    }
                    disabled={saving}
                    rows={4}
                    placeholder="Describe what this quiz covers..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none resize-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Attach to Lesson
                    <span className="font-normal text-slate-400">
                      {' '}
                      (optional)
                    </span>
                  </label>

                  <select
                    value={lessonId}
                    onChange={(e) =>
                      setLessonId(
                        e.target.value
                      )
                    }
                    disabled={saving}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-brand-500"
                  >
                    <option value="">
                      Course-level Quiz
                    </option>

                    {lessons.map((lesson) => (
                      <option
                        key={lesson.lesson_id}
                        value={lesson.lesson_id}
                      >
                        {lesson.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[11px] text-slate-400">
                        Questions
                      </p>

                      <p className="text-lg font-bold text-slate-800 mt-0.5">
                        {questions.length}
                      </p>
                    </div>

                    <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[11px] text-slate-400">
                        Total Marks
                      </p>

                      <p className="text-lg font-bold text-slate-800 mt-0.5">
                        {totalMarks}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* QUESTIONS */}

            <section className="space-y-5">

              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Quiz Questions
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    Add multiple-choice questions.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addQuestion}
                  disabled={saving}
                  className="px-4 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-brand-700 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Add Question
                </button>
              </div>

              {questions.map(
                (question, index) => (
                  <div
                    key={question.id}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7"
                  >

                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            Question {index + 1}
                          </h3>

                          <p className="text-[11px] text-slate-400">
                            Multiple Choice
                          </p>
                        </div>
                      </div>

                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeQuestion(
                              question.id
                            )
                          }
                          disabled={saving}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                    </div>

                    <div className="mt-5 space-y-5">

                      {/* QUESTION */}

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Question
                        </label>

                        <textarea
                          value={
                            question.question_text
                          }
                          onChange={(e) =>
                            updateQuestion(
                              question.id,
                              'question_text',
                              e.target.value
                            )
                          }
                          disabled={saving}
                          rows={3}
                          placeholder="Write your question..."
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none resize-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50"
                        />
                      </div>

                      {/* OPTIONS */}

                      <div className="grid md:grid-cols-2 gap-4">

                        {[
                          ['A', 'option_a'],
                          ['B', 'option_b'],
                          ['C', 'option_c'],
                          ['D', 'option_d'],
                        ].map(
                          ([letter, field]) => (
                            <div key={letter}>
                              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Option {letter}
                              </label>

                              <input
                                type="text"
                                value={
                                  question[field]
                                }
                                onChange={(e) =>
                                  updateQuestion(
                                    question.id,
                                    field,
                                    e.target.value
                                  )
                                }
                                disabled={saving}
                                placeholder={`Option ${letter}`}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50"
                              />
                            </div>
                          )
                        )}

                      </div>

                      {/* ANSWER / MARKS */}

                      <div className="grid md:grid-cols-2 gap-4">

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Correct Answer
                          </label>

                          <select
                            value={
                              question.correct_answer
                            }
                            onChange={(e) =>
                              updateQuestion(
                                question.id,
                                'correct_answer',
                                e.target.value
                              )
                            }
                            disabled={saving}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-brand-500"
                          >
                            <option value="A">
                              Option A
                            </option>
                            <option value="B">
                              Option B
                            </option>
                            <option value="C">
                              Option C
                            </option>
                            <option value="D">
                              Option D
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Marks
                          </label>

                          <input
                            type="number"
                            min="1"
                            value={question.marks}
                            onChange={(e) =>
                              updateQuestion(
                                question.id,
                                'marks',
                                e.target.value
                              )
                            }
                            disabled={saving}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500"
                          />
                        </div>

                      </div>

                    </div>
                  </div>
                )
              )}

            </section>

            {/* ACTIONS */}

            <div className="flex justify-end gap-3 pb-8">

              <Link
                to={`/instructor/courses/${courseId}`}
                className="px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-brand-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-brand-700 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Quiz...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Quiz
                  </>
                )}
              </button>

            </div>

          </form>
        </div>
      </main>
    </div>
  );
}