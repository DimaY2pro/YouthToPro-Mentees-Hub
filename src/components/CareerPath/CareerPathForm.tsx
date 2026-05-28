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
  'Researching career stages for your field…',
  'Building your entry level roadmap…',
  'Adding skills and certifications…',
  'Finding target companies…',
  'Almost done…',
];

export default function CareerPathForm({ draft, onChange, onSave, saving, lastSaved }: Props) {
  const [generating,    setGenerating]    = useState(false);
  const [loadMsg,       setLoadMsg]       = useState('');
  const [generateError, setGenerateError] = useState('');

  const [visionSuggestion, setVisionSuggestion] = useState('');
  const [visionLoading,    setVisionLoading]     = useState(false);
  const [showVisionBox,    setShowVisionBox]      = useState(false);

  const set = <K extends keyof CareerPathDraft>(key: K, value: CareerPathDraft[K]) =>
    onChange({ ...draft, [key]: value });

  const setStage = (stageKey: keyof CareerPathDraft['stages'], data: CPStageData) =>
    onChange({ ...draft, stages: { ...draft.stages, [stageKey]: data } });

  const canGenerate = draft.careerTitle.trim() && draft.degreeMajor.trim();
  const roadmapReady = draft.aiGenerated;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setGenerateError('');

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
    } catch (err: any) {
      const msg = err?.message || '';
      setGenerateError(
        msg.includes('key') || msg.includes('auth') || !msg
          ? 'Could not generate the roadmap. Please restart the dev server (Ctrl+C → npm run dev) so the API key is loaded, then try again.'
          : `Could not generate the roadmap: ${msg}`
      );
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

  // ── Phase 1: Career Objectives ────────────────────────────────────────────

  if (!roadmapReady) {
    return (
      <div className="flex flex-col gap-6 max-w-[760px] mx-auto">

        {/* Intro */}
        <div className="flex flex-col gap-2">
          <h3 className="text-[#183B68] font-black text-xl">Tell us your career objectives</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Fill in your career direction and goals below. Our AI will then build a personalised
            4-stage career roadmap for you — which you can edit to match your own experience and expectations.
          </p>
        </div>

        {/* Objectives card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Career Title / Direction <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={draft.careerTitle}
              onChange={(e) => set('careerTitle', e.target.value)}
              placeholder="e.g. Data Analyst, UX Designer, Marketing Manager, Software Engineer"
              className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all"
            />
            <p className="text-xs text-slate-400">Be as specific as possible — this is the foundation of your roadmap.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Degree & Major <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={draft.degreeMajor}
              onChange={(e) => set('degreeMajor', e.target.value)}
              placeholder="e.g. BSc Computer Engineering, BA Business Administration"
              className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Career Vision Statement
              </label>
              {draft.careerTitle && (
                <button
                  type="button"
                  onClick={handleVisionAI}
                  disabled={visionLoading}
                  className="flex items-center gap-1 text-xs text-[#7EC5B3] font-medium hover:text-[#6ab5a3] disabled:opacity-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                  {visionLoading ? 'Writing…' : 'Help Me Write This'}
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={draft.careerVision}
              onChange={(e) => set('careerVision', e.target.value)}
              placeholder='e.g. "To become a leader in data analytics that helps businesses in the MENA region make smarter decisions."'
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

          {/* Optional info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            {([
              ['Full Name', 'fullName', 'e.g. Jordan Smith'],
              ["Mentor's Name", 'mentorName', 'e.g. Dr. Sarah Williams'],
              ['University & Graduation Year', 'universityGradYear', 'e.g. University of Dubai, 2025'],
            ] as [string, keyof CareerPathDraft, string][]).map(([label, key, placeholder]) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
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
        </div>

        {generateError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {generateError}
          </div>
        )}

        {/* Primary CTA */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate || generating}
          title={!canGenerate ? 'Please fill in your Career Title and Degree first.' : ''}
          className="w-full flex items-center justify-center gap-3 py-5 rounded-xl font-bold text-lg transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: canGenerate ? 'linear-gradient(135deg, #183B68 0%, #1e4d8c 100%)' : '#94a3b8', color: '#F3B557' }}
        >
          {generating ? (
            <>
              <span className="material-symbols-outlined text-[24px] animate-spin">progress_activity</span>
              <span className="text-white">{loadMsg}</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[24px]">smart_toy</span>
              Build My Career Path with AI →
            </>
          )}
        </button>

        {!canGenerate && (
          <p className="text-center text-xs text-slate-400">Fill in Career Title and Degree to unlock AI generation.</p>
        )}
      </div>
    );
  }

  // ── Phase 2: Edit the generated roadmap ──────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Top controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="material-symbols-outlined text-[16px] text-[#7EC5B3]">check_circle</span>
          Roadmap generated for <strong className="text-[#183B68]">{draft.careerTitle}</strong>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{lastSaved}</span>
          <button
            type="button"
            onClick={() => onChange({ ...draft, aiGenerated: false })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs font-medium hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">refresh</span>
            Change objectives
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">{saving ? 'progress_activity' : 'save'}</span>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Editing guidance banner */}
      <div className="flex items-start gap-3 p-4 bg-[#F3B557]/10 border border-[#F3B557]/40 rounded-xl">
        <span className="material-symbols-outlined text-[20px] text-[#F3B557] shrink-0 mt-0.5">edit_note</span>
        <div>
          <p className="text-[#183B68] font-semibold text-sm">Your AI-suggested career path is ready</p>
          <p className="text-slate-600 text-sm mt-0.5">
            Each stage below has been tailored to your objectives. Review and edit every section to match
            your own experience, expectations, and goals — this is your roadmap, not a template.
          </p>
        </div>
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
        <p className="text-slate-500 text-sm">People, communities, or mentors to connect with during your career journey.</p>
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
          placeholder="Any other thoughts, goals, or notes for your roadmap…"
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all resize-none"
        />
      </div>
    </div>
  );
}
