import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StudentSidebar from '../components/StudentSidebar';
import { Search, Users, Star, Check } from 'lucide-react';
import { api, fileUrl } from '../api/client';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500&q=80';

export default function StudentCatalogPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [catalog, cats, mine] = await Promise.all([
          api.get('/courses/catalog'),
          api.get('/categories'),
          api.get('/enrollments/me'),
        ]);
        setCourses(catalog.courses);
        setCategories(cats.categories);
        setEnrolledIds(mine.enrollments.map((e) => e.course_id));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleEnroll = async (courseId) => {
    setBusyId(courseId);
    setError('');
    try {
      await api.post('/enrollments', { course_id: courseId });
      setEnrolledIds((prev) => [...prev, courseId]);
      setCourses((prev) =>
        prev.map((c) => (c.course_id === courseId ? { ...c, enrolled_count: Number(c.enrolled_count || 0) + 1 } : c))
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const filtered = courses.filter((c) => {
    const text = `${c.title} ${c.instructor_name || ''} ${c.category_name || ''}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || c.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <StudentSidebar />

      <main className="flex-1 p-8 overflow-y-auto space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Explore Course Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">Discover world-class academic courses verified by university faculties.</p>
        </div>

        {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">{error}</p>}

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search topics, courses, instructors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {['All', ...categories.map((c) => c.category_name)].map((name) => (
              <button
                key={name}
                onClick={() => setSelectedCategory(name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${selectedCategory === name ? 'bg-brand-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="text-xs text-slate-400">Loading courses…</p>}

        <div className="grid md:grid-cols-3 gap-6">
          {filtered.map((course) => {
            const enrolled = enrolledIds.includes(course.course_id);
            return (
              <div key={course.course_id} className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="h-44 relative">
                    <img
                      src={course.thumbnail ? fileUrl(course.thumbnail) : FALLBACK_IMAGE}
                      alt={course.title}
                      onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-4 right-4 bg-white/95 px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-800 flex items-center gap-1 shadow-xs">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      {course.avg_rating ? Number(course.avg_rating).toFixed(1) : 'New'}
                      {course.review_count > 0 && <span className="text-slate-400">({course.review_count})</span>}
                    </span>
                  </div>

                  <div className="p-6 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">{course.category_name} • {course.difficulty}</span>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{course.title}</h3>
                    <p className="text-[11px] text-slate-400">by {course.instructor_name}</p>
                    <div className="text-xs text-slate-400 flex items-center gap-1 pt-1">
                      <Users className="w-3.5 h-3.5" /> {course.enrolled_count || 0} enrolled students
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  {enrolled ? (
                    <Link
                      to={`/student/course/${course.course_id}`}
                      className="w-full py-2.5 bg-emerald-50 text-emerald-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-emerald-100"
                    >
                      <Check className="w-4 h-4" /> Enrolled • Open Course
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course.course_id)}
                      disabled={busyId === course.course_id}
                      className="w-full py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition shadow-sm disabled:opacity-60"
                    >
                      {busyId === course.course_id ? 'Enrolling…' : 'Enroll Now • Free'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!loading && filtered.length === 0 && <p className="text-xs text-slate-400">No courses match your search.</p>}
      </main>
    </div>
  );
}