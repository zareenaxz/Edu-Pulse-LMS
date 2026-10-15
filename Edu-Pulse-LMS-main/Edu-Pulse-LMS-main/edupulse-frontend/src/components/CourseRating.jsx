import React, { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { api, getUser } from '../api/client';
import { useApi } from '../api/useApi';

export function Stars({ value = 0, size = 'w-4 h-4' }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${size} ${n <= Math.round(value) ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
      ))}
    </span>
  );
}

// Rating summary + "rate this course" form + review list. Works for any courseId from the database.
export default function CourseRating({ courseId }) {
  const user = getUser();
  const isStudent = user && user.role === 'student';
  const { data, loading, error, reload } = useApi(courseId ? `/courses/${courseId}/reviews` : null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (data && data.myReview) { setRating(data.myReview.rating); setComment(data.myReview.comment || ''); }
  }, [data]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post(`/courses/${courseId}/reviews`, { rating, comment });
      setMsg('Thanks! Your rating was saved.');
      reload();
    } catch (err) { setMsg(err.message); }
  };

  const removeMine = async () => {
    try { await api.del(`/courses/${courseId}/reviews`); setRating(0); setComment(''); setMsg('Your review was removed.'); reload(); }
    catch (err) { setMsg(err.message); }
  };

  if (loading) return <p className="text-xs text-slate-400">Loading ratings…</p>;
  if (error) return <p className="text-xs text-slate-400">Ratings unavailable: {error}</p>;

  const total = data.review_count || 0;
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
      <h3 className="text-sm font-bold text-slate-900">Course Rating & Reviews</h3>

      <div className="grid sm:grid-cols-3 gap-6 items-center">
        <div className="text-center">
          <div className="text-4xl font-extrabold text-slate-900">{data.avg_rating ? data.avg_rating.toFixed(1) : '—'}</div>
          <Stars value={data.avg_rating} size="w-5 h-5" />
          <p className="text-[11px] text-slate-400 mt-1">{total} review{total === 1 ? '' : 's'}</p>
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          {[5, 4, 3, 2, 1].map((n) => (
            <div key={n} className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="w-3">{n}</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400" style={{ width: `${total ? (data.distribution[n] / total) * 100 : 0}%` }} />
              </div>
              <span className="w-6 text-right">{data.distribution[n]}</span>
            </div>
          ))}
        </div>
      </div>

      {isStudent && (
        <form onSubmit={submit} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
          <p className="text-xs font-bold text-slate-800">{data.myReview ? 'Update your rating' : 'Rate this course'}</p>
          <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onMouseEnter={() => setHover(n)} onClick={() => setRating(n)} aria-label={`${n} star`}>
                <Star className={`w-7 h-7 transition ${n <= (hover || rating) ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Share what you liked or what could be better (optional)" className="w-full p-3 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-brand-500" />
          <div className="flex items-center gap-3">
            <button disabled={!rating} className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-brand-700">{data.myReview ? 'Update Review' : 'Submit Review'}</button>
            {data.myReview && <button type="button" onClick={removeMine} className="text-xs font-semibold text-rose-600 flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Remove</button>}
            {msg && <span className="text-xs text-slate-500">{msg}</span>}
          </div>
        </form>
      )}

      <div className="space-y-3">
        {data.reviews.map((r) => (
          <div key={r.review_id} className="p-4 border border-slate-100 rounded-2xl text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">{r.student_name}</span>
              <span className="text-[10px] text-slate-400">{String(r.updated_at || r.created_at).slice(0, 10)}</span>
            </div>
            <Stars value={r.rating} size="w-3.5 h-3.5" />
            {r.comment && <p className="text-slate-600 leading-relaxed">{r.comment}</p>}
          </div>
        ))}
        {!data.reviews.length && <p className="text-xs text-slate-400">No reviews yet.</p>}
      </div>
    </div>
  );
}
