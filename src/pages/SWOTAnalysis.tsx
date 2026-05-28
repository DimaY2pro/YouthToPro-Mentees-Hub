import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { UserProfile, loadMenteeProfile } from '../lib/firebase';
import Sidebar from '../components/Sidebar';
import { generateSwotStructure, SwotQuestion, SwotStructure } from '../lib/claude';
import { downloadSwotPDF, downloadSwotDOCX, SwotResponses } from '../lib/swotExport';

type SwotKey = 'strengths' | 'weaknesses' | 'opportunities' | 'threats';
type Section = 'intro' | SwotKey | 'summary';

const STEPS: Section[] = ['intro', 'strengths', 'weaknesses', 'opportunities', 'threats', 'summary'];
const SWOT_KEYS: SwotKey[] = ['strengths', 'weaknesses', 'opportunities', 'threats'];

const OPEN_QUESTIONS: Record<SwotKey, string[]> = {
  strengths: [
    'If your friends, family, or people who have worked/studied with you were asked about your strengths, what positive things would they probably say about you?',
    'When you look at how you go about your daily life, what habits, attitudes, or behaviours help you succeed or make things easier for you?',
  ],
  weaknesses: [
    'If your friends, family, or people who have worked/studied with you were asked about your weaknesses, what things do you think they would often mention?',
    'When you look at how you go about your daily life, what habits or behaviours sometimes hold you back or create challenges for you?',
  ],
  opportunities: [
    'Looking at where you are now (your studies, skills, or network), what opportunities do you see that could help you grow or move forward in your career?',
    'Are there new skills, experiences, or connections you could start building now that would give you an advantage in the future?',
  ],
  threats: [
    'What challenges or obstacles do you see around you that might slow down your progress?',
    'Are there any external factors that could get in the way of your goals if you don\'t pay attention to them?',
  ],
};

const SECTION_CONFIG: Record<SwotKey, { label: string; icon: string; color: string }> = {
  strengths:     { label: 'Strengths',     icon: 'star',         color: 'bg-[#7EC5B3]' },
  weaknesses:    { label: 'Weaknesses',    icon: 'warning',      color: 'bg-[#F3B557]' },
  opportunities: { label: 'Opportunities', icon: 'lightbulb',    color: 'bg-[#183B68]' },
  threats:       { label: 'Threats',       icon: 'shield_person', color: 'bg-slate-500' },
};

function emptyResponses(): SwotResponses {
  return { strengths: [], weaknesses: [], opportunities: [], threats: [] };
}

function buildAugmented(base: SwotStructure): SwotStructure {
  const result = { ...base };
  (Object.keys(result) as SwotKey[]).forEach((key) => {
    OPEN_QUESTIONS[key].forEach((q) => {
      result[key] = [...result[key], { question: q, sampleAnswer: '' }];
    });
  });
  return result;
}

// ── SWOTSection subcomponent ──────────────────────────────────────────────────

interface SectionProps {
  sectionKey: SwotKey;
  promptItems: SwotQuestion[];
  responses: string[];
  onChange: (idx: number, val: string) => void;
  onNext: () => void;
  onBack: () => void;
  onGoHome: () => void;
  error: string;
}

function SWOTSectionView({ sectionKey, promptItems, responses, onChange, onNext, onBack, onGoHome, error }: SectionProps) {
  const cfg = SECTION_CONFIG[sectionKey];
  const [editedFields, setEditedFields] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const init: Record<number, boolean> = {};
    promptItems.forEach((item, i) => {
      const r = responses[i] || '';
      if (r.trim() && (r !== item.sampleAnswer || !item.sampleAnswer)) init[i] = true;
    });
    setEditedFields(init);
  }, [sectionKey]);

  const handleChange = (idx: number, val: string) => {
    onChange(idx, val);
    setEditedFields((prev) => ({ ...prev, [idx]: true }));
  };

  const handleReset = () => {
    promptItems.forEach((_, i) => onChange(i, ''));
    setEditedFields({});
  };

  const isComplete = promptItems.every((item, i) => {
    const r = responses[i] || '';
    return r.trim() !== '' && editedFields[i] === true;
  });

  const progress = promptItems.filter((_, i) => (responses[i] || '').trim() && editedFields[i]).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Section header */}
      <div className={`flex items-center gap-4 p-5 rounded-xl text-white ${cfg.color}`}>
        <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-[26px]">{cfg.icon}</span>
        </div>
        <div>
          <h3 className="text-xl font-bold">{cfg.label}</h3>
          <p className="text-white/80 text-sm">{progress} / {promptItems.length} answered</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={handleReset} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
            Reset
          </button>
          <button onClick={onGoHome} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
            Home
          </button>
        </div>
      </div>

      {/* Questions */}
      <div className="flex flex-col gap-5">
        {promptItems.map((item, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
            <label className="text-[#183B68] font-semibold text-sm leading-snug">
              <span className="inline-flex items-center justify-center size-6 rounded-full bg-[#183B68] text-white text-xs font-bold mr-2">{idx + 1}</span>
              {item.question}
            </label>
            <textarea
              value={responses[idx] || ''}
              onChange={(e) => handleChange(idx, e.target.value)}
              placeholder={item.sampleAnswer || 'Type your answer here…'}
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all resize-none"
            />
            {(responses[idx] || '').trim() && editedFields[idx] && (
              <div className="flex items-center gap-1.5 text-[#7EC5B3] text-xs font-medium">
                <span className="material-symbols-outlined text-[14px]">check_circle</span> Answered
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

      <div className="flex justify-between pt-2">
        <button onClick={onBack} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back
        </button>
        <button
          onClick={onNext}
          disabled={!isComplete}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors ${
            isComplete ? 'bg-[#183B68] hover:bg-[#0f2744] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Next <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

interface Props {
  user: User | null;
  profile?: UserProfile | null;
}

export default function SWOTAnalysis({ user, profile }: Props) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [section, setSection] = useState<Section>('intro');
  const [menteeName, setMenteeName] = useState('');
  const [careerGoal, setCareerGoal] = useState('');
  const [swotStructure, setSwotStructure] = useState<SwotStructure | null>(null);
  const [responses, setResponses] = useState<SwotResponses>(emptyResponses());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sectionError, setSectionError] = useState('');
  const [exportLoading, setExportLoading] = useState<'pdf' | 'docx' | null>(null);

  useEffect(() => {
    if (!user) return;
    loadMenteeProfile(user.uid).then((p) => {
      if (p) {
        setMenteeName(p.fullName || user.displayName || '');
        setCareerGoal(p.careerGoal || '');
      } else {
        setMenteeName(user.displayName || '');
      }
    }).catch(() => {
      setMenteeName(user.displayName || '');
    });
  }, [user?.uid]);

  if (!user) return <Navigate to="/" replace />;

  const handleStart = async () => {
    if (!menteeName.trim() || !careerGoal.trim()) {
      setError('Please fill in both your name and career goal.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const base = await generateSwotStructure(careerGoal);
      const augmented = buildAugmented(base);
      setSwotStructure(augmented);
      const init = emptyResponses();
      (Object.keys(augmented) as SwotKey[]).forEach((key) => {
        init[key] = augmented[key].map(() => '');
      });
      setResponses(init);
      setSection('strengths');
    } catch {
      setError('Could not generate SWOT questions. Please check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionNext = () => {
    const idx = STEPS.indexOf(section);
    if (section !== 'intro' && SWOT_KEYS.includes(section as SwotKey)) {
      const key = section as SwotKey;
      const items = swotStructure?.[key] ?? [];
      const allAnswered = items.every((_, i) => (responses[key][i] || '').trim() !== '');
      if (!allAnswered) { setSectionError('Please answer all questions before continuing.'); return; }
    }
    setSectionError('');
    if (idx < STEPS.length - 1) setSection(STEPS[idx + 1]);
  };

  const handleSectionBack = () => {
    const idx = STEPS.indexOf(section);
    setSectionError('');
    if (idx > 0) setSection(STEPS[idx - 1]);
  };

  const handleGoHome = () => {
    setSection('intro');
    setSwotStructure(null);
    setResponses(emptyResponses());
    setSectionError('');
    setError('');
  };

  const updateResponse = (key: SwotKey, idx: number, val: string) => {
    setResponses((prev) => {
      const arr = [...(prev[key] || [])];
      arr[idx] = val;
      return { ...prev, [key]: arr };
    });
  };

  const handleDownloadPDF = async () => {
    setExportLoading('pdf');
    try { downloadSwotPDF(menteeName, careerGoal, responses); } finally { setExportLoading(null); }
  };

  const handleDownloadDOCX = async () => {
    setExportLoading('docx');
    try { await downloadSwotDOCX(menteeName, careerGoal, responses); } finally { setExportLoading(null); }
  };

  const stepIndex = STEPS.indexOf(section);
  const progressPct = section === 'intro' ? 0 : section === 'summary' ? 100 : (stepIndex / (STEPS.length - 1)) * 100;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar user={user} profile={profile} />

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#183B68] flex items-center justify-between px-4 z-50">
        <h1 className="text-white font-bold text-sm">SWOT Analysis</h1>
        <button onClick={() => setMobileSidebarOpen(true)} className="text-white/80 hover:text-white">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)}>
          <div className="absolute inset-y-0 left-0 w-64 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <Sidebar user={user} profile={profile} />
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark relative pt-14 md:pt-0">
        <div className="max-w-[860px] mx-auto p-4 md:p-8 flex flex-col gap-6">
          {/* Header */}
          <header className="flex flex-col gap-1">
            <h2 className="text-[#183B68] dark:text-white text-2xl md:text-3xl font-black tracking-tight">SWOT Analysis</h2>
            <p className="text-slate-500 text-sm max-w-xl">Identify your Strengths, Weaknesses, Opportunities, and Threats to build a stronger career plan.</p>
          </header>

          {/* Progress bar */}
          {section !== 'intro' && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-2 bg-[#7EC5B3] rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="text-xs font-medium text-slate-500 shrink-0">{Math.round(progressPct)}%</span>
            </div>
          )}

          {/* Intro screen */}
          {section === 'intro' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8 flex flex-col gap-6 max-w-xl">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-xl bg-[#183B68] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#F3B557] text-[24px]">grid_view</span>
                </div>
                <div>
                  <h3 className="text-[#183B68] font-bold text-lg">Start Your SWOT Analysis</h3>
                  <p className="text-slate-500 text-sm">AI will generate personalised questions for your career goal.</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Your Name</label>
                  <input
                    type="text"
                    value={menteeName}
                    onChange={(e) => setMenteeName(e.target.value)}
                    placeholder="e.g. Jordan Smith"
                    className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Your Career Goal</label>
                  <input
                    type="text"
                    value={careerGoal}
                    onChange={(e) => setCareerGoal(e.target.value)}
                    placeholder="e.g. To build a career in digital marketing in the GCC"
                    className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

              <button
                onClick={handleStart}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3 bg-[#F3B557] hover:bg-yellow-500 text-[#183B68] font-bold rounded-xl transition-colors disabled:opacity-60 shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">{loading ? 'progress_activity' : 'auto_awesome'}</span>
                {loading ? 'Generating your SWOT questions…' : 'Start SWOT Analysis'}
              </button>
            </div>
          )}

          {/* SWOT section screens */}
          {SWOT_KEYS.includes(section as SwotKey) && swotStructure && (
            <SWOTSectionView
              sectionKey={section as SwotKey}
              promptItems={swotStructure[section as SwotKey]}
              responses={responses[section as SwotKey] || []}
              onChange={(idx, val) => updateResponse(section as SwotKey, idx, val)}
              onNext={handleSectionNext}
              onBack={handleSectionBack}
              onGoHome={handleGoHome}
              error={sectionError}
            />
          )}

          {/* Summary screen */}
          {section === 'summary' && (
            <div className="flex flex-col gap-6 pb-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[#183B68] font-bold text-xl">Your SWOT Summary</h3>
                  <p className="text-slate-500 text-sm">{menteeName} · {careerGoal}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={exportLoading !== null}
                    className="flex items-center gap-2 px-4 py-2 bg-[#183B68] hover:bg-[#0f2744] text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                    {exportLoading === 'pdf' ? 'Generating…' : 'Download PDF'}
                  </button>
                  <button
                    onClick={handleDownloadDOCX}
                    disabled={exportLoading !== null}
                    className="flex items-center gap-2 px-4 py-2 bg-[#7EC5B3] hover:bg-teal-400 text-[#183B68] rounded-lg text-sm font-bold transition-colors disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[16px]">description</span>
                    {exportLoading === 'docx' ? 'Generating…' : 'Download DOCX'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {SWOT_KEYS.map((key) => {
                  const cfg = SECTION_CONFIG[key];
                  return (
                    <div key={key} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className={`flex items-center gap-3 px-5 py-3 text-white ${cfg.color}`}>
                        <span className="material-symbols-outlined text-[20px]">{cfg.icon}</span>
                        <h4 className="font-bold">{cfg.label}</h4>
                      </div>
                      <ul className="px-5 py-4 flex flex-col gap-2">
                        {(responses[key] || []).map((ans, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-[#7EC5B3] mt-0.5 shrink-0">•</span>
                            <span>{ans?.trim() || <span className="text-slate-400 italic">No answer</span>}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button onClick={handleSectionBack} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors">
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back
                </button>
                <button onClick={handleGoHome} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#183B68] hover:bg-[#0f2744] text-white font-bold text-sm transition-colors">
                  <span className="material-symbols-outlined text-[16px]">home</span> Start New Analysis
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
