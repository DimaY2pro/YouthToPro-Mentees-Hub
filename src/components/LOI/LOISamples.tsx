import { useState } from 'react';

export interface SampleData {
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

const SAMPLE_BUSINESS: SampleData = {
  date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
  fullName: 'Alex Johnson',
  program: 'Bachelor of Business Administration',
  university: 'University of Dubai',
  cityCountry: 'Dubai, UAE',
  graduationMonth: 'June',
  graduationYear: '2025',
  enjoyed: 'Financial analysis, marketing strategy, business case competitions',
  challenging: 'Statistics courses and public speaking presentations',
  industry: 'Finance and Banking',
  preferredLocations: 'Dubai, UAE or London, UK',
  careerGoals: 'Work as a financial analyst or investment banking associate',
  skills: 'Analytical thinking, attention to detail, strong work ethic',
  challenges: [
    'Limited professional network and not knowing how to approach employers',
    'No internship experience yet',
    'Unsure how to prepare for job interviews',
  ],
  expectations: [
    'Help review and improve my CV',
    'Guidance on preparing for job interviews',
    'Introduction to the finance industry',
  ],
  availability: 'One hour every two weeks',
  mobile: '',
  whatsapp: '',
  email: '',
  aiPolishedVersion: null,
} as any;

const SAMPLE_ENGINEERING: SampleData = {
  date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
  fullName: 'Sara Ahmed',
  program: 'Bachelor of Computer Engineering',
  university: 'Cairo University',
  cityCountry: 'Cairo, Egypt',
  graduationMonth: 'December',
  graduationYear: '2025',
  enjoyed: 'Programming, software development projects, AI and machine learning courses',
  challenging: 'Group projects with unclear roles and understanding industry expectations',
  industry: 'Technology and Software Development',
  preferredLocations: 'Cairo, Egypt or Dubai, UAE',
  careerGoals: 'Become a software developer or work in artificial intelligence',
  skills: 'Problem solving, programming in Python and Java, quick learner',
  challenges: [
    'English communication in professional settings',
    'Building confidence when talking to professionals',
    'Understanding how to stand out to employers',
  ],
  expectations: [
    'Guidance on career path in tech',
    'Help improving English communication in professional settings',
    'Advice on building a professional online presence',
  ],
  availability: 'One hour every week on weekends',
  mobile: '',
  whatsapp: '',
  email: '',
  aiPolishedVersion: null,
} as any;

interface SampleCardProps {
  number: number;
  title: string;
  persona: string;
  sample: SampleData;
  onUse: (sample: SampleData) => void;
}

function assembleLetter(s: SampleData): string {
  const challenges = s.challenges.filter(Boolean).map((c) => `• ${c}`).join('\n');
  const expectations = s.expectations.filter(Boolean).map((e) => `• ${e}`).join('\n');
  return `${s.date}

Dear Mentor,

My name is ${s.fullName} and I am studying ${s.program} at ${s.university} in ${s.cityCountry} and my expected graduation is in ${s.graduationMonth} ${s.graduationYear}. I am very excited to work with you through the YouthToProfessionals mentoring program and I hope this letter will give you a good idea about who I am and how I can benefit from your professional and life experience.

During my time at university, I enjoyed ${s.enjoyed}. What I found to be challenging/less enjoyable was ${s.challenging}.

My industry of choice is ${s.industry}, ideally in ${s.preferredLocations}. As I think of my future career, my goals are ${s.careerGoals}. I feel that ${s.skills} will support me in being successful in this line of work.

However, I foresee the following challenges which I need your help with:
${challenges}

I am looking for a mentor who can:
${expectations}

I thank you in advance for the time you intend to invest with me and my intention is to show up fully to make this time well-worth your effort! I am available to meet ${s.availability}.

Best regards,
${s.fullName}`;
}

function SampleCard({ number, title, persona, sample, onUse }: SampleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-[#183B68] flex items-center justify-center text-[#F3B557] font-black text-lg shrink-0">
            {number}
          </div>
          <div>
            <h3 className="font-black text-[#183B68] text-base">{title}</h3>
            <p className="text-slate-500 text-sm">{persona}</p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">
              {expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
            </span>
            {expanded ? 'Hide Sample' : 'View Sample'}
          </button>

          {confirming ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Replace your current text?</span>
              <button
                onClick={() => { onUse(sample); setConfirming(false); }}
                className="px-3 py-1.5 rounded-lg bg-[#183B68] text-white text-sm font-bold hover:bg-[#183B68]/90 transition-colors"
              >
                Yes, Use This
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-500 text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F3B557] hover:bg-yellow-500 text-[#183B68] text-sm font-bold transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">edit_document</span>
              Use as Starting Point
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 p-6">
          <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
            {assembleLetter(sample)}
          </pre>
        </div>
      )}
    </div>
  );
}

interface Props {
  onUse: (sample: SampleData) => void;
}

export default function LOISamples({ onUse }: Props) {
  return (
    <div className="max-w-[720px] mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-[#183B68] text-xl font-black mb-1">Sample Letters</h2>
        <p className="text-slate-500 text-sm">
          Read these examples for inspiration, or use one as a starting point and edit it to match your story.
        </p>
      </div>
      <SampleCard
        number={1}
        title='"The Business Student"'
        persona="Final year Business Administration student, interested in Finance — Dubai, UAE"
        sample={SAMPLE_BUSINESS}
        onUse={onUse}
      />
      <SampleCard
        number={2}
        title='"The Engineering Student"'
        persona="Third year Computer Engineering student, interested in Tech — Cairo, Egypt"
        sample={SAMPLE_ENGINEERING}
        onUse={onUse}
      />
    </div>
  );
}
