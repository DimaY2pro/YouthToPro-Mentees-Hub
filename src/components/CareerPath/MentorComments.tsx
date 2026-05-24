import { CareerPathDraft } from '../../lib/firebase';

interface Props {
  draft: CareerPathDraft;
  onChange: (draft: CareerPathDraft) => void;
  onSave: () => void;
  saving: boolean;
}

const REFLECTIONS = [
  { key: 'reflection1' as const, question: 'What is the most important piece of advice your mentor gave you?' },
  { key: 'reflection2' as const, question: "What will you change in your roadmap based on your mentor's feedback?" },
  { key: 'reflection3' as const, question: 'What is your next action step after this conversation?' },
];

export default function MentorComments({ draft, onChange, onSave, saving }: Props) {
  const set = <K extends keyof CareerPathDraft>(key: K, value: CareerPathDraft[K]) =>
    onChange({ ...draft, [key]: value });

  const setReflection = (key: keyof CareerPathDraft['reflections'], value: string) =>
    onChange({ ...draft, reflections: { ...draft.reflections, [key]: value } });

  return (
    <div className="flex flex-col gap-6 max-w-[760px] mx-auto">
      {/* Notice banner */}
      <div className="flex items-start gap-3 p-4 bg-[#7EC5B3]/10 border border-[#7EC5B3]/40 rounded-xl text-sm text-[#183B68]">
        <span className="material-symbols-outlined text-[20px] text-[#7EC5B3] shrink-0 mt-0.5">info</span>
        <p>
          Share this roadmap with your mentor and ask them to add their feedback here. You can download the
          Word version and fill it in together during your mentoring session.
          <br />
          <span className="text-slate-400 text-xs mt-1 block">
            Note: A future update will allow your mentor to access and fill this section directly.
          </span>
        </p>
      </div>

      {/* Mentor feedback form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5" style={{ background: 'linear-gradient(to bottom, #f0fdf9, #fff)' }}>
        <h3 className="text-[#183B68] font-bold text-base">Mentor's Feedback & Advice</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Mentor's Name</label>
            <input
              type="text"
              value={draft.mentorName}
              onChange={(e) => set('mentorName', e.target.value)}
              placeholder="e.g. Dr. Sarah Williams"
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Date of Feedback</label>
            <input
              type="date"
              value={draft.mentorFeedbackDate}
              onChange={(e) => set('mentorFeedbackDate', e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Mentor's Feedback & Advice</label>
          <textarea
            rows={8}
            value={draft.mentorComments}
            onChange={(e) => set('mentorComments', e.target.value)}
            placeholder="Your mentor will add their comments, suggestions, and advice here. This section is reserved for mentor input. You can fill this in together during your mentoring session, or paste feedback your mentor has shared with you."
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all resize-none"
          />
          <p className="text-xs text-slate-400">You can fill this in together during your mentoring session, or paste feedback your mentor has shared with you.</p>
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="self-start flex items-center gap-2 px-5 py-2.5 bg-[#7EC5B3] hover:bg-[#6ab5a3] text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[16px]">{saving ? 'progress_activity' : 'save'}</span>
          {saving ? 'Saving…' : 'Save Mentor Comments'}
        </button>
      </div>

      {/* Reflection prompts */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#F3B557]">psychology</span>
          <h3 className="text-[#183B68] font-bold text-base">Your Reflections</h3>
        </div>
        <p className="text-slate-500 text-sm -mt-2">Think about your mentor's feedback and write your reflections below.</p>

        {REFLECTIONS.map(({ key, question }) => (
          <div key={key} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
            <p className="text-[#183B68] font-semibold text-sm">{question}</p>
            <textarea
              rows={2}
              value={draft.reflections[key]}
              onChange={(e) => setReflection(key, e.target.value)}
              placeholder="Write your reflection here…"
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all resize-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
