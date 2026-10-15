import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardSidebar from '../components/InstructorSidebar';
import { 
  Search, Filter, ZoomIn, ZoomOut, MessageSquare, 
  FileText, Bold, Italic, List, Link as LinkIcon, Plus, 
  CheckCircle2, ChevronDown, Check, BookOpen, Clock, 
  Lock, Eye, EyeOff, KeyRound, AlertTriangle, ArrowLeft 
} from 'lucide-react';

export default function InstructorAssignmentsPage() {
  const [searchParams] = useSearchParams();

  // All Available Courses for selection
  const courses = [
    { id: 'calc-301', name: 'Advanced Calculus 301: Multivariable Derivatives' },
    { id: 'ui-design-101', name: 'Introduction to UI Design Principles' },
    { id: 'ml-adv-502', name: 'Advanced Machine Learning Algorithms' }
  ];

  const initialCourse = searchParams.get('courseId') || 'calc-301';
  const [selectedCourse, setSelectedCourse] = useState(initialCourse);

  // Assignments repository structured by course
  const courseAssignments = {
    'calc-301': [
      {
        id: 'hw-4',
        title: 'Problem Set 4: Derivatives & Chain Rule',
        dueDate: 'Oct 24, 2026',
        totalPoints: 100,
        submissionsCount: 30,
        gradedCount: 12,
        description: 'Solve problems regarding directional derivatives, tangent plane equations, and second-order partial differentiations.',
        // Teacher-Only Solution (Hidden from students)
        teacherSolution: {
          uploaded: true,
          fileName: 'Calculus301_HW4_MasterKey_Solutions.pdf',
          fileSize: '4.2 MB',
          notes: 'Deduct 5 points if the constant gradient scalar was not factored out in Problem 3. Partial credit of 8/10 permitted on question 2 for valid product rule application.'
        }
      },
      {
        id: 'hw-2',
        title: 'Problem Set 2: Directional Derivatives',
        dueDate: 'Oct 04, 2026',
        totalPoints: 100,
        submissionsCount: 28,
        gradedCount: 28,
        description: 'Unit vectors, dot product directional derivatives, and gradient elevation angles.',
        teacherSolution: {
          uploaded: true,
          fileName: 'Calculus301_HW2_MasterKey.pdf',
          fileSize: '2.8 MB',
          notes: 'Full points if gradient formula is clearly stated.'
        }
      }
    ],
    'ui-design-101': [
      {
        id: 'ui-hw-1',
        title: 'Wireframe Heuristic Evaluation',
        dueDate: 'Oct 28, 2026',
        totalPoints: 50,
        submissionsCount: 42,
        gradedCount: 38,
        description: 'Conduct a 10-point Nielsen Norman heuristic evaluation on the chosen mobile checkout workflow.',
        teacherSolution: {
          uploaded: true,
          fileName: 'UI_Heuristic_Master_Rubric_Solutions.pdf',
          fileSize: '1.2 MB',
          notes: 'Look for citations of Jakob Nielsens 10 usability heuristics.'
        }
      }
    ],
    'ml-adv-502': [
      {
        id: 'ml-hw-1',
        title: 'Backpropagation from Scratch in NumPy',
        dueDate: 'Nov 02, 2026',
        totalPoints: 100,
        submissionsCount: 50,
        gradedCount: 50,
        description: 'Implement forward pass, cross-entropy loss, and gradient descent updates without PyTorch or TensorFlow.',
        teacherSolution: {
          uploaded: true,
          fileName: 'ML502_Backprop_Vectorized_Solution.py',
          fileSize: '24 KB',
          notes: 'Vectorized implementation must not contain raw Python loops over batches.'
        }
      }
    ]
  };

  const activeAssignments = courseAssignments[selectedCourse] || courseAssignments['calc-301'];
  const [selectedAsgnId, setSelectedAsgnId] = useState(searchParams.get('asgnId') || activeAssignments[0].id);
  const activeAssignment = activeAssignments.find(a => a.id === selectedAsgnId) || activeAssignments[0];

  // Active sub-view: 'overview' | 'submissions'
  const [viewMode, setViewMode] = useState('submissions');
  const [showSolutionPassword, setShowSolutionPassword] = useState(true);

  // Student Submissions Data
  const [students, setStudents] = useState([
    { id: 1, name: "Alex Johnson", initials: "AJ", time: "Oct 12, 09:45 AM", score: "92", status: "GRADED", bg: "bg-blue-100 text-blue-700" },
    { id: 2, name: "Sarah Chen", initials: "SC", time: "Oct 12, 11:20 AM", score: "", status: "PENDING", bg: "bg-purple-100 text-purple-700" },
    { id: 3, name: "Marcus Rodriguez", initials: "MR", time: "Oct 13, 02:15 PM", score: "", status: "PENDING", late: true, bg: "bg-amber-100 text-amber-700" },
    { id: 4, name: "Emma Lawson", initials: "EL", time: "Oct 12, 04:50 PM", score: "", status: "PENDING", bg: "bg-emerald-100 text-emerald-700" }
  ]);

  const [activeStudentId, setActiveStudentId] = useState(2); // Sarah Chen
  const activeStudent = students.find(s => s.id === activeStudentId) || students[0];

  const [enteredScore, setEnteredScore] = useState('88');
  const [feedbackText, setFeedbackText] = useState('Solid derivation in problems 1 and 2. Remember to simplify the scalar constant on the last question.');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleGradeSubmit = () => {
    setStudents(students.map(s => {
      if (s.id === activeStudentId) {
        return { ...s, score: enteredScore, status: 'GRADED' };
      }
      return s;
    }));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <DashboardSidebar role="instructor" title="EduPulse" />

      <main className="flex-1 p-8 overflow-y-auto space-y-6">
        {/* Step 1: Course & Assignment Selection Ribbon */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  const asgns = courseAssignments[e.target.value];
                  if (asgns && asgns.length > 0) setSelectedAsgnId(asgns[0].id);
                }}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Course Assignment</label>
              <select
                value={selectedAsgnId}
                onChange={(e) => setSelectedAsgnId(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                {activeAssignments.map(a => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                viewMode === 'overview' 
                  ? 'bg-brand-600 text-white shadow-xs' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Assignment Details & Key
            </button>
            <button
              onClick={() => setViewMode('submissions')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                viewMode === 'submissions' 
                  ? 'bg-brand-600 text-white shadow-xs' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Student Submissions ({activeAssignment.submissionsCount})
            </button>
          </div>
        </div>

        {/* VIEW 1: Assignment Details & Teacher-Only Solution */}
        {viewMode === 'overview' && (
          <div className="max-w-4xl space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
              <div>
                <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest bg-brand-50 px-2.5 py-1 rounded">
                  Assignment Overview
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-2">{activeAssignment.title}</h2>
                <p className="text-xs text-slate-500 mt-1">{activeAssignment.description}</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Maximum Points</span>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">{activeAssignment.totalPoints} pts</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Submission Deadline</span>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">{activeAssignment.dueDate}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Evaluated</span>
                  <div className="text-xl font-extrabold text-brand-600 mt-1">
                    {activeAssignment.gradedCount} / {activeAssignment.submissionsCount}
                  </div>
                </div>
              </div>

              {/* TEACHER ONLY MASTER KEY SOLUTION BOX */}
              <div className="p-6 rounded-3xl bg-amber-50/60 border-2 border-amber-200/80 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-950">Faculty Confidential: Official Solution & Grading Key</h4>
                      <p className="text-[10px] text-amber-800">Only visible to instructors of this course. Encrypted and hidden from student portals.</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowSolutionPassword(!showSolutionPassword)}
                    className="text-xs font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1"
                  >
                    {showSolutionPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showSolutionPassword ? 'Hide Key' : 'Reveal Key'}
                  </button>
                </div>

                {showSolutionPassword && (
                  <div className="space-y-3 pt-2">
                    <div className="p-3.5 bg-white rounded-2xl border border-amber-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <KeyRound className="w-4 h-4 text-amber-600" />
                        <span className="font-bold text-slate-800">{activeAssignment.teacherSolution.fileName}</span>
                        <span className="text-[10px] text-slate-400">({activeAssignment.teacherSolution.fileSize})</span>
                      </div>
                      <a href="#" className="font-bold text-brand-600 hover:underline">Download Master Key</a>
                    </div>

                    <div className="p-3.5 bg-white rounded-2xl border border-amber-200 text-xs">
                      <span className="font-bold text-slate-800 block mb-1">Grading Notes & Guidance:</span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{activeAssignment.teacherSolution.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setViewMode('submissions')}
                  className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 shadow-md shadow-brand-500/20"
                >
                  Proceed to Grade Submissions →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Student Submissions Roster & Interactive Grading Screen */}
        {viewMode === 'submissions' && (
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Student List Selection */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 shadow-xs p-4 space-y-3">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-xs font-bold text-slate-900">Student Submissions</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{students.length} Total</span>
              </div>

              <div className="space-y-1.5">
                {students.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => {
                      setActiveStudentId(st.id);
                      if (st.score) setEnteredScore(st.score);
                    }}
                    className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition ${
                      activeStudentId === st.id ? 'bg-brand-50 border border-brand-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${st.bg}`}>
                        {st.initials}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{st.name}</h4>
                        <p className={`text-[10px] ${st.late ? 'text-rose-500 font-semibold' : 'text-slate-400'}`}>
                          {st.time}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                        st.status === 'GRADED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {st.status}
                      </span>
                      <div className="text-xs font-bold text-slate-700 mt-1">
                        {st.score ? `${st.score}/100` : '--/100'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: PDF Viewer Simulator & Grade Console */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
                <div className="px-6 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <FileText className="w-4 h-4 text-brand-600" />
                    {activeStudent.name.replace(' ', '_')}_HW4_Submission.pdf
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <ZoomOut className="w-4 h-4 cursor-pointer hover:text-slate-700" />
                    <span className="text-xs font-bold text-slate-700">100%</span>
                    <ZoomIn className="w-4 h-4 cursor-pointer hover:text-slate-700" />
                  </div>
                </div>

                {/* Mathematical Proof Simulator */}
                <div className="p-8 space-y-5 text-xs text-slate-700 font-sans">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-sm">Problem Set 4: Multivariable Chain Rule</h3>
                    <span className="text-[11px] text-slate-400">Student ID: EP-2026-94</span>
                  </div>

                  <div className="space-y-2">
                    <p className="font-semibold text-slate-800">1. Evaluate the gradient vector for f(x, y) = 3x^2 * y - y^3 at (1, 2):</p>
                    <pre className="p-3 bg-slate-50 rounded-xl font-mono text-[11px] text-slate-600 border border-slate-200/60">
                      fx = d/dx(3x^2 * y - y^3) = 6xy{"\n"}
                      fy = d/dy(3x^2 * y - y^3) = 3x^2 - 3y^2{"\n"}
                      At (1, 2): fx = 6(1)(2) = 12, fy = 3(1) - 3(4) = -9{"\n"}
                      ∇f(1, 2) = ⟨12, -9⟩
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-slate-800">2. Determine directional derivative in direction v = ⟨3, 4⟩:</p>
                      <span className="text-[10px] text-brand-600 font-bold bg-brand-50 px-2 py-0.5 rounded">
                        Unit Vector Check Needed
                      </span>
                    </div>
                    <pre className="p-3 bg-slate-50 rounded-xl font-mono text-[11px] text-slate-600 border border-slate-200/60">
                      ||v|| = sqrt(3^2 + 4^2) = 5{"\n"}
                      u = ⟨3/5, 4/5⟩{"\n"}
                      Du f = ∇f · u = 12(3/5) + (-9)(4/5) = (36 - 36)/5 = 0
                    </pre>
                  </div>
                </div>
              </div>

              {/* Grading Input Console */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 grid md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-3 space-y-1">
                  <span className="text-xs font-bold text-slate-700">Assign Score</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={enteredScore}
                      onChange={(e) => setEnteredScore(e.target.value)}
                      className="w-20 px-3 py-2 text-center text-lg font-extrabold rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                    <span className="text-sm font-bold text-slate-400">/ 100</span>
                  </div>
                </div>

                <div className="md:col-span-6 space-y-1">
                  <span className="text-xs font-bold text-slate-700">Instructor Feedback for {activeStudent.name}</span>
                  <textarea
                    rows="2"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="md:col-span-3 space-y-2">
                  <button
                    onClick={handleGradeSubmit}
                    className="w-full py-3 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition shadow-md shadow-brand-500/20 flex items-center justify-center gap-1.5"
                  >
                    {savedSuccess ? <Check className="w-4 h-4" /> : null}
                    {savedSuccess ? 'Grade Recorded' : 'Submit Grade'}
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}