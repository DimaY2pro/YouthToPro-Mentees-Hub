import { useState } from 'react';
import { CareerPathDraft } from '../../lib/firebase';
import { reviewCareerRoadmap } from '../../lib/claude';
import { generateCareerPathDocx, downloadCareerPathDocx } from '../../lib/careerPathExport';
import { STAGE_CONFIGS } from './StageCard';

interface Props {
  draft: CareerPathDraft;
  onEditRoadmap: () => void;
}

interface ReviewSuggestion {
  section: string;
  icon: string;
  suggestion: string;
}

const STAGE_COLORS: Record<string, string> = {
  entry: '#7EC5B3',
  emerging: '#F3B557',
  experienced: '#183B68',
  leadership: '#C9A227',
};

const STAGE_TEXT: Record<string, string> = {
  entry: '#fff',
  emerging: '#183B68',
  experienced: '#fff',
  leadership: '#fff',
};

export default function CareerPathPreview({ draft, onEditRoadmap }: Props) {
  const [reviewing,   setReviewing]   = useState(false);
  const [suggestions, setSuggestions] = useState<ReviewSuggestion[]>([]);
  const [showReview,  setShowReview]  = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [copied,      setCopied]      = useState(false);

  const handleReview = async () => {
    setReviewing(true);
    setReviewError('');
    const summary = STAGE_CONFIGS.map((c) => {
      const s = draft.stages[c.key as keyof typeof draft.stages];
      return `${c.label}: Role=${s.roleTitle}, Skills=${s.skills.join(', ')}, Certs=${s.certifications.join(', ')}`;
    }).join('\n');
    try {
      const results = await reviewCareerRoadmap(summary, draft.careerTitle);
      setSuggestions(results);
      setShowReview(true);
    } catch {
      setReviewError('Could not generate review. Please try again.');
    } finally {
      setReviewing(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await generateCareerPathDocx(draft);
      downloadCareerPathDocx(blob, draft.fullName);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = () => {
    const text = STAGE_CONFIGS.map((c) => {
      const s = draft.stages[c.key as keyof typeof draft.stages];
      return `=== ${c.label} (${c.timeframe}) ===\nRole: ${s.roleTitle}\n${s.roleDescription}\nMilestones:\n${s.milestones.filter(Boolean).map((m) => `• ${m}`).join('\n')}\nSkills:\n${s.skills.filter(Boolean).map((sk) => `• ${sk}`).join('\n')}`;
    }).join('\n\n');
    const full = `CAREER PATH ROADMAP\n${draft.fullName} | ${draft.careerTitle}\n\nVision: ${draft.careerVision}\n\n${text}`;
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ROW_LABELS = [
    { label: 'Role / Job Title',             getter: (s: typeof draft.stages.entry) => s.roleTitle },
    { label: 'What the Role Entails',        getter: (s: typeof draft.stages.entry) => s.roleDescription },
    { label: 'Expectations & Milestones',    getter: (s: typeof draft.stages.entry) => s.milestones },
    { label: 'Skills to Develop',            getter: (s: typeof draft.stages.entry) => s.skills },
    { label: 'Education & Certifications',   getter: (s: typeof draft.stages.entry) => s.certifications },
    { label: 'Professional Communities',     getter: (s: typeof draft.stages.entry) => s.communities },
    { label: 'Target Companies',             getter: (s: typeof draft.stages.entry) => s.targetCompanies },
  ];

  const stageKeys = ['entry', 'emerging', 'experienced', 'leadership'] as const;

  return (
    <div className="flex flex-col gap-6">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button onClick={onEditRoadmap} className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
          <span className="material-symbols-outlined text-[16px]">edit</span>
          Edit My Roadmap
        </button>
        <button onClick={handleReview} disabled={reviewing} className="flex items-center gap-2 px-4 py-2.5 border border-[#7EC5B3] text-[#183B68] text-sm font-medium rounded-lg hover:bg-[#7EC5B3]/10 transition-colors disabled:opacity-50">
          <span className="material-symbols-outlined text-[16px]">{reviewing ? 'progress_activity' : 'auto_awesome'}</span>
          {reviewing ? 'Reviewing…' : 'AI Review & Suggestions'}
        </button>
        <button onClick={handleDownload} disabled={downloading} className="flex items-center gap-2 px-4 py-2.5 bg-[#183B68] text-white text-sm font-bold rounded-lg hover:bg-[#0f2744] transition-colors disabled:opacity-50">
          <span className="material-symbols-outlined text-[16px]">{downloading ? 'progress_activity' : 'download'}</span>
          {downloading ? 'Generating…' : 'Download as Word (.docx)'}
        </button>
        <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
          <span className="material-symbols-outlined text-[16px]">{copied ? 'check' : 'content_copy'}</span>
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </div>

      {reviewError && <p className="text-red-500 text-sm">{reviewError}</p>}

      {/* AI Review panel */}
      {showReview && suggestions.length > 0 && (
        <div className="bg-[#EFF6FF] border border-[#7EC5B3] rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-[#183B68]">
              <span className="material-symbols-outlined text-[20px] text-[#7EC5B3]">auto_awesome</span>
              AI Roadmap Review
            </div>
            <button onClick={() => setShowReview(false)} className="text-slate-400 hover:text-slate-600">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-slate-200">
                <span className="material-symbols-outlined text-[20px] text-[#7EC5B3] shrink-0 mt-0.5">{s.icon || 'lightbulb'}</span>
                <div>
                  <p className="text-xs font-bold text-[#183B68] mb-1">{s.section}</p>
                  <p className="text-sm text-slate-600">{s.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header block */}
        <div className="bg-[#183B68] px-6 py-5 text-white">
          <p className="text-xs font-medium text-white/60 uppercase tracking-widest mb-1">YouthToPro Mentees Hub</p>
          <p className="text-xl font-black">Career Path Roadmap</p>
        </div>
        <div className="px-6 py-5 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <div><span className="font-semibold text-slate-500">Name:</span> <span className="text-slate-800">{draft.fullName || '—'}</span></div>
          <div><span className="font-semibold text-slate-500">Career Direction:</span> <span className="text-slate-800">{draft.careerTitle || '—'}</span></div>
          <div><span className="font-semibold text-slate-500">Mentor:</span> <span className="text-slate-800">{draft.mentorName || '—'}</span></div>
          <div><span className="font-semibold text-slate-500">University:</span> <span className="text-slate-800">{draft.universityGradYear || '—'}</span></div>
          <div className="sm:col-span-2"><span className="font-semibold text-slate-500">Degree:</span> <span className="text-slate-800">{draft.degreeMajor || '—'}</span></div>
          {draft.careerVision && (
            <div className="sm:col-span-2 pt-1 border-t border-slate-100 mt-1">
              <span className="font-semibold text-slate-500">Vision:</span>
              <span className="text-slate-700 italic ml-1">"{draft.careerVision}"</span>
            </div>
          )}
        </div>

        {/* Roadmap table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[600px]">
            <thead>
              <tr>
                <th className="w-[18%] px-3 py-3 text-left font-bold text-white bg-[#374151]">Category</th>
                {stageKeys.map((key) => {
                  const cfg = STAGE_CONFIGS.find((c) => c.key === key)!;
                  return (
                    <th
                      key={key}
                      className="px-3 py-3 text-center font-bold"
                      style={{ backgroundColor: STAGE_COLORS[key], color: STAGE_TEXT[key] }}
                    >
                      <div>{cfg.label}</div>
                      <div className="font-normal opacity-80 text-[10px]">{cfg.timeframe}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ROW_LABELS.map(({ label, getter }, ri) => (
                <tr key={label} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-3 py-2.5 font-semibold text-[#183B68] bg-[#EFF6FF] border border-slate-200">{label}</td>
                  {stageKeys.map((key) => {
                    const val = getter(draft.stages[key]);
                    return (
                      <td key={key} className="px-3 py-2.5 border border-slate-200 text-slate-700 align-top">
                        {Array.isArray(val) ? (
                          <ul className="flex flex-col gap-0.5">
                            {val.filter(Boolean).map((v, i) => (
                              <li key={i} className="flex items-start gap-1"><span className="text-[#7EC5B3] shrink-0">•</span>{v}</li>
                            ))}
                          </ul>
                        ) : (
                          val || <span className="text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Additional sections */}
        {draft.networkMentors.some(Boolean) && (
          <div className="px-6 py-4 border-t border-slate-100">
            <p className="font-bold text-[#183B68] text-sm mb-2">Network & Mentors</p>
            <ul className="flex flex-col gap-1">
              {draft.networkMentors.filter(Boolean).map((m, i) => (
                <li key={i} className="flex items-start gap-1.5 text-sm text-slate-600"><span className="text-[#7EC5B3]">•</span>{m}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="px-6 py-4 border-t border-[#7EC5B3]/30 bg-[#7EC5B3]/5">
          <p className="font-bold text-[#183B68] text-sm mb-2">Mentor Comments</p>
          {draft.mentorComments ? (
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{draft.mentorComments}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">Awaiting mentor comments</p>
          )}
        </div>

        {draft.personalNotes && (
          <div className="px-6 py-4 border-t border-slate-100">
            <p className="font-bold text-[#183B68] text-sm mb-2">Personal Notes</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{draft.personalNotes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
