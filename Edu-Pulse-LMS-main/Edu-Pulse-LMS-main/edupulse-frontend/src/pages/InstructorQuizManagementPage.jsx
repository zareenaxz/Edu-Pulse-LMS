import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  HelpCircle,
  Loader2,
  Trash2,
  Edit3,
  Plus,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Users,
} from 'lucide-react';
import InstructorSidebar from '../components/InstructorSidebar';
import api from '../api/client';

export default function InstructorQuizManagementPage() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');

  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editingQuiz, setEditingQuiz] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    marks: 1,
  });

  const [showAttempts, setShowAttempts] = useState(false);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setError('');
    setTimeout(() => setSuccess(''), 2500);
  };

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      setError('');

      const url = courseId
        ? `/quizzes?course_id=${courseId}`
        : '/quizzes';

      const response = await api.get(url);

      const list =
        response?.quizzes ||
        response?.data ||
        (Array.isArray(response) ? response : []);

      setQuizzes(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Failed to load quizzes.');
    } finally {
      setLoading(false);
    }
  };

  const loadQuizDetails = async (quizId) => {
    try {
      setDetailsLoading(true);
      setError('');

      const [quizResponse, attemptsResponse] = await Promise.all([
        api.get(`/quizzes/${quizId}`),
        api.get(`/quizzes/${quizId}/attempts`).catch(() => ({ attempts: [] })),
      ]);

      const quiz =
        quizResponse?.quiz ||
        quizResponse?.data ||
        quizResponse;

      const qs =
        quizResponse?.questions ||
        quiz?.questions ||
        [];

      const ats =
        attemptsResponse?.attempts ||
        attemptsResponse?.data ||
        [];

      setSelectedQuiz(quiz);
      setQuestions(Array.isArray(qs) ? qs : []);
      setAttempts(Array.isArray(ats) ? ats : []);

      setEditTitle(quiz?.title || '');
      setEditDescription(quiz?.description || '');
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Failed to load quiz details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, [courseId]);

  const handleSelectQuiz = (quiz) => {
    clearMessages();
    setEditingQuiz(false);
    setEditingQuestionId(null);
    setShowAttempts(false);
    loadQuizDetails(quiz.quiz_id);
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Delete this quiz and its questions?')) return;

    try {
      setSaving(true);
      clearMessages();

      await api.delete(`/quizzes/${quizId}`);

      if (selectedQuiz?.quiz_id === quizId) {
        setSelectedQuiz(null);
        setQuestions([]);
        setAttempts([]);
      }

      await loadQuizzes();
      showSuccess('Quiz deleted successfully.');
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Failed to delete quiz.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateQuiz = async () => {
    if (!selectedQuiz) return;

    if (!editTitle.trim()) {
      setError('Quiz title is required.');
      return;
    }

    try {
      setSaving(true);
      clearMessages();

      const response = await api.patch(
        `/quizzes/${selectedQuiz.quiz_id}`,
        {
          title: editTitle.trim(),
          description: editDescription.trim() || null,
        }
      );

      const updated =
        response?.quiz ||
        response?.data ||
        response;

      setSelectedQuiz((prev) => ({
        ...prev,
        ...(updated || {}),
        title: editTitle.trim(),
        description: editDescription.trim(),
      }));

      setEditingQuiz(false);
      await loadQuizzes();
      showSuccess('Quiz updated successfully.');
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Failed to update quiz.');
    } finally {
      setSaving(false);
    }
  };

  const resetQuestionForm = () => {
    setEditingQuestionId(null);
    setQuestionForm({
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      marks: 1,
    });
  };

  const startEditQuestion = (question) => {
    setEditingQuestionId(question.question_id);
    setQuestionForm({
      question_text: question.question_text || '',
      option_a: question.option_a || '',
      option_b: question.option_b || '',
      option_c: question.option_c || '',
      option_d: question.option_d || '',
      correct_answer: question.correct_answer || 'A',
      marks: question.marks || 1,
    });
  };

  const validateQuestion = () => {
    if (!questionForm.question_text.trim()) return 'Question text is required.';
    if (!questionForm.option_a.trim()) return 'Option A is required.';
    if (!questionForm.option_b.trim()) return 'Option B is required.';
    if (!questionForm.option_c.trim()) return 'Option C is required.';
    if (!questionForm.option_d.trim()) return 'Option D is required.';
    if (!['A', 'B', 'C', 'D'].includes(questionForm.correct_answer)) {
      return 'Select a valid correct answer.';
    }
    if (Number(questionForm.marks) <= 0) {
      return 'Marks must be greater than 0.';
    }
    return '';
  };

  const handleSaveQuestion = async () => {
    if (!selectedQuiz) return;

    const validationError = validateQuestion();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      question_text: questionForm.question_text.trim(),
      option_a: questionForm.option_a.trim(),
      option_b: questionForm.option_b.trim(),
      option_c: questionForm.option_c.trim(),
      option_d: questionForm.option_d.trim(),
      correct_answer: questionForm.correct_answer,
      marks: Number(questionForm.marks),
    };

    try {
      setSaving(true);
      clearMessages();

      if (editingQuestionId) {
        await api.patch(
          `/quizzes/questions/${editingQuestionId}`,
          payload
        );
        showSuccess('Question updated successfully.');
      } else {
        await api.post(
          `/quizzes/${selectedQuiz.quiz_id}/questions`,
          payload
        );
        showSuccess('Question added successfully.');
      }

      resetQuestionForm();
      await loadQuizDetails(selectedQuiz.quiz_id);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Failed to save question.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Delete this question?')) return;

    try {
      setSaving(true);
      clearMessages();

      await api.delete(`/quizzes/questions/${questionId}`);

      await loadQuizDetails(selectedQuiz.quiz_id);
      showSuccess('Question deleted successfully.');
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Failed to delete question.');
    } finally {
      setSaving(false);
    }
  };

  const updateQuestionField = (field, value) => {
    setQuestionForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <InstructorSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">

          <div className="flex items-center gap-3 mb-6">
            <Link
              to={
                courseId
                  ? `/instructor/courses/${courseId}`
                  : '/instructor/courses'
              }
              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-brand-600" />
                <h1 className="text-2xl font-bold text-slate-900">
                  Quiz Management
                </h1>
              </div>

              <p className="text-xs text-slate-500 mt-1">
                Create, edit and manage quizzes and questions.
              </p>
            </div>
          </div>

          {success && (
            <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              {success}
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-start gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid lg:grid-cols-[340px_1fr] gap-6">

            <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 h-fit">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-slate-900">Quizzes</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''}
                  </p>
                </div>

                {courseId && (
                  <Link
                    to={`/instructor/quizzes/create?courseId=${courseId}`}
                    className="p-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700"
                    title="Create quiz"
                  >
                    <Plus className="w-4 h-4" />
                  </Link>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                </div>
              ) : quizzes.length === 0 ? (
                <div className="text-center py-10 text-sm text-slate-500">
                  No quizzes found.
                </div>
              ) : (
                <div className="space-y-2">
                  {quizzes.map((quiz) => (
                    <div
                      key={quiz.quiz_id}
                      className={`p-3 rounded-2xl border cursor-pointer transition ${
                        selectedQuiz?.quiz_id === quiz.quiz_id
                          ? 'border-brand-300 bg-brand-50'
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                      onClick={() => handleSelectQuiz(quiz)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm text-slate-800 truncate">
                            {quiz.title}
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {quiz.question_count ?? quiz.questions_count ?? 0} questions
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuiz(quiz.quiz_id);
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-5">
              {!selectedQuiz ? (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm min-h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <HelpCircle className="w-10 h-10 mx-auto text-slate-300" />
                    <h2 className="mt-3 font-bold text-slate-700">
                      Select a quiz
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Choose a quiz from the left to manage it.
                    </p>
                  </div>
                </div>
              ) : detailsLoading ? (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm min-h-[400px] flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {editingQuiz ? (
                          <div className="space-y-3">
                            <input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500"
                              placeholder="Quiz title"
                            />

                            <textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              rows={3}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none resize-none focus:border-brand-500"
                              placeholder="Quiz description"
                            />

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleUpdateQuiz}
                                disabled={saving}
                                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-60"
                              >
                                <Save className="w-4 h-4" />
                                Save
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingQuiz(false)}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
                              >
                                <X className="w-4 h-4 inline mr-1" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <h2 className="text-xl font-bold text-slate-900">
                                {selectedQuiz.title}
                              </h2>

                              <button
                                type="button"
                                onClick={() => setEditingQuiz(true)}
                                className="p-1.5 text-slate-400 hover:text-brand-600"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </div>

                            <p className="text-sm text-slate-500 mt-2">
                              {selectedQuiz.description || 'No description provided.'}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3 mt-5">
                      <div className="bg-slate-50 rounded-2xl p-4">
                        <p className="text-[11px] text-slate-400">Questions</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">
                          {questions.length}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-4">
                        <p className="text-[11px] text-slate-400">Total Marks</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">
                          {questions.reduce(
                            (sum, q) => sum + Number(q.marks || 0),
                            0
                          )}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-4">
                        <p className="text-[11px] text-slate-400">Attempts</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">
                          {attempts.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h2 className="font-bold text-slate-900">
                          Questions
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Add or edit multiple-choice questions.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          resetQuestionForm();
                          setQuestionForm((prev) => ({
                            ...prev,
                            marks: 1,
                          }));
                        }}
                        className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Question
                      </button>
                    </div>

                    {editingQuestionId === null &&
                      questionForm.question_text === '' && (
                        <div className="mb-5 text-xs text-slate-400">
                          Click <b>Add Question</b> to create a new question.
                        </div>
                      )}

                    {(editingQuestionId !== null ||
                      questionForm.question_text !== '') && (
                      <div className="mb-6 p-5 rounded-2xl border border-brand-100 bg-brand-50/40">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-sm text-slate-800">
                            {editingQuestionId
                              ? 'Edit Question'
                              : 'New Question'}
                          </h3>

                          <button
                            type="button"
                            onClick={resetQuestionForm}
                            className="text-slate-400 hover:text-slate-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <textarea
                            value={questionForm.question_text}
                            onChange={(e) =>
                              updateQuestionField(
                                'question_text',
                                e.target.value
                              )
                            }
                            rows={3}
                            placeholder="Question text"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none resize-none focus:border-brand-500"
                          />

                          <div className="grid md:grid-cols-2 gap-3">
                            {['a', 'b', 'c', 'd'].map((letter) => (
                              <input
                                key={letter}
                                value={questionForm[`option_${letter}`]}
                                onChange={(e) =>
                                  updateQuestionField(
                                    `option_${letter}`,
                                    e.target.value
                                  )
                                }
                                placeholder={`Option ${letter.toUpperCase()}`}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500"
                              />
                            ))}
                          </div>

                          <div className="grid md:grid-cols-2 gap-3">
                            <select
                              value={questionForm.correct_answer}
                              onChange={(e) =>
                                updateQuestionField(
                                  'correct_answer',
                                  e.target.value
                                )
                              }
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-brand-500"
                            >
                              <option value="A">Correct Answer: A</option>
                              <option value="B">Correct Answer: B</option>
                              <option value="C">Correct Answer: C</option>
                              <option value="D">Correct Answer: D</option>
                            </select>

                            <input
                              type="number"
                              min="1"
                              value={questionForm.marks}
                              onChange={(e) =>
                                updateQuestionField(
                                  'marks',
                                  e.target.value
                                )
                              }
                              placeholder="Marks"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500"
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={resetQuestionForm}
                              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              onClick={handleSaveQuestion}
                              disabled={saving}
                              className="px-5 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-60"
                            >
                              {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                              {editingQuestionId ? 'Update' : 'Add'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {questions.length === 0 ? (
                        <div className="py-10 text-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                          No questions added yet.
                        </div>
                      ) : (
                        questions.map((question, index) => (
                          <div
                            key={question.question_id}
                            className="border border-slate-100 rounded-2xl p-5"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-800">
                                  {index + 1}. {question.question_text}
                                </p>

                                <div className="grid md:grid-cols-2 gap-2 mt-4">
                                  {[
                                    ['A', question.option_a],
                                    ['B', question.option_b],
                                    ['C', question.option_c],
                                    ['D', question.option_d],
                                  ].map(([letter, value]) => (
                                    <div
                                      key={letter}
                                      className={`px-3 py-2 rounded-xl text-xs border ${
                                        question.correct_answer === letter
                                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold'
                                          : 'border-slate-100 bg-slate-50 text-slate-600'
                                      }`}
                                    >
                                      <b>{letter}.</b> {value}
                                    </div>
                                  ))}
                                </div>

                                <p className="text-[11px] text-slate-400 mt-3">
                                  Marks: {question.marks}
                                </p>
                              </div>

                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => startEditQuestion(question)}
                                  className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteQuestion(
                                      question.question_id
                                    )
                                  }
                                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowAttempts((prev) => !prev)}
                      className="w-full px-6 py-5 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-brand-600" />
                        <div>
                          <h2 className="font-bold text-slate-900">
                            Student Attempts
                          </h2>
                          <p className="text-xs text-slate-500 mt-1">
                            {attempts.length} attempt{attempts.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      {showAttempts ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </button>

                    {showAttempts && (
                      <div className="border-t border-slate-100">
                        {attempts.length === 0 ? (
                          <div className="p-6 text-sm text-slate-400">
                            No student attempts yet.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="text-left px-6 py-3 text-xs text-slate-500">
                                    Student
                                  </th>
                                  <th className="text-left px-6 py-3 text-xs text-slate-500">
                                    Score
                                  </th>
                                  <th className="text-left px-6 py-3 text-xs text-slate-500">
                                    Status
                                  </th>
                                  <th className="text-left px-6 py-3 text-xs text-slate-500">
                                    Date
                                  </th>
                                </tr>
                              </thead>

                              <tbody>
                                {attempts.map((attempt) => (
                                  <tr
                                    key={
                                      attempt.attempt_id ||
                                      attempt.id
                                    }
                                    className="border-t border-slate-100"
                                  >
                                    <td className="px-6 py-4 text-slate-700">
                                      {attempt.student_name ||
                                        attempt.user_name ||
                                        attempt.email ||
                                        `Student #${attempt.user_id || ''}`}
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-slate-800">
                                      {attempt.score ?? 0}
                                      {attempt.total_marks
                                        ? ` / ${attempt.total_marks}`
                                        : ''}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                      {attempt.status || 'Submitted'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                      {attempt.submitted_at
                                        ? new Date(
                                            attempt.submitted_at
                                          ).toLocaleString()
                                        : '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
