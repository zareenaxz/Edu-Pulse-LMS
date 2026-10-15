import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Video, Music, FileText, Presentation, FileSpreadsheet, Image as ImageIcon,
  FileArchive, File as FileIcon, UploadCloud, Trash2, Download, HelpCircle, CheckCircle2,
} from 'lucide-react';
import { api, fileUrl } from '../api/client';

const META = {
  video: { label: 'Video', icon: Video, color: 'text-rose-600 bg-rose-50' },
  audio: { label: 'Audio', icon: Music, color: 'text-purple-600 bg-purple-50' },
  pdf: { label: 'PDF', icon: FileText, color: 'text-red-600 bg-red-50' },
  document: { label: 'Document', icon: FileText, color: 'text-blue-600 bg-blue-50' },
  slide: { label: 'Slides', icon: Presentation, color: 'text-orange-600 bg-orange-50' },
  spreadsheet: { label: 'Sheet', icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-50' },
  image: { label: 'Image', icon: ImageIcon, color: 'text-cyan-600 bg-cyan-50' },
  archive: { label: 'Archive', icon: FileArchive, color: 'text-amber-600 bg-amber-50' },
  other: { label: 'File', icon: FileIcon, color: 'text-slate-600 bg-slate-100' },
};

export const prettySize = (bytes) => {
  const n = Number(bytes) || 0;
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
};

function TypeBadge({ type }) {
  const m = META[type] || META.other;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${m.color}`}>
      <Icon className="w-3 h-3" /> {m.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// INSTRUCTOR: upload / list / delete any file type on a lesson
// ---------------------------------------------------------------------------
export function LessonFilesManager({ courseId, lessonId }) {
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const base = `/courses/${courseId}/lessons/${lessonId}/attachments`;

  const load = useCallback(async () => {
    if (!courseId || !lessonId) return;
    try {
      const d = await api.get(base);
      setFiles(d.attachments);
    } catch (e) { setError(e.message); }
  }, [base, courseId, lessonId]);

  useEffect(() => { load(); }, [load]);

  const upload = async (fileList) => {
    if (!fileList || !fileList.length) return;
    setBusy(true);
    setError('');
    try {
      const fd = new FormData();
      Array.from(fileList).forEach((f) => fd.append('files', f));
      await api.upload(base, fd);
      await load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this file?')) return;
    try { await api.del(`${base}/${id}`); await load(); } catch (e) { setError(e.message); }
  };

  if (!courseId || !lessonId) {
    return (
      <div className="bg-amber-50 border border-amber-100 text-amber-700 text-xs rounded-2xl p-4 font-semibold">
        Open this editor with <code>?courseId=…&amp;lessonId=…</code> (from a saved lesson) to upload files.
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Lesson Files</h3>
        <p className="text-[11px] text-slate-400">Video, audio, PDF, Word, slides (PPT), spreadsheets, images, code or ZIP — up to 500 MB each.</p>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}
        className={`block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${drag ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-400 hover:bg-brand-50/30'}`}
      >
        <UploadCloud className="w-9 h-9 text-brand-600 mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-700">{busy ? 'Uploading…' : 'Click to choose files, or drag & drop here'}</p>
        <input type="file" multiple className="hidden" disabled={busy} onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
      </label>

      {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 rounded-xl px-3 py-2">{error}</p>}

      <div className="space-y-2">
        {files.length === 0 && <p className="text-xs text-slate-400">No files uploaded yet.</p>}
        {files.map((f) => (
          <div key={f.attachment_id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <TypeBadge type={f.file_type} />
              <a href={fileUrl(f.file_url)} target="_blank" rel="noreferrer" className="font-semibold text-slate-800 hover:text-brand-600 truncate">{f.original_name}</a>
              <span className="text-[10px] text-slate-400 shrink-0">{prettySize(f.file_size)}</span>
            </div>
            <button type="button" onClick={() => remove(f.attachment_id)} className="p-1 text-slate-400 hover:text-rose-600 rounded-md">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STUDENT: one attached file. Reports "consumed" automatically:
//   video / audio  -> when 90% has been played
//   pdf / image    -> after it has been open for 3 seconds
//   slides, docs, sheets, zip ... (cannot be previewed in a browser) -> when opened / downloaded
// ---------------------------------------------------------------------------
function FileRow({ f, done, onConsume }) {
  const [open, setOpen] = useState(false);
  const url = fileUrl(f.file_url);
  const type = f.file_type;
  const previewable = ['video', 'audio', 'pdf', 'image'].includes(type);
  const key = `file-${f.attachment_id}`;

  // keep the latest callback in a ref so timers are not restarted on every re-render
  const cb = useRef(onConsume);
  cb.current = onConsume;
  const consume = () => { if (cb.current) cb.current(key); };

  useEffect(() => {
    if (!open || done || !['pdf', 'image'].includes(type)) return undefined;
    const t = setTimeout(consume, 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, done, type]);

  const onTime = (e) => {
    const v = e.currentTarget;
    if (v.duration && v.currentTime / v.duration >= 0.9) consume();
  };

  return (
    <div className={`p-3 rounded-xl border text-xs space-y-3 ${done ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {done && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
          <TypeBadge type={type} />
          <span className="font-semibold text-slate-800 truncate">{f.original_name}</span>
          <span className="text-[10px] text-slate-400 shrink-0">{prettySize(f.file_size)}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {previewable && (
            <button type="button" onClick={() => setOpen((o) => !o)} className="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-600 font-bold hover:bg-brand-100">
              {open ? 'Hide' : type === 'video' || type === 'audio' ? 'Play' : 'Preview'}
            </button>
          )}
          <a
            href={url}
            download
            target="_blank"
            rel="noreferrer"
            onClick={() => { if (!previewable) consume(); }}
            className={previewable ? 'p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-white' : 'px-2.5 py-1 rounded-lg bg-brand-50 text-brand-600 font-bold hover:bg-brand-100 inline-flex items-center gap-1'}
          >
            <Download className="w-4 h-4" />{!previewable && 'Open'}
          </a>
        </div>
      </div>
      {open && type === 'video' && <video src={url} controls autoPlay onTimeUpdate={onTime} onEnded={consume} className="w-full rounded-xl bg-black max-h-96" />}
      {open && type === 'audio' && <audio src={url} controls autoPlay onTimeUpdate={onTime} onEnded={consume} className="w-full" />}
      {open && type === 'pdf' && <iframe title={f.original_name} src={url} className="w-full h-96 rounded-xl border border-slate-200 bg-white" />}
      {open && type === 'image' && <img src={url} alt={f.original_name} className="max-h-96 rounded-xl" />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// STUDENT: everything attached to one lesson.
//   onLoaded(attachments) -> tells the player which files exist
//   onConsume(key)        -> a file was watched / viewed / opened
//   consumed (Set)        -> keys already done (shows the green ticks)
// ---------------------------------------------------------------------------
export function LessonFilesViewer({ courseId, lessonId, consumed, onConsume, onLoaded }) {
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState('');

  const loadedCb = useRef(onLoaded);
  loadedCb.current = onLoaded;

  useEffect(() => {
    if (!courseId || !lessonId) return undefined;
    let cancelled = false;
    setLesson(null);
    setError('');
    api.get(`/courses/${courseId}/lessons/${lessonId}`)
      .then((d) => {
        if (cancelled) return;
        setLesson(d.lesson);
        if (loadedCb.current) loadedCb.current(d.lesson.attachments || []);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message);
        if (loadedCb.current) loadedCb.current([]); // do not block the lesson if files cannot be loaded
      });
    return () => { cancelled = true; };
  }, [courseId, lessonId]);

  if (error) return <p className="text-xs text-slate-400">Could not load files: {error}</p>;
  if (!lesson) return <p className="text-xs text-slate-400">Loading lesson files…</p>;

  const { attachments = [], quizzes = [] } = lesson;
  if (!attachments.length && !quizzes.length) return <p className="text-xs text-slate-400">No files attached to this lesson.</p>;

  return (
    <div className="space-y-3">
      {attachments.map((f) => (
        <FileRow key={f.attachment_id} f={f} done={Boolean(consumed && consumed.has(`file-${f.attachment_id}`))} onConsume={onConsume} />
      ))}

      {quizzes.map((q) => (
        <div key={q.quiz_id} className="p-3 bg-brand-50/50 rounded-xl border border-brand-100 flex items-center gap-2.5 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-brand-600 bg-brand-50"><HelpCircle className="w-3 h-3" /> Quiz</span>
          <span className="font-semibold text-slate-800">{q.title}</span>
          <span className="text-[10px] text-slate-400">{q.total_marks} marks</span>
        </div>
      ))}
    </div>
  );
}

export { TypeBadge };