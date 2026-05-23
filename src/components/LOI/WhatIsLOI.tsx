interface Props {
  onStartWriting: () => void;
}

const TIPS = [
  {
    icon: 'edit_note',
    title: 'Be Honest',
    text: "Write in your own words. There are no right or wrong answers — just your story.",
  },
  {
    icon: 'lightbulb',
    title: 'Be Specific',
    text: 'Instead of "I want a good job", say "I want to work in digital marketing in Dubai".',
  },
  {
    icon: 'translate',
    title: 'Simple English is Fine',
    text: 'Write naturally. Our AI assistant will help polish your language.',
  },
  {
    icon: 'schedule',
    title: 'Take Your Time',
    text: "Save your progress and come back. You don't have to finish in one session.",
  },
];

export default function WhatIsLOI({ onStartWriting }: Props) {
  return (
    <div className="max-w-[720px] mx-auto flex flex-col gap-8">
      {/* Main info card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="size-12 rounded-xl bg-[#183B68] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#F3B557] text-[24px]">description</span>
          </div>
          <h2 className="text-[#183B68] text-2xl font-black">Your Letter of Intent — Why It Matters</h2>
        </div>
        <p className="text-slate-600 text-base leading-relaxed">
          This Letter of Intent is an important part of your mentorship journey and your opportunity to help us
          understand who you are beyond your CV or academic background. The more thoughtful, honest, and detailed
          your responses are, the better we can support you in achieving greater career clarity and matching you
          with a mentor whose experience, industry background, and guidance style align with your goals, aspirations,
          and challenges. This is your chance to reflect on your interests, strengths, ambitions, and the type of
          support you hope to receive to make the mentorship experience as valuable and impactful as possible.
        </p>
      </div>

      {/* Tips 2x2 grid */}
      <div>
        <h3 className="text-[#183B68] font-bold text-lg mb-4">Tips for Writing Your Letter</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TIPS.map((tip) => (
            <div
              key={tip.title}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex gap-4"
            >
              <div className="size-10 rounded-xl bg-[#7EC5B3]/15 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#7EC5B3] text-[22px]">{tip.icon}</span>
              </div>
              <div>
                <p className="font-bold text-[#183B68] text-sm mb-1">{tip.title}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{tip.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-center">
        <button
          onClick={onStartWriting}
          className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#183B68] hover:bg-[#183B68]/90 text-white font-bold text-base transition-all shadow-md hover:shadow-lg"
        >
          Start Writing My Letter
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
