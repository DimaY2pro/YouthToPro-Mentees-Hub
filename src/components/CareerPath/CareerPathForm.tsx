import { useState } from 'react';
import { User } from 'firebase/auth';
import { CareerPathDraft, CPStageData } from '../../lib/firebase';
import { generateCareerRoadmap, generateVisionStatement } from '../../lib/claude';
import StageCard, { STAGE_CONFIGS } from './StageCard';
import AIImprovementBox from '../LOI/AIImprovementBox';

interface Props {
  user: User | null;
  draft: CareerPathDraft;
  onChange: (draft: CareerPathDraft) => void;
  onSave: () => void;
  saving: boolean;
  lastSaved: string;
}

const LOAD_MESSAGES = [
  'Researching career stages…',
  'Building your entry level roadmap…',
  'Adding skills and certifications…',
  'Finding target companies…',
  'Almost done…',
];

const emptyStage = (): CPStageData => ({
  roleTitle: '',
  roleDescription: '',
  milestones: [''],
  skills: [''],
  certifications: [''],
  communities: [''],
  targetCompanies: [''],
});

export default function CareerPathForm({ user, draft, onChange, onSave, saving, lastSaved }: Props) {
  const [generating,    setGenerating]    = useState(false);
  const [loadMsg,       setLoadMsg]       = useState('');
  const [generateError, setGenerateError] = useState('');
  const [successBanner, setSuccessBanner] = useState(false);

  const [visionSuggestion, setVisionSuggestion]  = useState('');
  const [visionLoading,    setVisionLoading]      = useState(false);
  const [showVisionBox,    setShowVisionBox]      = useState(false);

  const set = <K extends keyof CareerPathDraft>(key: K, value: CareerPathDraft[K]) =>
    onChange({ ...draft, [key]: value });

  const setStage = (stageKey: keyof CareerPathDraft['stages'], data: CPStageData) =>
    onChange({ ...draft, stages: { ...draft.stages, [stageKey]: data } });

  const canGenerate = draft.careerTitle.trim() && draft.degreeMajor.trim();

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setGenerateError('');
    setSuccessBanner(false);

    let msgIdx = 0;
    setLoadMsg(LOAD_MESSAGES[0]);
    const interval = setInterval(() => {
      msgIdx = Math.min(msgIdx + 1, LOAD_MESSAGES.length - 1);
      setLoadMsg(LOAD_MESSAGES[msgIdx]);
    }, 1500);

    try {
      const result = await generateCareerRoadmap(
        draft.careerTitle,
        draft.degreeMajor,
        draft.universityGradYear,
      );
      const stageMap: Record<string, keyof CareerPathDraft['stages']> = {
        entry: 'entry', emerging: 'emerging', experienced: 'experienced', leadership: 'leadership',
      };
      const newStages = { ...draft.stages };
      for (const s of result.stages ?? []) {
        const key = stageMap[s.stage];
        if (key) {
          newStages[key] = {
            roleTitle:       s.roleTitle ?? '',
            roleDescription: s.roleDescription ?? '',
            milestones:      s.milestones?.length ? s.milestones : [''],
            skills:          s.skills?.length ? s.skills : [''],
            certifications:  s.certifications?.length ? s.certifications : [''],
            communities:     s.communities?.length ? s.communities : [''],
            targetCompanies: s.targetCompanies?.length ? s.targetCompanies : [''],
          };
        }
      }
      const networkMentors = result.networkSuggestions?.length ? result.networkSuggestions : draft.networkMentors;
      onChange({ ...draft, stages: newStages, networkMentors, aiGenerated: true });
      setSuccessBanner(true);
      setTimeout(() => setSuccessBanner(false), 8000);
    } catch {
      setGenerateError('Could not generate the roadmap. Please check your API key and try again.');
    } finally {
      clearInterval(interval);
      setGenerating(false);
      setLoadMsg('');
    }
  };

  const handleVisionAI = async () => {
    setVisionLoading(true);
    setVisionSuggestion('');
    setShowVisionBox(true);
    try {
      const result = await generateVisionStatement(draft.careerTitle, '', draft.careerVision);
      setVisionSuggestion(result);
    } catch {
      setVisionSuggestion('Could not generate a suggestion. Please try again.');
    } finally {
      setVisionLoading(false);
    }
  };

  // Progress calculation
  const stageKeys = ['entry', 'emerging', 'experienced', 'leadership'] as const;
  const filled = stageKeys.filter((k) => draft.stages[k].roleTitle.trim()).length
    + stageKeys.filter((k) => draft.stages[k].milestones.some(Boolean)).length
    + stageKeys.filter((k) => draft.stages[k].skills.some(Boolean)).length
    + (draft.careerTitle.trim() ? 1 : 0)
    + (draft.careerVision.trim() ? 1 : 0);
  const total = 14;

  return (
    <div className="flex flex-col gap-6">
      {/* Top controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{filled}/{total} required fields complete</span>
          <div className="w-24 bg-slate-100 rounded-full h-1.5">
            <div className="bg-[#7EC5B3] h-1.5 rounded-full transition-all" style={{ width: `${(filled / total) * 100}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{lastSaved}</span>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">{saving ? 'progress_activity' : 'save'}</span>
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
        </div>
      </div>

      {/* Completion banner */}
      {filled >= total && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
          <span className="material-symbols-outlined text-[20px]">celebration</span>
          Your Career Path is complete! Download your roadmap or share it with your mentor.
        </div>
      )}

      {/* Success banner after AI generate */}
      {successBanner && (
        <div className="flex items-center gap-3 p-4 bg-[#7EC5B3]/20 border border-[#7EC5B3] rounded-xl text-[#183B68] text-sm font-medium">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          Your roadmap has been generated! Review each section and edit anything that doesn't fit your goals.
        </div>
      )}

      {generateError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {generateError}
        </div>
      )}

      {/* Personal Info card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
        <h3 className="text-[#183B68] font-bold text-base">Personal Information & Career Vision</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([
            ['Full Name', 'fullName', 'e.g. Jordan Smith'],
            ["Mentor's Name", 'mentorName', 'e.g. Dr. Sarah Williams'],
            ['University & Graduation Year', 'universityGradYear', 'e.g. University of Dubai, 2025'],
            ['Degree & Major', 'degreeMajor', 'e.g. BSc Computer Engineering'],
          ] as [string, keyof CareerPathDraft, string][]).map(([label, key, placeholder]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
              <input
                type="text"
                value={draft[key] as string}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Career Title / Direction *</label>
          <input
            type="text"
            value={draft.careerTitle}
            onChange={(e) => set('careerTitle', e.target.value)}
            placeholder="e.g. Data Analyst, UX Designer, Marketing Manager"
            className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Career Vision Statement *</label>
            {draft.careerTitle && (
              <button
                type="button"
                onClick={handleVisionAI}
                disabled={visionLoading}
                className="flex items-center gap-1 text-xs text-[#7EC5B3] font-medium hover:text-[#6ab5a3] disabled:opacity-50 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                {visionLoading ? 'Writing…' : 'Help Me Write My Vision'}
              </button>
            )}
          </div>
          <textarea
            rows={3}
            value={draft.careerVision}
            onChange={(e) => set('careerVision', e.target.value)}
            placeholder='e.g. "To become a leader in AI solutions that positively impact healthcare in the MENA region."'
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all resize-none"
          />
          {showVisionBox && (
            <AIImprovementBox
              suggestion={visionSuggestion}
              streaming={visionLoading}
              onAccept={() => { set('careerVision', visionSuggestion); setShowVisionBox(false); setVisionSuggestion(''); }}
              onDismiss={() => { setShowVisionBox(false); setVisionSuggestion(''); }}
            />
          )}
        </div>
      </div>

      {/* AI Generate button */}
      <div className="relative">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate || generating}
          title={!canGenerate ? 'Please fill in your Career Title and Degree first.' : ''}
          className="relative w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-base transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          style={{ background: canGenerate ? 'linear-gradient(135deg, #183B68 0%, #1e4d8c 100%)', color: '#F3B557' }}
        >
          {generating ? (
            <>
              <span className="material-symbols-outlined text-[22px] animate-spin">progress_activity</span>
              <span>{loadMsg}</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[22px]">smart_toy</span>
              Generate My Full Roadmap with AI
            </>
          )}
          {/* shimmer */}
          {canGenerate && !generating && (
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          )}
        </button>
      </div>

      {/* Stage cards */}
      <div className="flex flex-col gap-3">
        {STAGE_CONFIGS.map((config, i) => {
          const key = config.key as keyof CareerPathDraft['stages'];
          return (
            <div key={config.key}>
              <StageCard
                config={config}
                data={draft.stages[key]}
                onChange={(data) => setStage(key, data)}
                careerTitle={draft.careerTitle}
                defaultOpen={i === 0}
              />
              {i < STAGE_CONFIGS.length - 1 && (
                <div className="flex justify-center py-1">
                  <span className="material-symbols-outlined text-slate-300 text-[24px]">arrow_downward</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Network & Mentors */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
        <h3 className="text-[#183B68] font-bold text-base">Network & Mentors</h3>
        <p className="text-slate-500 text-sm">List 3–5 people, communities, or mentors you want to connect with.</p>
        <div className="flex flex-col gap-2">
          {draft.networkMentors.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[#7EC5B3] font-bold text-lg leading-none shrink-0">•</span>
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const next = [...draft.networkMentors];
                  next[i] = e.target.value;
                  set('networkMentors', next);
                }}
                placeholder="e.g. Connect with alumni working in data science in Dubai"
                className="flex-1 h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => {
                  if (draft.networkMentors.length <= 1) return;
                  set('networkMentors', draft.networkMentors.filter((_, idx) => idx !== i));
                }}
                disabled={draft.networkMentors.length <= 1}
                className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          ))}
          {draft.networkMentors.length < 5 && (
            <button
              type="button"
              onClick={() => set('networkMentors', [...draft.networkMentors, ''])}
              className="self-start flex items-center gap-1 text-xs text-[#183B68] font-medium hover:text-[#7EC5B3] transition-colors mt-1"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              Add person or community
            </button>
          )}
        </div>
      </div>

      {/* Personal Notes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-3">
        <h3 className="text-[#183B68] font-bold text-base">Personal Notes</h3>
        <textarea
          rows={4}
          value={draft.personalNotes}
          onChange={(e) => set('personalNotes', e.target.value)}
          placeholder="e.g. I want to get my first internship by the end of my third year, and attend at least one industry event per semester."
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all resize-none"
        />
      </div>
    </div>
  );
}
