import { useState } from 'react';
import { exploreCareerOptions } from '../../lib/claude';

interface CareerSuggestion {
  title: string;
  matchLevel: 'strong' | 'good' | 'exploring';
  whySuitable: string;
  entryRole: string;
  industries: string[];
  avgSalaryRange: string;
  icon: string;
}

interface Props {
  onSelectCareer: (title: string) => void;
}

const MATCH_CONFIG = {
  strong:    { label: 'Strong Match',    icon: 'star',        bg: 'bg-green-100',  text: 'text-green-700'  },
  good:      { label: 'Good Match',      icon: 'thumb_up',    bg: 'bg-teal-100',   text: 'text-teal-700'   },
  exploring: { label: 'Worth Exploring', icon: 'explore',     bg: 'bg-amber-100',  text: 'text-amber-700'  },
};

export default function CareerExplorer({ onSelectCareer }: Props) {
  const [degree,    setDegree]    = useState('');
  const [interests, setInterests] = useState('');
  const [skills,    setSkills]    = useState('');
  const [workStyle, setWorkStyle] = useState('No Preference');
  const [region,    setRegion]    = useState('');

  const [suggestions, setSuggestions] = useState<CareerSuggestion[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [explored,    setExplored]    = useState(false);

  const explore = async () => {
    if (!degree.trim() || !interests.trim()) {
      setError('Please fill in your Degree and Interests at minimum.');
      return;
    }
    setError('');
    setLoading(true);
    setSuggestions([]);
    try {
      const results = await exploreCareerOptions(degree, interests, skills, workStyle, region || 'Middle East/GCC');
      setSuggestions(results);
      setExplored(true);
    } catch {
      setError("We couldn't generate suggestions right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left: Input panel */}
      <div className="lg:w-[40%] flex flex-col gap-5 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div>
          <h3 className="text-[#183B68] font-bold text-lg mb-1">Tell us about yourself</h3>
          <p className="text-slate-500 text-sm">Fill in your details and we'll suggest careers that match your profile.</p>
        </div>

        {[
          { label: 'Your Degree / Major *', value: degree, set: setDegree, placeholder: 'e.g. Business Administration, Computer Engineering' },
          { label: 'Your Top Interests *', value: interests, set: setInterests, placeholder: 'e.g. Technology, People, Data, Creativity' },
          { label: 'Skills You Enjoy Using', value: skills, set: setSkills, placeholder: 'e.g. Problem solving, Communication, Analysis' },
          { label: 'Preferred Region to Work', value: region, set: setRegion, placeholder: 'e.g. UAE, GCC, Europe, Open to anywhere' },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label} className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
            <input
              type="text"
              value={value}
              onChange={(e) => set(e.target.value)}
              placeholder={placeholder}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all"
            />
          </div>
        ))}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Preferred Work Style</label>
          <div className="flex flex-wrap gap-2">
            {['Remote', 'Office', 'Hybrid', 'No Preference'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setWorkStyle(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  workStyle === s
                    ? 'bg-[#183B68] text-white border-[#183B68]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-[#183B68]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="button"
          onClick={explore}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full py-3 bg-[#F3B557] hover:bg-yellow-500 text-[#183B68] font-bold rounded-xl transition-colors disabled:opacity-60 shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">{loading ? 'progress_activity' : 'auto_awesome'}</span>
          {loading ? 'Exploring careers…' : 'Explore Career Options'}
        </button>
      </div>

      {/* Right: Results panel */}
      <div className="lg:w-[60%] flex flex-col gap-4">
        {!explored && !loading && (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center gap-4">
            <div className="p-4 bg-[#F3B557]/20 rounded-2xl">
              <span className="material-symbols-outlined text-[40px] text-[#F3B557]">lightbulb</span>
            </div>
            <p className="text-slate-500 text-sm max-w-xs">
              Fill in your details and click Explore to discover career paths that match your profile.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-xl border border-slate-200 gap-4">
            <span className="material-symbols-outlined text-[36px] text-[#7EC5B3] animate-spin">progress_activity</span>
            <p className="text-slate-500 text-sm">Exploring career options for you…</p>
          </div>
        )}

        {suggestions.map((s, i) => {
          const match = MATCH_CONFIG[s.matchLevel] ?? MATCH_CONFIG.exploring;
          return (
            <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#183B68]/10 rounded-lg">
                    <span className="material-symbols-outlined text-[22px] text-[#183B68]">{s.icon || 'work'}</span>
                  </div>
                  <p className="text-[#183B68] font-bold text-base">{s.title}</p>
                </div>
                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${match.bg} ${match.text}`}>
                  <span className="material-symbols-outlined text-[14px]">{match.icon}</span>
                  {match.label}
                </span>
              </div>
              <div className="px-5 py-4 flex flex-col gap-3">
                <p className="text-slate-600 text-sm leading-relaxed">{s.whySuitable}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Entry Role</p>
                    <p className="text-slate-700">{s.entryRole}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Industry</p>
                    <p className="text-slate-700">{s.industries?.join(', ')}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Avg Salary</p>
                    <p className="text-slate-700">{s.avgSalaryRange}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectCareer(s.title)}
                  className="flex items-center gap-2 mt-1 px-4 py-2.5 bg-[#183B68] hover:bg-[#0f2744] text-white text-sm font-bold rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">map</span>
                  Build Roadmap for This Path
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
