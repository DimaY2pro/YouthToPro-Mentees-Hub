import { useState, useEffect, useRef, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { saveLOIDraft, loadLOIDraft, UserProfile } from '../lib/firebase';
import Sidebar from '../components/Sidebar';
import WhatIsLOI from '../components/LOI/WhatIsLOI';
import LOISamples from '../components/LOI/LOISamples';
import LOIForm, { LOIFormData } from '../components/LOI/LOIForm';
import LOIPreview from '../components/LOI/LOIPreview';
import type { SampleData } from '../components/LOI/LOISamples';

const TABS = [
  { id: 'what',    icon: 'help',         label: 'What is a Letter of Intent?' },
  { id: 'samples', icon: 'article',       label: 'Sample Templates'            },
  { id: 'write',   icon: 'edit_note',    label: 'Write My Letter'             },
  { id: 'preview', icon: 'preview',      label: 'Preview & Download'          },
];

type TabId = 'what' | 'samples' | 'write' | 'preview';

function defaultFormData(email: string): LOIFormData {
  return {
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    fullName: '',
    program: '',
    university: '',
    cityCountry: '',
    graduationMonth: '',
    graduationYear: '',
    enjoyed: '',
    challenging: '',
    industry: '',
    preferredLocations: '',
    careerGoals: '',
    skills: '',
    challenges: [''],
    expectations: [''],
    availability: '',
    mobile: '',
    whatsapp: '',
    email,
  };
}

interface Props {
  user: User | null;
  profile?: UserProfile | null;
}

export default function LetterOfIntent({ user, profile }: Props) {
  const [activeTab, setActiveTab]           = useState<TabId>('what');
  const [formData, setFormData]             = useState<LOIFormData>(() => defaultFormData(user?.email ?? ''));
  const [polishedVersion, setPolishedVersion] = useState<string | null>(null);
  const [saveStatus, setSaveStatus]         = useState<'idle' | 'saving' | 'saved'>('idle');
  const [draftBanner, setDraftBanner]       = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [draftLoaded, setDraftLoaded]       = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!user) return <Navigate to="/" replace />;

  useEffect(() => {
    loadLOIDraft(user.uid).then((draft) => {
      if (!draft) { setDraftLoaded(true); return; }
      const saved = draft.lastSaved?.toDate?.();
      const dateStr = saved
        ? saved.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'a previous session';
      setFormData({
        date: draft.date || formData.date,
        fullName: draft.fullName || '',
        program: draft.program || '',
        university: draft.university || '',
        cityCountry: draft.cityCountry || '',
        graduationMonth: draft.graduationMonth || '',
        graduationYear: draft.graduationYear || '',
        enjoyed: draft.enjoyed || '',
        challenging: draft.challenging || '',
        industry: draft.industry || '',
        preferredLocations: draft.preferredLocations || '',
        careerGoals: draft.careerGoals || '',
        skills: draft.skills || '',
        challenges: draft.challenges?.length ? draft.challenges : [''],
        expectations: draft.expectations?.length ? draft.expectations : [''],
        availability: draft.availability || '',
        mobile: draft.mobile || '',
        whatsapp: draft.whatsapp || '',
        email: draft.email || user.email || '',
      });
      if (draft.aiPolishedVersion) setPolishedVersion(draft.aiPolishedVersion);
      setDraftBanner(`We found your saved draft from ${dateStr}. Your progress has been restored.`);
      setDraftLoaded(true);
      setActiveTab('write');
    }).catch(() => setDraftLoaded(true));
  }, [user.uid]);

  const doSave = useCallback(async (data: LOIFormData, polished: string | null) => {
    setSaveStatus('saving');
    try {
      await saveLOIDraft(user.uid, { ...data, aiPolishedVersion: polished });
      setSaveStatus('saved');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      setSaveStatus('idle');
    }
  }, [user.uid]);

  useEffect(() => {
    if (!draftLoaded) return;
    const interval = setInterval(() => {
      doSave(formData, polishedVersion);
    }, 30_000);
    return () => clearInterval(interval);
  }, [formData, polishedVersion, draftLoaded, doSave]);

  const handleTabChange = (tab: TabId) => {
    if (draftLoaded && tab !== activeTab) {
      doSave(formData, polishedVersion);
    }
    setActiveTab(tab);
  };

  const handleUseSample = (sample: SampleData) => {
    setFormData({
      ...defaultFormData(user.email ?? ''),
      ...sample,
      email: user.email ?? '',
    });
    setActiveTab('write');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar user={user} profile={profile} />

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#183B68] flex items-center justify-between px-4 z-50">
        <h1 className="text-white font-bold text-sm">Letter of Intent</h1>
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

      <main className="flex-1 overflow-y-auto bg-[#f6f7f8] relative pt-14 md:pt-0">
        <div className="max-w-[1000px] mx-auto p-4 md:p-8 flex flex-col gap-6">
          {/* Header */}
          <header className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-[#183B68] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#F3B557] text-[22px]">description</span>
              </div>
              <div>
                <h2 className="text-[#183B68] text-2xl font-black tracking-tight">Letter of Intent Builder</h2>
                <p className="text-slate-500 text-sm">Write your personal letter to your mentor</p>
              </div>
            </div>
          </header>

          {/* Draft banner */}
          {draftBanner && (
            <div className="flex items-center gap-3 px-4 py-3 bg-[#7EC5B3]/15 border border-[#7EC5B3] rounded-xl text-sm text-[#183B68]">
              <span className="material-symbols-outlined text-[#7EC5B3] text-[18px]">restore</span>
              <span className="flex-1">{draftBanner}</span>
              <button onClick={() => setDraftBanner(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}

          {/* Tab bar */}
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex gap-1 min-w-max bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as TabId)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-[#183B68] text-white shadow-sm'
                      : 'text-slate-500 hover:text-[#183B68] hover:bg-slate-50'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[18px] ${activeTab === tab.id ? 'text-[#F3B557]' : ''}`}>
                    {tab.icon}
                  </span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="pb-10">
            {activeTab === 'what' && (
              <WhatIsLOI onStartWriting={() => setActiveTab('write')} />
            )}
            {activeTab === 'samples' && (
              <LOISamples onUse={handleUseSample} />
            )}
            {activeTab === 'write' && (
              <LOIForm
                user={user}
                data={formData}
                onChange={setFormData}
                onPreview={() => handleTabChange('preview')}
                saveStatus={saveStatus}
                onSave={() => doSave(formData, polishedVersion)}
              />
            )}
            {activeTab === 'preview' && (
              <LOIPreview
                data={formData}
                polishedVersion={polishedVersion}
                onSetPolished={setPolishedVersion}
                onEdit={() => setActiveTab('write')}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
