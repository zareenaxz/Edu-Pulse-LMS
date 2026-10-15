import React, { useEffect, useMemo, useState } from 'react';
import StudentSidebar from '../components/StudentSidebar';
import {
  Award, Flame, Star, Zap, Trophy, Shield,
  CheckCircle2, Lock, Download, Share2
} from 'lucide-react';
import { api, getUser } from '../api/client';

const badgeIcons = [Star, Zap, Trophy, Shield, Award, Flame];
const badgeStyles = [
  ['text-amber-600', 'bg-amber-50'],
  ['text-blue-600', 'bg-blue-50'],
  ['text-yellow-600', 'bg-yellow-50'],
  ['text-purple-600', 'bg-purple-50'],
  ['text-emerald-600', 'bg-emerald-50'],
  ['text-orange-600', 'bg-orange-50'],
];

export default function StudentBadgesPage() {
  const [activeTab, setActiveTab] = useState('badges');
  const [allBadges, setAllBadges] = useState([]);
  const [myBadges, setMyBadges] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [stats, setStats] = useState({
    points: 0,
    streakDays: 0,
    badgesEarned: 0,
    certificatesEarned: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [analytics, badges, earned, certs] = await Promise.all([
          api.get('/analytics/student'),
          api.get('/badges'),
          api.get('/badges/me'),
          api.get('/certificates/me'),
        ]);

        if (!mounted) return;

        setStats({
          points: Number(analytics?.points || 0),
          streakDays: Number(analytics?.streakDays || 0),
          badgesEarned: Number(analytics?.badgesEarned ?? earned?.count ?? 0),
          certificatesEarned: Number(analytics?.certificatesEarned ?? certs?.count ?? 0),
        });
        setAllBadges(Array.isArray(badges?.badges) ? badges.badges : []);
        setMyBadges(Array.isArray(earned?.badges) ? earned.badges : []);
        setCertificates(Array.isArray(certs?.certificates) ? certs.certificates : []);
      } catch (e) {
        if (mounted) setError(e.message || 'Could not load achievements.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, []);

  const earnedIds = useMemo(
    () => new Set(myBadges.map((b) => Number(b.badge_id))),
    [myBadges]
  );

  const badges = useMemo(() => {
    return allBadges.map((badge, index) => {
      const Icon = badgeIcons[index % badgeIcons.length];
      const [color, bg] = badgeStyles[index % badgeStyles.length];
      const earned = earnedIds.has(Number(badge.badge_id));
      const earnedRecord = myBadges.find((b) => Number(b.badge_id) === Number(badge.badge_id));

      return {
        ...badge,
        Icon,
        color,
        bg,
        earned,
        earnedRecord,
      };
    });
  }, [allBadges, earnedIds, myBadges]);

  const earnedCount = stats.badgesEarned || myBadges.length;
  const level = Math.floor(stats.points / 500) + 1;

  const printCertificate = (cert) => {
    const user = getUser() || {};
    const studentName = user.name || user.full_name || 'EduPulse Student';
    const courseTitle = cert.course_title || 'Course Completion';
    const issuedDate = cert.issued_at
      ? new Date(cert.issued_at).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '—';
    const certificateCode = cert.certificate_code || cert.certificate_id || '—';
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const verifyUrl = `${apiBase}/api/certificates/verify/${encodeURIComponent(
      cert.certificate_code || ''
    )}`;

    const printWindow = window.open('', '_blank', 'width=1200,height=850');
    if (!printWindow) {
      alert('Please allow pop-ups for EduPulse to print your certificate.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Certificate - ${courseTitle.replace(/</g, '&lt;')}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 0;
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      width: 100%;
      min-height: 100%;
      background: #eef2ff;
      font-family: Inter, Arial, Helvetica, sans-serif;
      color: #172554;
    }

    body {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 18mm;
    }

    .certificate {
      width: 100%;
      max-width: 1050px;
      min-height: 680px;
      background: #ffffff;
      position: relative;
      overflow: hidden;
      border: 1px solid #c7d2fe;
      box-shadow: 0 18px 55px rgba(49, 46, 129, 0.18);
      padding: 34px;
    }

    .outer {
      width: 100%;
      height: 100%;
      min-height: 610px;
      border: 7px double #3730a3;
      position: relative;
      padding: 58px 78px 42px;
      text-align: center;
    }

    .corner {
      position: absolute;
      width: 110px;
      height: 110px;
      border-color: #f59e0b;
      border-style: solid;
    }

    .tl { top: 15px; left: 15px; border-width: 5px 0 0 5px; }
    .tr { top: 15px; right: 15px; border-width: 5px 5px 0 0; }
    .bl { bottom: 15px; left: 15px; border-width: 0 0 5px 5px; }
    .br { bottom: 15px; right: 15px; border-width: 0 5px 5px 0; }

    .brand {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #3730a3;
      margin-bottom: 16px;
    }

    .brand span {
      color: #f59e0b;
    }

    .title {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 48px;
      line-height: 1;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #172554;
      margin: 0;
    }

    .subtitle {
      margin-top: 12px;
      font-size: 12px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
    }

    .presented {
      margin-top: 40px;
      font-size: 13px;
      color: #64748b;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .student {
      margin-top: 10px;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 42px;
      font-weight: 700;
      color: #312e81;
      border-bottom: 1px solid #cbd5e1;
      display: inline-block;
      min-width: 420px;
      padding: 0 24px 10px;
    }

    .completion {
      margin-top: 25px;
      font-size: 14px;
      color: #475569;
    }

    .course {
      margin: 10px auto 0;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 29px;
      font-weight: 700;
      color: #0f172a;
      max-width: 800px;
    }

    .meta {
      margin: 34px auto 0;
      display: flex;
      justify-content: center;
      gap: 70px;
      color: #475569;
      font-size: 11px;
    }

    .meta-item strong {
      display: block;
      margin-top: 5px;
      color: #172554;
      font-size: 12px;
    }

    .seal {
      position: absolute;
      right: 45px;
      bottom: 32px;
      width: 78px;
      height: 78px;
      border: 3px solid #f59e0b;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #3730a3;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background: #fffbeb;
    }

    .signature {
      position: absolute;
      left: 70px;
      bottom: 39px;
      text-align: left;
      min-width: 180px;
    }

    .signature-line {
      width: 180px;
      border-top: 1px solid #94a3b8;
      margin-bottom: 7px;
    }

    .signature strong {
      display: block;
      font-size: 10px;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .verify {
      position: absolute;
      right: 145px;
      bottom: 44px;
      max-width: 270px;
      text-align: right;
      font-size: 8px;
      color: #64748b;
      line-height: 1.4;
    }

    .verify strong {
      display: block;
      color: #059669;
      font-size: 9px;
      margin-bottom: 2px;
    }

    @media print {
      html, body {
        width: 297mm;
        height: 210mm;
        background: #fff;
      }

      body {
        padding: 0;
        display: block;
      }

      .certificate {
        width: 297mm;
        height: 210mm;
        max-width: none;
        min-height: 0;
        border: 0;
        box-shadow: none;
        padding: 10mm;
      }

      .outer {
        min-height: 190mm;
        height: 190mm;
      }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="outer">
      <div class="corner tl"></div>
      <div class="corner tr"></div>
      <div class="corner bl"></div>
      <div class="corner br"></div>

      <div class="brand">Edu<span>Pulse</span></div>
      <h1 class="title">Certificate</h1>
      <div class="subtitle">of course completion</div>

      <div class="presented">This certificate is proudly presented to</div>
      <div class="student">${studentName.replace(/</g, '&lt;')}</div>

      <div class="completion">
        for successfully completing the course
      </div>
      <div class="course">${courseTitle.replace(/</g, '&lt;')}</div>

      <div class="meta">
        <div class="meta-item">
          Issued Date
          <strong>${issuedDate}</strong>
        </div>
        <div class="meta-item">
          Certificate ID
          <strong>${certificateCode.replace(/</g, '&lt;')}</strong>
        </div>
        <div class="meta-item">
          Verification
          <strong>Verified Certificate</strong>
        </div>
      </div>

      <div class="signature">
        <div class="signature-line"></div>
        <strong>EduPulse Learning Portal</strong>
      </div>

      <div class="verify">
        <strong>✓ AUTHENTIC CERTIFICATE</strong>
        Verify this certificate using its Certificate ID through the EduPulse verification service.
      </div>

      <div class="seal">EduPulse<br/>Verified</div>
    </div>
  </div>

  <script>
    window.onload = function () {
      setTimeout(function () {
        window.focus();
        window.print();
      }, 350);
    };

    window.onafterprint = function () {
      setTimeout(function () { window.close(); }, 200);
    };
  </script>
</body>
</html>`);
    printWindow.document.close();
  };
  const currentLevelStart = (level - 1) * 500;
  const nextLevelXP = level * 500;
  const levelProgress = Math.min(
    100,
    Math.max(0, ((stats.points - currentLevelStart) / (nextLevelXP - currentLevelStart)) * 100)
  );

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <StudentSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-100">
              Achievements Center
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Achievements & Badges</h1>
            <p className="text-xs text-slate-500">View your earned badges and certificates from your EduPulse account.</p>
          </div>

          <span className="px-3.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            {stats.streakDays} Day Active Streak
          </span>
        </div>

        <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 text-white p-6 lg:p-8 rounded-3xl shadow-xl shadow-brand-500/15 grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/20 text-[10px] font-extrabold uppercase tracking-widest text-brand-100">
                Level {level} Scholar
              </span>
              <span className="text-xs text-brand-200 font-semibold">Real account progress</span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                {stats.points} XP earned
              </h2>
              <p className="text-xs text-brand-100 mt-1">
                {Math.max(0, nextLevelXP - stats.points)} more XP to reach Level {level + 1}.
              </p>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-bold text-brand-100">
                <span>{stats.points} XP</span>
                <span>{nextLevelXP} XP</span>
              </div>
              <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden p-0.5 border border-white/20">
                <div
                  style={{ width: `${levelProgress}%` }}
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-500"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white/10 border border-white/20 p-5 rounded-2xl flex justify-around text-center">
            <div>
              <Shield className="w-6 h-6 mx-auto text-brand-200 mb-1" />
              <div className="text-xl font-black text-white">{earnedCount}</div>
              <span className="text-[10px] font-bold uppercase text-brand-200">Badges Earned</span>
            </div>
            <div className="w-px bg-white/15" />
            <div>
              <Award className="w-6 h-6 mx-auto text-amber-300 mb-1" />
              <div className="text-xl font-black text-white">{stats.certificatesEarned}</div>
              <span className="text-[10px] font-bold uppercase text-brand-200">Certificates</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">
            {error}
          </div>
        )}

        <div className="flex border-b border-slate-200 text-xs font-semibold gap-6">
          <button
            onClick={() => setActiveTab('badges')}
            className={`pb-3 border-b-2 transition flex items-center gap-2 ${activeTab === 'badges' ? 'border-brand-600 text-brand-600 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <Award className="w-4 h-4" /> Achievement Badges ({allBadges.length})
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`pb-3 border-b-2 transition flex items-center gap-2 ${activeTab === 'certificates' ? 'border-brand-600 text-brand-600 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <Award className="w-4 h-4" /> Certificates Vault ({certificates.length})
          </button>
        </div>

        {activeTab === 'badges' && (
          <div>
            {loading ? (
              <div className="p-10 text-center text-sm text-slate-400">Loading your badges...</div>
            ) : badges.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-3xl border border-slate-100 text-sm text-slate-400">
                No badges are available yet.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {badges.map((b) => {
                  const Icon = b.Icon;
                  const earnedDate = b.earnedRecord?.earned_at
                    ? new Date(b.earnedRecord.earned_at).toLocaleDateString()
                    : null;

                  return (
                    <div
                      key={b.badge_id}
                      className={`p-6 rounded-3xl border shadow-xs flex flex-col justify-between space-y-4 transition hover:shadow-md ${
                        b.earned ? 'bg-white border-slate-100' : 'bg-slate-50/70 border-slate-200/80 opacity-80'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className={`w-12 h-12 rounded-2xl ${b.bg} ${b.color} flex items-center justify-center shrink-0 shadow-inner`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-brand-50 text-brand-600">
                            {b.percentage_required}% Required
                          </span>
                        </div>

                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{b.badge_name}</h3>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{b.description || 'Achievement badge'}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                        {b.earned ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Earned {earnedDate || ''}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" /> Not earned yet
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'certificates' && (
          <div className="space-y-4">
            {loading ? (
              <div className="p-10 text-center text-sm text-slate-400">Loading your certificates...</div>
            ) : certificates.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-3xl border border-slate-100 text-sm text-slate-400">
                You have not earned any certificates yet.
              </div>
            ) : (
              certificates.map((cert) => (
                <div key={cert.certificate_id || cert.certificate_code} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                      <Award className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">
                          ID: {cert.certificate_code || cert.certificate_id}
                        </span>
                        <span className="text-emerald-600 text-xs font-bold">Verified Certificate</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{cert.course_title}</h3>
                      <p className="text-xs text-slate-400">
                        Issued {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => printCertificate(cert)}
                      className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Print / Save PDF
                    </button>
                    <a
                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/certificates/verify/${encodeURIComponent(cert.certificate_code || '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Verify
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
