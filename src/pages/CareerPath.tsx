import { useState, useEffect, useCallback, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { UserProfile, CareerPathDraft, saveCareerPathDraft, loadCareerPathDraft } from '../lib/firebase';
import Sidebar from '../components/Sidebar';
import HowItWorks from '../components/CareerPath/HowItWorks';
import CareerExplorer from '../components/CareerPath/CareerExplorer';
import CareerPathForm from '../components/CareerPath/CareerPathForm';
import CareerPathPreview from '../components/CareerPath/CareerPathPreview';
import MentorComments from '../components/CareerPath/MentorComments';

type Tab = 'how' | 'explorer' | 'build' | 'preview' | 'mentor';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'how',      label: 'How It Works',      icon: 'explore' },
  { id: 'explorer', label: 'Career Explorer',   icon: 'lightbulb' },
  { id: 'build',    label: 'Build My Roadmap',  icon: 'map' },
  { id: 'preview',  label: 'Preview & Download',icon: 'picture_as_pdf' },
  { id: 'mentor',   label: 'Mentor Comments',   icon: 'chat' },
];

const emptyDraft = (displayName: string): CareerPathDraft => ({
  fullName: displayName,
  mentorName: '',
  universityGradYear: '',
  degreeMajor: '',
  careerTitle: '',
  careerVision: '',
  stages: {
    entry:       { roleTitle: '', roleDescription: '', milestones: [''], skills: [''], certifications: [''], communities: [''], targetCompanies: [''] },
    emerging:    { roleTitle: '', roleDescription: '', milestones: [''], skills: [''], certifications: [''], communities: [''], targetCompanies: [''] },
    experienced: { roleTitle: '', roleDescription: '', milestones: [''], skills: [''], certifications: [''], communities: [''], targetCompanies: [''] },
    leadership:  { roleTitle: '', roleDescription: '', milestones: [''], skills: [''], certifications: [''], communities: [''], targetCompanies: [''] },
  },
  networkMentors: [''],
  personalNotes: '',
  mentorComments: '',
  mentorFeedbackDate: '',
  reflections: { reflection1: '', reflection2: '', reflection3: '' },
  lastSaved: null,
  aiGenerated: false,
});

interface Props {
  user: User | null;
  profile?: UserProfile | null;
}

export default function CareerPath({ user, profile }: Props) {
  const [tab,        setTab]        = useState<Tab>('how');
  const [draft,      setDraft]      = useState<CareerPathDraft | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [lastSaved,  setLastSaved]  = useState('');
  const [restored,   setRestored]   = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!user) return <Navigate to="/" replace />;

  // Load draft on mount
  useEffect(() => {
    if (!user) return;
    loadCareerPathDraft(user.uid).then((saved) => {
      if (saved) {
        setDraft(saved);
        setRestored(true);
        setLastSaved('Restored from last session');
        setTimeout(() => setRestored(false), 5000);
      } else {
        setDraft(emptyDraft(user.displayName ?? ''));
      }
    }).catch(() => {
      setDraft(emptyDraft(user.displayName ?? ''));
    });
  }, [user.uid]);

  const save = useCallback(async (d: CareerPathDraft) => {
    if (!user || !d) return;
    setSaving(true);
    try {
      await saveCareerPathDraft(user.uid, d);
      const now = new Date();
      setLastSaved(`Last saved: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch {
      setLastSaved('Save failed');
    } finally {
      setSaving(false);
    }
  }, [user]);

  // Auto-save every 45 seconds
  useEffect(() => {
    if (!draft) return;
    autoSaveRef.current = setInterval(() => {
      save(draft);
    }, 45000);
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [draft, save]);

  // Save on tab switch
  const switchTab = (t: Tab) => {
    if (draft) save(draft);
    setTab(t);
  };

  if (!draft) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light">
        <span className="material-symbols-outlined animate-spin text-[32px] text-[#7EC5B3]">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar user={user} profile={profile} />

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#183B68] flex items-center justify-between px-4 z-50">
        <h1 className="text-white font-bold text-sm">Career Path Builder</h1>
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
        <div className="max-w-[1200px] mx-auto p-4 md:p-8 flex flex-col gap-6">
          {/* Page header */}
          <header className="flex flex-col gap-1">
            <h2 className="text-[#183B68] dark:text-white text-2xl md:text-3xl font-black tracking-tight">Career Path Builder</h2>
            <p className="text-slate-500 text-sm max-w-xl">Map your journey from graduation to senior leadership in 4 stages.</p>
          </header>

          {/* Restore banner */}
          {restored && (
            <div className="flex items-center gap-3 p-3 bg-[#7EC5B3]/20 border border-[#7EC5B3] rounded-xl text-[#183B68] text-sm font-medium">
              <span className="material-symbols-outlined text-[18px] text-[#7EC5B3]">check_circle</span>
              Your career path draft has been restored from your last session.
            </div>
          )}

          {/* Tab bar */}
          <div className="flex overflow-x-auto gap-1 bg-white dark:bg-[#15202b] rounded-xl border border-slate-200 dark:border-slate-800 p-1.5 shadow-sm">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  tab === t.id
                    ? 'bg-[#183B68] text-white shadow-sm'
                    : 'text-slate-500 hover:text-[#183B68] hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="pb-10">
            {tab === 'how' && (
              <HowItWorks
                onStartBuilding={() => switchTab('build')}
                onExplorer={() => switchTab('explorer')}
              />
            )}

            {tab === 'explorer' && (
              <CareerExplorer
                onSelectCareer={(title) => {
                  setDraft((d) => d ? { ...d, careerTitle: title } : d);
                  switchTab('build');
                }}
              />
            )}

            {tab === 'build' && (
              <CareerPathForm
                user={user}
                draft={draft}
                onChange={setDraft}
                onSave={() => save(draft)}
                saving={saving}
                lastSaved={lastSaved}
              />
            )}

            {tab === 'preview' && (
              <CareerPathPreview
                draft={draft}
                onEditRoadmap={() => switchTab('build')}
              />
            )}

            {tab === 'mentor' && (
              <MentorComments
                draft={draft}
                onChange={setDraft}
                onSave={() => save(draft)}
                saving={saving}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
