import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User } from 'firebase/auth';
import { saveLOIDraft } from '../../lib/firebase';
import { streamImproveField, improveBullets } from '../../lib/claude';
import LOIProgressBar from './LOIProgressBar';
import AIImprovementBox from './AIImprovementBox';
import BulletListBuilder from './BulletListBuilder';

export interface LOIFormData {
  date: string;
  fullName: string;
  program: string;
  university: string;
  cityCountry: string;
  graduationMonth: string;
  graduationYear: string;
  enjoyed: string;
  challenging: string;
  industry: string;
  preferredLocations: string;
  careerGoals: string;
  skills: string;
  challenges: string[];
  expectations: string[];
  availability: string;
  mobile: string;
  whatsapp: string;
  email: string;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const YEARS = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() + i - 1));

const CHALLENGE_PLACEHOLDERS = [
  'I have limited professional network and don\'t know how to approach employers',
  'I am not confident in job interviews',
  'I am unsure which career path is right for me',
  'I find it hard to talk about my skills and experience',
  'I need help understanding how to start my job search',
];
const EXPECTATION_PLACEHOLDERS = [
  'Help me review and improve my CV',
  'Share insights about working in your industry',
  'Prepare me for job interviews',
  'Introduce me to professionals in your network',
  'Guide me on building a professional online presence',
];

const SECTIONS = ['About You', 'Your University Experience', 'Your Career Direction', 'Challenges & Expectations', 'Contact & Availability'];
const SECTION_ICONS = ['person', 'school', 'explore', 'handshake', 'phone'];

function today(): string {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function countCompleted(data: LOIFormData): number {
  const simpleFields: (keyof LOIFormData)[] = [
    'date','fullName','program','university','cityCountry','graduationMonth','graduationYear',
    'enjoyed','challenging','industry','preferredLocations','careerGoals','skills',
    'availability','mobile','whatsapp','email',
  ];
  let count = simpleFields.filter((k) => String(data[k]).trim() !== '').length;
  if (data.challenges.some((c) => c.trim())) count++;
  if (data.expectations.some((e) => e.trim())) count++;
  return count;
}

interface SectionHeaderProps {
  index: number;
  open: boolean;
  completed: boolean;
  onToggle: () => void;
}
function SectionHeader({ index, open, completed, onToggle }: SectionHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-5 py-4 rounded-xl transition-colors ${
        open ? 'bg-[#183B68] text-white' : 'bg-white text-[#183B68] hover:bg-slate-50'
      } border border-slate-200`}
    >
      <div className="flex items-center gap-3">
        <div className={`size-8 rounded-lg flex items-center justify-center ${open ? 'bg-white/20' : 'bg-[#183B68]/10'}`}>
          <span className={`material-symbols-outlined text-[18px] ${open ? 'text-white' : 'text-[#183B68]'}`}>
            {SECTION_ICONS[index]}
          </span>
        </div>
        <span className="font-bold text-sm md:text-base">
          Section {index + 1} — {SECTIONS[index]}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {completed && !open && (
          <span className="material-symbols-outlined text-[#7EC5B3] text-[20px]">check_circle</span>
        )}
        <span className={`material-symbols-outlined text-[20px] transition-transform duration-300 ${open ? 'rotate-180 text-white' : 'text-slate-400'}`}>
          keyboard_arrow_down
        </span>
      </div>
    </button>
  );
}

interface AIButtonProps {
  loading: boolean;
  onClick: () => void;
  label?: string;
}
function AIButton({ loading, onClick, label = 'Improve with AI' }: AIButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#7EC5B3] text-[#7EC5B3] text-xs font-bold hover:bg-[#7EC5B3]/10 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
      ) : (
        <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
      )}
      {loading ? 'Improving…' : label}
    </button>
  );
}

interface Props {
  user: User;
  data: LOIFormData;
  onChange: (data: LOIFormData) => void;
  onPreview: () => void;
  saveStatus: 'idle' | 'saving' | 'saved';
  onSave: () => void;
}

export default function LOIForm({ user, data, onChange, onPreview, saveStatus, onSave }: Props) {
  const [openSection, setOpenSection] = useState(0);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});
  const [aiStreaming, setAiStreaming] = useState<Record<string, boolean>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [bulletAiLoading, setBulletAiLoading] = useState(false);
  const [bulletAiError, setBulletAiError] = useState('');

  const set = useCallback(<K extends keyof LOIFormData>(key: K, val: LOIFormData[K]) => {
    onChange({ ...data, [key]: val });
  }, [data, onChange]);

  const completed = countCompleted(data);

  const isSectionComplete = (idx: number): boolean => {
    if (idx === 0) return !!(data.date && data.fullName && data.program && data.university && data.cityCountry && data.graduationMonth && data.graduationYear);
    if (idx === 1) return !!(data.enjoyed && data.challenging);
    if (idx === 2) return !!(data.industry && data.preferredLocations && data.careerGoals && data.skills);
    if (idx === 3) return data.challenges.some((c) => c.trim()) && data.expectations.some((e) => e.trim());
    if (idx === 4) return !!(data.availability && data.mobile && data.whatsapp && data.email);
    return false;
  };

  const startAI = (field: string, value: string, label: string) => {
    if (!value.trim()) return;
    setAiSuggestions((p) => ({ ...p, [field]: '' }));
    setAiStreaming((p) => ({ ...p, [field]: true }));
    setAiLoading((p) => ({ ...p, [field]: true }));
    streamImproveField(
      value, label,
      (chunk) => setAiSuggestions((p) => ({ ...p, [field]: (p[field] || '') + chunk })),
      () => { setAiStreaming((p) => ({ ...p, [field]: false })); setAiLoading((p) => ({ ...p, [field]: false })); },
      (err) => { setAiSuggestions((p) => ({ ...p, [field]: `Error: ${err}` })); setAiStreaming((p) => ({ ...p, [field]: false })); setAiLoading((p) => ({ ...p, [field]: false })); },
    );
  };

  const acceptAI = (field: keyof LOIFormData) => {
    const val = aiSuggestions[field];
    if (val) set(field, val as any);
    setAiSuggestions((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  const dismissAI = (field: string) => {
    setAiSuggestions((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  const handleImproveBullets = async () => {
    setBulletAiLoading(true);
    setBulletAiError('');
    try {
      const result = await improveBullets(data.challenges.filter(Boolean), data.expectations.filter(Boolean));
      onChange({ ...data, challenges: result.challenges, expectations: result.expectations });
    } catch (e: any) {
      setBulletAiError(e.message || 'AI improvement failed');
    } finally {
      setBulletAiLoading(false);
    }
  };

  const textareaClass = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all resize-none";
  const inputClass = "w-full h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all";
  const labelClass = "text-sm font-semibold text-slate-700";

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <LOIProgressBar completed={completed} total={19} />
        </div>
        <button
          type="button"
          onClick={onSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors shrink-0"
        >
          {saveStatus === 'saving' ? (
            <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
          ) : saveStatus === 'saved' ? (
            <span className="material-symbols-outlined text-[16px] text-[#7EC5B3]">check</span>
          ) : (
            <span className="material-symbols-outlined text-[16px]">save</span>
          )}
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Draft Saved' : 'Save Draft'}
        </button>
      </div>

      {/* Accordion */}
      <div className="flex flex-col gap-3">
        {/* ── Section 1: About You ── */}
        <div>
          <SectionHeader index={0} open={openSection === 0} completed={isSectionComplete(0)} onToggle={() => setOpenSection(openSection === 0 ? -1 : 0)} />
          {openSection === 0 && (
            <div className="mt-2 bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Today's Date</label>
                <input type="text" value={data.date} onChange={(e) => set('date', e.target.value)} className={inputClass} placeholder="e.g. 15 May 2025" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Your Full Name</label>
                <input type="text" value={data.fullName} onChange={(e) => set('fullName', e.target.value)} className={inputClass} placeholder="e.g. Jordan Smith" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Program of Study</label>
                <input type="text" value={data.program} onChange={(e) => set('program', e.target.value)} className={inputClass} placeholder="e.g. Bachelor of Business Administration" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>University Name</label>
                <input type="text" value={data.university} onChange={(e) => set('university', e.target.value)} className={inputClass} placeholder="e.g. University of Dubai" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>City & Country</label>
                <input type="text" value={data.cityCountry} onChange={(e) => set('cityCountry', e.target.value)} className={inputClass} placeholder="e.g. Dubai, UAE" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Expected Graduation</label>
                <div className="flex gap-3">
                  <select value={data.graduationMonth} onChange={(e) => set('graduationMonth', e.target.value)} className={inputClass + ' cursor-pointer'}>
                    <option value="">Month</option>
                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={data.graduationYear} onChange={(e) => set('graduationYear', e.target.value)} className={inputClass + ' cursor-pointer'}>
                    <option value="">Year</option>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="button" onClick={() => setOpenSection(1)} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#183B68] text-white text-sm font-bold hover:bg-[#183B68]/90 transition-colors">
                  Next Section <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Section 2: University Experience ── */}
        <div>
          <SectionHeader index={1} open={openSection === 1} completed={isSectionComplete(1)} onToggle={() => setOpenSection(openSection === 1 ? -1 : 1)} />
          {openSection === 1 && (
            <div className="mt-2 bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>What did you enjoy most at university?</label>
                <textarea rows={4} value={data.enjoyed} onChange={(e) => set('enjoyed', e.target.value)} className={textareaClass} placeholder="e.g. I really enjoyed my marketing courses and the business case competitions..." />
                <div className="flex gap-2 mt-1">
                  <AIButton loading={!!aiLoading['enjoyed']} onClick={() => startAI('enjoyed', data.enjoyed, 'What you enjoyed at university')} />
                </div>
                {aiSuggestions['enjoyed'] !== undefined && (
                  <AIImprovementBox
                    suggestion={aiSuggestions['enjoyed']}
                    streaming={!!aiStreaming['enjoyed']}
                    onAccept={() => acceptAI('enjoyed')}
                    onDismiss={() => dismissAI('enjoyed')}
                  />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>What was challenging or less enjoyable?</label>
                <textarea rows={3} value={data.challenging} onChange={(e) => set('challenging', e.target.value)} className={textareaClass} placeholder="e.g. I found statistics difficult and group projects sometimes felt unorganized..." />
                <div className="flex gap-2 mt-1">
                  <AIButton loading={!!aiLoading['challenging']} onClick={() => startAI('challenging', data.challenging, 'What was challenging or less enjoyable at university')} />
                </div>
                {aiSuggestions['challenging'] !== undefined && (
                  <AIImprovementBox
                    suggestion={aiSuggestions['challenging']}
                    streaming={!!aiStreaming['challenging']}
                    onAccept={() => acceptAI('challenging')}
                    onDismiss={() => dismissAI('challenging')}
                  />
                )}
              </div>
              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setOpenSection(0)} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span> Previous
                </button>
                <button type="button" onClick={() => setOpenSection(2)} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#183B68] text-white text-sm font-bold hover:bg-[#183B68]/90 transition-colors">
                  Next Section <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Section 3: Career Direction ── */}
        <div>
          <SectionHeader index={2} open={openSection === 2} completed={isSectionComplete(2)} onToggle={() => setOpenSection(openSection === 2 ? -1 : 2)} />
          {openSection === 2 && (
            <div className="mt-2 bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Industry / Industries of Interest</label>
                <input type="text" value={data.industry} onChange={(e) => set('industry', e.target.value)} className={inputClass} placeholder="e.g. Finance, Technology, Marketing" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Preferred Work Location(s)</label>
                <input type="text" value={data.preferredLocations} onChange={(e) => set('preferredLocations', e.target.value)} className={inputClass} placeholder="e.g. Dubai, UAE or London, UK" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Career Goals</label>
                <textarea rows={3} value={data.careerGoals} onChange={(e) => set('careerGoals', e.target.value)} className={textareaClass} placeholder="e.g. I want to work as a financial analyst or in investment banking..." />
                <div className="flex gap-2 mt-1">
                  <AIButton loading={!!aiLoading['careerGoals']} onClick={() => startAI('careerGoals', data.careerGoals, 'Career goals')} />
                </div>
                {aiSuggestions['careerGoals'] !== undefined && (
                  <AIImprovementBox
                    suggestion={aiSuggestions['careerGoals']}
                    streaming={!!aiStreaming['careerGoals']}
                    onAccept={() => acceptAI('careerGoals')}
                    onDismiss={() => dismissAI('careerGoals')}
                  />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Your Key Skills & Personality Traits</label>
                <textarea rows={3} value={data.skills} onChange={(e) => set('skills', e.target.value)} className={textareaClass} placeholder="e.g. I am analytical, detail-oriented, and a fast learner..." />
                <div className="flex gap-2 mt-1">
                  <AIButton loading={!!aiLoading['skills']} onClick={() => startAI('skills', data.skills, 'Key skills and personality traits')} />
                </div>
                {aiSuggestions['skills'] !== undefined && (
                  <AIImprovementBox
                    suggestion={aiSuggestions['skills']}
                    streaming={!!aiStreaming['skills']}
                    onAccept={() => acceptAI('skills')}
                    onDismiss={() => dismissAI('skills')}
                  />
                )}
              </div>
              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setOpenSection(1)} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span> Previous
                </button>
                <button type="button" onClick={() => setOpenSection(3)} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#183B68] text-white text-sm font-bold hover:bg-[#183B68]/90 transition-colors">
                  Next Section <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Section 4: Challenges & Expectations ── */}
        <div>
          <SectionHeader index={3} open={openSection === 3} completed={isSectionComplete(3)} onToggle={() => setOpenSection(openSection === 3 ? -1 : 3)} />
          {openSection === 3 && (
            <div className="mt-2 bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-6">
              <BulletListBuilder
                label="What challenges do you need your mentor's help with?"
                bullets={data.challenges}
                placeholders={CHALLENGE_PLACEHOLDERS}
                onChange={(v) => set('challenges', v)}
              />
              <BulletListBuilder
                label="What are you hoping your mentor can help you with?"
                bullets={data.expectations}
                placeholders={EXPECTATION_PLACEHOLDERS}
                onChange={(v) => set('expectations', v)}
              />
              <div className="flex flex-col gap-2">
                <AIButton loading={bulletAiLoading} onClick={handleImproveBullets} label="✨ Improve All with AI" />
                {bulletAiError && <p className="text-red-500 text-xs">{bulletAiError}</p>}
              </div>
              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setOpenSection(2)} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span> Previous
                </button>
                <button type="button" onClick={() => setOpenSection(4)} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#183B68] text-white text-sm font-bold hover:bg-[#183B68]/90 transition-colors">
                  Next Section <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Section 5: Contact & Availability ── */}
        <div>
          <SectionHeader index={4} open={openSection === 4} completed={isSectionComplete(4)} onToggle={() => setOpenSection(openSection === 4 ? -1 : 4)} />
          {openSection === 4 && (
            <div className="mt-2 bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Availability</label>
                <input type="text" value={data.availability} onChange={(e) => set('availability', e.target.value)} className={inputClass} placeholder="e.g. One hour every week on weekday evenings" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Mobile Number</label>
                <input type="text" value={data.mobile} onChange={(e) => set('mobile', e.target.value)} className={inputClass} placeholder="e.g. +971 50 123 4567" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>WhatsApp Number</label>
                <input type="text" value={data.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} className={inputClass} placeholder="Same as mobile / different number" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Email Address</label>
                <input type="email" value={data.email} readOnly className={inputClass + ' bg-slate-50 text-slate-500 cursor-not-allowed'} />
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  This is your registered email.
                </p>
              </div>
              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setOpenSection(3)} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span> Previous
                </button>
                <button type="button" onClick={onPreview} className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#F3B557] hover:bg-yellow-500 text-[#183B68] text-sm font-black transition-colors shadow-md">
                  Preview My Letter <span className="material-symbols-outlined text-[18px]">preview</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
