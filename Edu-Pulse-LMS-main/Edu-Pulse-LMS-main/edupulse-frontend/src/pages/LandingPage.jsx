import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  ArrowRight, Play, Code, PenTool, TrendingUp, 
  Cpu, Users, GraduationCap, BookCheck, Shield, 
  Eye, Volume2, Globe, Sparkles, CheckCircle2, 
  Layers, Video, Award, Star, Compass, Smartphone,
  Zap, Lock, HelpCircle, Check
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState(null);

  const categories = [
    { name: "Development & Engineering", count: "350+ Courses", icon: Code, desc: "Full-stack, Cloud Architecture, Rust, and Python Systems." },
    { name: "UI/UX & Product Design", count: "120+ Courses", icon: PenTool, desc: "Design systems, Figma components, and human interface heuristics." },
    { name: "Business & Quantitative Finance", count: "180+ Courses", icon: TrendingUp, desc: "Microeconomics, quantitative trading models, and corporate valuation." },
    { name: "Data Science & Neural Nets", count: "90+ Courses", icon: Cpu, desc: "Deep learning models, computer vision, and vector databases." }
  ];

  const accessibilities = [
    {
      icon: Volume2,
      title: "Screen Reader & ARIA Optimized",
      desc: "Engineered from semantic HTML5 and WAI-ARIA benchmarks, enabling seamless navigation for keyboard-only and screen reader learners."
    },
    {
      icon: Eye,
      title: "High-Contrast & WCAG 2.1 AA Compliant",
      desc: "Designed with calibrated color contrast ratios (exceeding 4.5:1), custom typography zoom scaling, and reduced motion options."
    },
    {
      icon: Globe,
      title: "Multilingual Closed-Captions & Subtitles",
      desc: "AI-generated live transcriptions and human-audited captions available across 18 languages for all studio lecture recordings."
    },
    {
      icon: Smartphone,
      title: "Adaptive Bandwidth & Offline PWA Sync",
      desc: "Dynamic HLS video streams scale from 360p to 4K resolution, paired with progressive caching to study offline in low-bandwidth areas."
    }
  ];

  const coreFeatures = [
    {
      badge: "Real-Time Telemetry",
      title: "Faculty Split-Pane Grading Studio",
      desc: "Instructors can review complex PDF proofs, code repositories, and design links alongside encrypted master keys and live rubric calculators.",
      icon: Layers
    },
    {
      badge: "Gamified Progress",
      title: "Daily Streaks & Verifiable Badges",
      desc: "Students build momentum through continuous learning streaks, milestone XP achievements, and verifiable digital certificates.",
      icon: Award
    },
    {
      badge: "Governance",
      title: "Multi-Role Academic Administration",
      desc: "Built-in roles for Super Admins, faculty instructors, and scholars with granular permission boundaries, audit trails, and student rosters.",
      icon: Shield
    },
    {
      badge: "Interactive Classrooms",
      title: "Rich Lecture Studio & Handouts",
      desc: "Stream crisp video lectures while referencing structured course syllabi, downloadable datasets, and community discussion boards.",
      icon: Video
    }
  ];

  const faqs = [
    {
      q: "Can students audit courses without paying?",
      a: "Yes. Every course on EduPulse supports a Free Audit tier allowing scholars to stream lecture videos, browse module syllabi, and study at zero cost."
    },
    {
      q: "How does the faculty verification procedure operate?",
      a: "Instructor applications are reviewed by our platform administrative committee. Candidates submit verified institutional diplomas, research publications, and proposed syllabi before approval."
    },
    {
      q: "Can I download lecture resources for offline access?",
      a: "All enrolled students can download PDF lecture slides, problem set worksheets, and source code files directly from the course player."
    },
    {
      q: "Are the platform completion certificates verifiable?",
      a: "Every verified certificate features a unique cryptographic identifier and permanent QR code that can be embedded into LinkedIn and digital CVs."
    }
  ];

  const team = [
    { name: "Dr. Sarah Jenkins", role: "CEO & Founder", institution: "Ex-Stanford Faculty", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80" },
    { name: "Marcus Chen", role: "Chief Technology Officer", institution: "Ex-MIT Media Lab", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80" },
    { name: "Elena Rodriguez", role: "Chief Academic Officer", institution: "Cambridge Fellow", img: "https://images.unsplash.com/photo-1580894732488-cb9d363d6f19?w=400&q=80" },
    { name: "David Kim", role: "VP of Product Design", institution: "Rhode Island School of Design", img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80" }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex flex-col justify-between">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-white to-[#F8F9FD] pt-12 pb-24 lg:pt-20 lg:pb-32">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none -z-0" />
        
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          {/* Left Typography Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white text-brand-600 border border-brand-200/80 shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-brand-600 animate-pulse" />
              Next-Generation University LMS Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
              Empower Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-500">
                Learning Journey.
              </span>
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              Master new skills with expert-led courses, engaging modules, and gamified rewards designed to keep you motivated and on track.
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-2">
              <Link 
                to="/register" 
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-brand-600 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-brand-500/25 hover:bg-brand-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Get Started for Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/student/catalog"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-slate-700 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold hover:bg-slate-50 shadow-xs transition"
              >
                <Compass className="w-4 h-4 text-brand-600" /> Explore Catalog
              </Link>
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6 pt-4 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Free audit tier available
              </span>
            </div>
          </div>

          {/* Right Visual Column */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-md lg:max-w-none">
              <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 aspect-[4/3] lg:aspect-[5/4] relative group">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000&q=80"
                  alt="Students collaborating"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Floating Verified Badge */}
              <div className="absolute -bottom-6 -left-4 sm:-left-8 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3.5 z-20">
                <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Data Science Badge</p>
                  <p className="text-[11px] text-slate-400">Earned just 2 hours ago</p>
                </div>
              </div>

              {/* Floating Active Pill */}
              <div className="absolute -top-4 -right-2 sm:-right-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-2 z-20">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold text-slate-800">2.5k+ Studying Now</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accessibility Guarantee Section */}
      <section className="bg-white border-y border-slate-200/80 py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[11px] font-bold text-brand-600 uppercase tracking-widest bg-brand-50 px-3 py-1 rounded-full">
              Inclusivity & Universal Design
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">Academic Access For Every Learner</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              We design every component, player, and problem set with strict universal accessibility standards, guaranteeing barrier-free education worldwide.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {accessibilities.map((acc) => {
              const Icon = acc.icon;
              return (
                <div key={acc.title} className="p-6 rounded-3xl bg-[#F8F9FD] border border-slate-100 space-y-3 hover:border-brand-200 transition">
                  <div className="w-11 h-11 rounded-2xl bg-white text-brand-600 flex items-center justify-center shadow-xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{acc.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{acc.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Platform Features */}
      <section className="max-w-7xl mx-auto px-6 py-20 space-y-12 w-full">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-[11px] font-bold text-brand-600 uppercase tracking-widest bg-brand-50 px-3 py-1 rounded-full">
            Full-Stack LMS Capabilities
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900">Engineered for Students, Faculty, and Institutions</h2>
          <p className="text-xs text-slate-500">
            A cohesive environment combining student progress motivation with faculty assessment workflows.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {coreFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.title} className="p-8 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-3 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
                    {feat.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 pt-2">{feat.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Popular Categories */}
      <section className="bg-slate-50/70 border-y border-slate-200/60 py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest bg-white px-2.5 py-1 rounded-full border border-slate-200">
                Curated Syllabi
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">Explore Popular Categories</h2>
              <p className="text-xs text-slate-500 mt-1">Accelerate your career through faculty-reviewed coursework.</p>
            </div>
            <Link to="/student/catalog" className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">
              Browse All Topics <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.name} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{c.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{c.desc}</p>
                  <div className="text-[11px] font-bold text-brand-600 pt-1">{c.count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Numbers */}
      <section className="max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900">Our Institutional Impact in Numbers</h2>
          <p className="text-xs text-slate-500 mt-1">Empowering independent learners and university departments.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-2">
            <Users className="w-8 h-8 mx-auto text-brand-600 mb-2" />
            <div className="text-4xl font-black text-slate-900">2.5M+</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Students</div>
          </div>
          <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-2">
            <GraduationCap className="w-8 h-8 mx-auto text-brand-600 mb-2" />
            <div className="text-4xl font-black text-slate-900">50k+</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verified Faculty Instructors</div>
          </div>
          <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-2">
            <BookCheck className="w-8 h-8 mx-auto text-brand-600 mb-2" />
            <div className="text-4xl font-black text-slate-900">120k+</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Interactive Courses Published</div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="bg-white border-y border-slate-200/80 py-20 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-500">Everything you need to know about the EduPulse learning experience.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div 
                key={faq.q} 
                className="p-5 rounded-2xl border border-slate-200/80 bg-[#FBFBFE] cursor-pointer"
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
              >
                <div className="flex justify-between items-center text-sm font-bold text-slate-800">
                  <span>{faq.q}</span>
                  <span className="text-brand-600 text-lg leading-none">{activeFaq === index ? '−' : '+'}</span>
                </div>
                {activeFaq === index && (
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed pt-2 border-t border-slate-200">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="max-w-7xl mx-auto px-6 py-20 w-full space-y-10">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900">Meet the Leadership</h2>
          <p className="text-xs text-slate-500">Academics, software engineers, and designers pioneering open educational standards.</p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {team.map((t) => (
            <div key={t.name} className="flex flex-col items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
              <img src={t.img} alt={t.name} className="w-24 h-24 rounded-2xl object-cover shadow-sm mb-4 border border-slate-100" />
              <div className="font-bold text-slate-900 text-sm">{t.name}</div>
              <div className="text-xs text-brand-600 font-semibold">{t.role}</div>
              <span className="text-[10px] text-slate-400 mt-1">{t.institution}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="bg-brand-600 text-white py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl font-black tracking-tight">Join the Education Revolution Today</h2>
          <p className="text-brand-100 text-xs sm:text-sm leading-relaxed">
            Whether you are a student hungry for master-level knowledge or an educator ready to publish, there is a dedicated workspace waiting for you.
          </p>
          <div className="flex flex-wrap justify-center gap-3.5 pt-4">
            <Link to="/register" className="px-6 py-3 bg-white text-brand-600 rounded-xl font-bold shadow-md hover:bg-slate-50 transition text-xs">
              Start Learning for Free
            </Link>
            <Link to="/register" className="px-6 py-3 bg-brand-700 text-white rounded-xl font-bold hover:bg-brand-800 transition text-xs">
              Become an Accredited Instructor
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}