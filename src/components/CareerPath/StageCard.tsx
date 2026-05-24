import { useState } from 'react';
import { CPStageData } from '../../lib/firebase';
import { improveStageField } from '../../lib/claude';
import AIImprovementBox from '../LOI/AIImprovementBox';

interface StageConfig {
  key: string;
  label: string;
  timeframe: string;
  icon: string;
  color: string;
  borderColor: string;
}

interface Props {
  config: StageConfig;
  data: CPStageData;
  onChange: (data: CPStageData) => void;
  careerTitle: string;
  defaultOpen?: boolean;
}

function FlexBulletList({
  bullets,
  onChange,
  maxItems,
  placeholders = [],
}: {
  bullets: string[];
  onChange: (b: string[]) => void;
  maxItems: number;
  placeholders?: string[];
}) {
  const update = (i: number, val: string) => {
    const next = [...bullets];
    next[i] = val;
    onChange(next);
  };
  const add = () => {
    if (bullets.length < maxItems) onChange([...bullets, '']);
  };
  const remove = (i: number) => {
    if (bullets.length <= 1) return;
    onChange(bullets.filter((_, idx) => idx !== i));
  };

  return (
    <div className="flex flex-col gap-2">
      {bullets.map((b, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[#7EC5B3] font-bold text-lg leading-none shrink-0">•</span>
          <input
            type="text"
            value={b}
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholders[i] ?? `Item ${i + 1}…`}
            className="flex-1 h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            disabled={bullets.length <= 1}
            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      ))}
      {bullets.length < maxItems && (
        <button
          type="button"
          onClick={add}
          className="self-start flex items-center gap-1 text-xs text-[#183B68] font-medium hover:text-[#7EC5B3] transition-colors mt-1"
        >
          <span className="material-symbols-outlined text-[16px]">add_circle</span>
          Add item
        </button>
      )}
    </div>
  );
}

function AIField({
  label,
  value,
  onChange,
  stageLabel,
  careerTitle,
  textarea = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  stageLabel: string;
  careerTitle: string;
  textarea?: boolean;
}) {
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBox, setShowBox] = useState(false);

  const improve = async () => {
    if (!value.trim()) return;
    setLoading(true);
    setSuggestion('');
    setShowBox(true);
    try {
      const result = await improveStageField(value, label, stageLabel, careerTitle);
      setSuggestion(result);
    } catch {
      setSuggestion('Could not generate suggestion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
        {value.trim() && (
          <button
            type="button"
            onClick={improve}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-[#7EC5B3] font-medium hover:text-[#6ab5a3] disabled:opacity-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            {loading ? 'Improving…' : 'Improve with AI'}
          </button>
        )}
      </div>
      {textarea ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`What does this ${stageLabel} role involve?`}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`e.g. Junior ${careerTitle || 'Professional'}`}
          className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all"
        />
      )}
      {showBox && (
        <AIImprovementBox
          suggestion={suggestion}
          streaming={loading}
          onAccept={() => { onChange(suggestion); setShowBox(false); setSuggestion(''); }}
          onDismiss={() => { setShowBox(false); setSuggestion(''); }}
        />
      )}
    </div>
  );
}

function BulletFieldWithAI({
  label,
  bullets,
  onChange,
  maxItems,
  placeholders,
  stageLabel,
  careerTitle,
}: {
  label: string;
  bullets: string[];
  onChange: (b: string[]) => void;
  maxItems: number;
  placeholders?: string[];
  stageLabel: string;
  careerTitle: string;
}) {
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBox, setShowBox] = useState(false);

  const improve = async () => {
    const filled = bullets.filter(Boolean).join('\n');
    if (!filled) return;
    setLoading(true);
    setSuggestion('');
    setShowBox(true);
    try {
      const result = await improveStageField(filled, label, stageLabel, careerTitle);
      setSuggestion(result);
    } catch {
      setSuggestion('Could not generate suggestion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const acceptSuggestion = () => {
    const lines = suggestion.split('\n').map((l) => l.replace(/^[\-\•\*]\s*/, '').trim()).filter(Boolean);
    onChange(lines.slice(0, maxItems));
    setShowBox(false);
    setSuggestion('');
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
        {bullets.some(Boolean) && (
          <button
            type="button"
            onClick={improve}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-[#7EC5B3] font-medium hover:text-[#6ab5a3] disabled:opacity-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            {loading ? 'Improving…' : 'Improve with AI'}
          </button>
        )}
      </div>
      <FlexBulletList bullets={bullets} onChange={onChange} maxItems={maxItems} placeholders={placeholders} />
      {showBox && (
        <AIImprovementBox
          suggestion={suggestion}
          streaming={loading}
          onAccept={acceptSuggestion}
          onDismiss={() => { setShowBox(false); setSuggestion(''); }}
        />
      )}
    </div>
  );
}

export default function StageCard({ config, data, onChange, careerTitle, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const set = <K extends keyof CPStageData>(key: K, value: CPStageData[K]) =>
    onChange({ ...data, [key]: value });

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
      style={{ borderLeftColor: config.color, borderLeftWidth: 4 }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${config.color}20` }}>
            <span className="material-symbols-outlined text-[20px]" style={{ color: config.color }}>
              {config.icon}
            </span>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-[#183B68]">{config.label}</p>
            <p className="text-xs text-slate-500">{config.timeframe}</p>
          </div>
          {data.roleTitle && (
            <span className="hidden sm:block text-xs text-slate-400 ml-2">· {data.roleTitle}</span>
          )}
        </div>
        <span className="material-symbols-outlined text-slate-400 text-[20px] transition-transform" style={{ transform: open ? 'rotate(180deg)' : '' }}>
          expand_more
        </span>
      </button>

      {/* Body */}
      {open && (
        <div className="px-5 pb-6 flex flex-col gap-5 border-t border-slate-100">
          <p className="text-xs text-slate-400 pt-3 italic">
            This is your starting point — edit anything that doesn't feel right for you.
          </p>

          <AIField
            label="Job Title at this stage"
            value={data.roleTitle}
            onChange={(v) => set('roleTitle', v)}
            stageLabel={config.label}
            careerTitle={careerTitle}
          />

          <AIField
            label="What does this role involve?"
            value={data.roleDescription}
            onChange={(v) => set('roleDescription', v)}
            stageLabel={config.label}
            careerTitle={careerTitle}
            textarea
          />

          <BulletFieldWithAI
            label="Key milestones and expectations"
            bullets={data.milestones}
            onChange={(b) => set('milestones', b)}
            maxItems={6}
            placeholders={['Learn [core skill] basics', 'Complete [certification name]', 'Work on [type of project]']}
            stageLabel={config.label}
            careerTitle={careerTitle}
          />

          <BulletFieldWithAI
            label="Technical and soft skills to build"
            bullets={data.skills}
            onChange={(b) => set('skills', b)}
            maxItems={8}
            stageLabel={config.label}
            careerTitle={careerTitle}
          />

          <BulletFieldWithAI
            label="Degrees, courses, and certifications"
            bullets={data.certifications}
            onChange={(b) => set('certifications', b)}
            maxItems={6}
            stageLabel={config.label}
            careerTitle={careerTitle}
          />

          <BulletFieldWithAI
            label="Communities and associations to join"
            bullets={data.communities}
            onChange={(b) => set('communities', b)}
            maxItems={5}
            placeholders={['LinkedIn [field] Group', 'ACCA student member']}
            stageLabel={config.label}
            careerTitle={careerTitle}
          />

          <BulletFieldWithAI
            label="Companies you'd like to work for"
            bullets={data.targetCompanies}
            onChange={(b) => set('targetCompanies', b)}
            maxItems={6}
            placeholders={['McKinsey & Company', 'Deloitte', 'du Telecom']}
            stageLabel={config.label}
            careerTitle={careerTitle}
          />
        </div>
      )}
    </div>
  );
}

export const STAGE_CONFIGS: StageConfig[] = [
  { key: 'entry',       label: 'Entry Level',                timeframe: '0–2 years',  icon: 'school',             color: '#7EC5B3', borderColor: '#7EC5B3' },
  { key: 'emerging',    label: 'Emerging Professional',      timeframe: '2–5 years',  icon: 'trending_up',        color: '#F3B557', borderColor: '#F3B557' },
  { key: 'experienced', label: 'Experienced Professional',   timeframe: '5–10 years', icon: 'workspace_premium',  color: '#183B68', borderColor: '#183B68' },
  { key: 'leadership',  label: 'Leadership & Influence',     timeframe: '10+ years',  icon: 'stars',              color: '#C9A227', borderColor: '#C9A227' },
];
