import { STAGE_CONFIGS } from './StageCard';

const EXAMPLE_ROLES = [
  'e.g. Junior Analyst → Data Analyst → Senior Analyst → Head of Analytics',
  'e.g. Marketing Coordinator → Brand Manager → Senior Manager → CMO',
  'e.g. Grad Engineer → Project Engineer → Senior Engineer → VP Engineering',
  'e.g. HR Assistant → HR Manager → HR Director → Chief People Officer',
];

const BENEFITS = [
  { icon: 'explore',    title: 'Gain Clarity',      desc: 'See the full picture of your career, not just your first job.' },
  { icon: 'checklist',  title: 'Stay On Track',     desc: 'Know exactly which skills and certifications to focus on each year.' },
  { icon: 'handshake',  title: 'Guide Your Mentor', desc: 'Give your mentor context so they can give you targeted advice.' },
];

interface Props {
  onStartBuilding: () => void;
  onExplorer: () => void;
}

export default function HowItWorks({ onStartBuilding, onExplorer }: Props) {
  return (
    <div className="max-w-[760px] mx-auto flex flex-col gap-10">
      {/* Hero */}
      <div className="text-center flex flex-col items-center gap-3 pt-4">
        <div className="p-4 bg-[#183B68]/10 rounded-2xl">
          <span className="material-symbols-outlined text-[40px] text-[#183B68]">route</span>
        </div>
        <h2 className="text-[#183B68] text-2xl font-black">Map Your Career Journey</h2>
        <p className="text-slate-600 text-base leading-relaxed max-w-xl">
          A career path is your personal roadmap — from where you are today as a student, to where you want
          to be in 10+ years. It helps you make smarter decisions about skills, certifications, and
          opportunities at every stage.
        </p>
      </div>

      {/* Timeline */}
      <div>
        <h3 className="text-[#183B68] font-bold text-lg mb-6 text-center">The 4-Stage Career Journey</h3>
        <div className="flex flex-col md:flex-row items-start gap-0 md:gap-0 relative">
          {/* connecting line desktop */}
          <div className="hidden md:block absolute top-[36px] left-[calc(12.5%)] right-[calc(12.5%)] h-0.5 bg-slate-200 z-0" />
          {STAGE_CONFIGS.map((stage, i) => (
            <div key={stage.key} className="flex flex-row md:flex-col items-start md:items-center flex-1 gap-3 md:gap-0 relative z-10">
              {/* Mobile connector */}
              {i < 3 && <div className="md:hidden absolute left-[18px] top-[44px] bottom-[-12px] w-0.5 bg-slate-200" />}
              <div className="flex flex-col items-center">
                <div
                  className="size-[56px] rounded-full flex items-center justify-center text-white shrink-0 shadow-md"
                  style={{ backgroundColor: stage.color }}
                >
                  <span className="material-symbols-outlined text-[24px]">{stage.icon}</span>
                </div>
              </div>
              <div className="md:text-center md:px-2 md:mt-3 mb-4 md:mb-0">
                <p className="text-[#183B68] font-bold text-sm">{stage.label}</p>
                <p className="text-slate-500 text-xs">{stage.timeframe}</p>
                <p className="text-slate-400 text-xs mt-1 hidden md:block">{EXAMPLE_ROLES[i]}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-slate-400 text-xs text-center mt-4 md:hidden">{EXAMPLE_ROLES[0]}</p>
      </div>

      {/* Benefits */}
      <div>
        <h3 className="text-[#183B68] font-bold text-lg mb-4 text-center">Why This Matters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {BENEFITS.map((b) => (
            <div key={b.icon} className="flex flex-col items-center gap-3 p-5 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="p-3 bg-[#7EC5B3]/20 rounded-xl">
                <span className="material-symbols-outlined text-[28px] text-[#183B68]">{b.icon}</span>
              </div>
              <p className="text-[#183B68] font-bold text-sm">{b.title}</p>
              <p className="text-slate-500 text-sm leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col items-center gap-4 pb-4">
        <button
          onClick={onStartBuilding}
          className="flex items-center gap-2 px-8 py-3.5 bg-[#183B68] hover:bg-[#0f2744] text-[#F3B557] font-bold rounded-xl transition-colors shadow-md text-base"
        >
          <span className="material-symbols-outlined text-[20px]">map</span>
          Start Building My Career Path →
        </button>
        <button
          onClick={onExplorer}
          className="text-sm text-[#183B68] hover:text-[#7EC5B3] font-medium underline underline-offset-2 transition-colors"
        >
          Not sure what career to choose? Try the Career Explorer →
        </button>
      </div>
    </div>
  );
}
