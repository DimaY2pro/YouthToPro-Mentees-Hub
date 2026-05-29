import React, { useRef, useState } from 'react';
import { ArabicDialect, InterviewRole, InterviewSettings, Language } from '../../lib/mockInterviewTypes';
import { extractTextFromDocument } from '../../lib/geminiService';

interface SetupFormProps {
  onStart: (settings: InterviewSettings) => void;
  initialName?: string;
}

export const SetupForm: React.FC<SetupFormProps> = ({ onStart, initialName = '' }) => {
  const [candidateName, setCandidateName] = useState(initialName);
  const [cvContent, setCvContent] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [role, setRole] = useState<InterviewRole>(InterviewRole.HR);
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);
  const [dialect, setDialect] = useState<ArabicDialect>(ArabicDialect.NONE);
  const [extractingCv, setExtractingCv] = useState(false);
  const [extractingJd, setExtractingJd] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const cvInputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvContent || !jobDescription || !candidateName) {
      alert('Please fill in all fields.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((track) => track.stop());
      onStart({ candidateName, cvContent, jobDescription, role, language, dialect });
    } catch {
      alert('Camera and Microphone access is required for the interview session.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'CV' | 'JD') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const setContent = target === 'CV' ? setCvContent : setJobDescription;
    const setLoading = target === 'CV' ? setExtractingCv : setExtractingJd;
    setLoading(true);
    setExtractError(null);
    try {
      const text = await extractTextFromDocument(file);
      setContent(text);
    } catch (err: any) {
      setExtractError(err?.message || 'Failed to read document. Check your Google API key.');
    } finally {
      setLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Hero banner */}
      <div className="bg-white rounded-[2rem] overflow-hidden shadow-xl mb-10 border border-slate-100 flex flex-col items-center pt-16 pb-16 px-6">
        <div className="flex items-center gap-4 mb-6">
          <svg width="72" height="48" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 10C23.4315 10 10 23.4315 10 40C10 56.5685 23.4315 70 40 70C42.4828 70 44.8775 69.6983 47.1633 69.131L53 76L53 66.0298C58.4619 63.3887 62.6289 58.7495 64.6738 53.0781H47V26.9219H64.6738C62.6289 21.2505 58.4619 16.6113 53 13.9702V10H40Z" fill="#183B68"/>
            <path d="M80 10C96.5685 10 110 23.4315 110 40C110 56.5685 96.5685 70 80 70C77.5172 70 75.1225 69.6983 72.8367 69.131L67 76L67 66.0298C61.5381 63.3887 57.3711 58.7495 55.3262 53.0781H73V26.9219H55.3262C57.3711 21.2505 61.5381 16.6113 67 13.9702V10H80Z" fill="#7EC5B3"/>
            <rect x="53" y="22" width="7" height="36" fill="#D3BC8D"/>
            <rect x="60" y="22" width="7" height="36" fill="white"/>
          </svg>
          <div className="flex items-baseline">
            <span className="text-4xl font-serif font-bold text-[#183B68]">Interview</span>
            <span className="text-4xl font-serif font-bold italic text-[#7EC5B3] ml-1">Lab</span>
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#183B68] mb-3 tracking-tight text-center max-w-2xl">
          From preparation <span className="text-[#7EC5B3]">to confidence.</span>
        </h1>
        <p className="text-slate-500 text-center max-w-lg">
          Practice with our AI interviewer and get a detailed assessment of your performance.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border border-slate-100">
        <div className="mb-8">
          <h3 className="text-2xl font-black text-[#183B68] mb-2">Professional Setup</h3>
          <p className="text-slate-500">Upload your credentials to start a high-fidelity simulation session.</p>
        </div>

        {extractError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {extractError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-xs font-black text-[#183B68] uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#7EC5B3]">person</span>
              Name
            </label>
            <input
              type="text"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#7EC5B3]/20 focus:border-[#7EC5B3] focus:outline-none transition-all text-lg font-medium text-[#183B68] placeholder:text-slate-300"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          {/* CV + JD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-[#183B68] uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#7EC5B3]">description</span>
                  Resume (CV)
                </label>
                <button
                  type="button"
                  onClick={() => cvInputRef.current?.click()}
                  className="text-[10px] font-black uppercase text-[#7EC5B3] hover:text-[#183B68] tracking-wider"
                >
                  Import File
                </button>
              </div>
              <textarea
                className="w-full h-56 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#7EC5B3]/20 focus:border-[#7EC5B3] focus:outline-none text-sm resize-none font-medium text-slate-700 leading-relaxed"
                value={cvContent}
                onChange={(e) => setCvContent(e.target.value)}
                placeholder={extractingCv ? 'Extracting text from document...' : 'Paste your CV / resume here...'}
                required
              />
              <input type="file" ref={cvInputRef} className="hidden" accept=".pdf,.doc,.docx,.txt,.md" onChange={(e) => handleFileUpload(e, 'CV')} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-[#183B68] uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#7EC5B3]">work</span>
                  Job Requirements
                </label>
                <button
                  type="button"
                  onClick={() => jdInputRef.current?.click()}
                  className="text-[10px] font-black uppercase text-[#7EC5B3] hover:text-[#183B68] tracking-wider"
                >
                  Import File
                </button>
              </div>
              <textarea
                className="w-full h-56 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#7EC5B3]/20 focus:border-[#7EC5B3] focus:outline-none text-sm resize-none font-medium text-slate-700 leading-relaxed"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder={extractingJd ? 'Extracting text from document...' : 'Paste the job description here...'}
                required
              />
              <input type="file" ref={jdInputRef} className="hidden" accept=".pdf,.doc,.docx,.txt,.md" onChange={(e) => handleFileUpload(e, 'JD')} />
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-[#183B68] uppercase tracking-widest">Interviewer Persona</label>
              <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setRole(InterviewRole.HR)}
                  className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${role === InterviewRole.HR ? 'bg-white shadow-lg text-[#183B68]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Human Resources
                </button>
                <button
                  type="button"
                  onClick={() => setRole(InterviewRole.FUNCTIONAL)}
                  className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${role === InterviewRole.FUNCTIONAL ? 'bg-white shadow-lg text-[#183B68]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Technical Lead
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-[#183B68] uppercase tracking-widest">Interview Language</label>
              <div className="relative">
                <select
                  className="w-full px-6 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#7EC5B3]/20 focus:border-[#7EC5B3] focus:outline-none text-sm font-black text-[#183B68] appearance-none cursor-pointer"
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value as Language);
                    if (e.target.value === Language.ENGLISH) setDialect(ArabicDialect.NONE);
                    else setDialect(ArabicDialect.JORDANIAN);
                  }}
                >
                  <option value={Language.ENGLISH}>English (International)</option>
                  <option value={Language.ARABIC}>Arabic (Regional Dialects)</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#7EC5B3]">
                  <span className="material-symbols-outlined text-[20px]">expand_more</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={extractingCv || extractingJd}
            className="w-full py-5 bg-[#183B68] hover:bg-[#12305a] text-white font-black text-xl rounded-[1.5rem] shadow-xl transition-all transform hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
          >
            {extractingCv || extractingJd ? (
              <>
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing Documents...
              </>
            ) : (
              <>
                Start Mock Interview
                <span className="material-symbols-outlined text-[24px] transition-transform group-hover:translate-x-2">arrow_forward</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
