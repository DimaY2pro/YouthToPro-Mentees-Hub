import { useState } from 'react';
import { streamPolishLetter } from '../../lib/claude';
import { generateLOIDocx, downloadDocx } from '../../lib/docxExport';
import type { LOIFormData } from './LOIForm';

interface Props {
  data: LOIFormData;
  polishedVersion: string | null;
  onSetPolished: (text: string | null) => void;
  onEdit: () => void;
}

export function assembleLetter(data: LOIFormData, polished?: string | null): string {
  if (polished) return polished;
  const challenges = data.challenges.filter(Boolean).map((c) => `• ${c}`).join('\n');
  const expectations = data.expectations.filter(Boolean).map((e) => `• ${e}`).join('\n');
  return `${data.date}

Dear Mentor,

My name is ${data.fullName} and I am studying ${data.program} at ${data.university} in ${data.cityCountry} and my expected graduation is in ${data.graduationMonth} ${data.graduationYear}. I am very excited to work with you through the YouthToProfessionals mentoring program and I hope this letter will give you a good idea about who I am and how I can benefit from your professional and life experience.

During my time at university, I enjoyed ${data.enjoyed}. What I found to be challenging/less enjoyable was ${data.challenging}.

My industry of choice is ${data.industry}, ideally in ${data.preferredLocations}. As I think of my future career, my goals are ${data.careerGoals}. I feel that ${data.skills} will support me in being successful in this line of work.

However, I foresee the following challenges which I need your help with:
${challenges}

I am looking for a mentor who can:
${expectations}

I thank you in advance for the time you intend to invest with me and my intention is to show up fully to make this time well-worth your effort! I am available to meet ${data.availability}.
Please find below my contact details:

Mobile: ${data.mobile}  |  WhatsApp: ${data.whatsapp}  |  Email: ${data.email}

Best regards,
${data.fullName}`;
}

export default function LOIPreview({ data, polishedVersion, onSetPolished, onEdit }: Props) {
  const [polishing, setPolishing] = useState(false);
  const [polishStream, setPolishStream] = useState('');
  const [showComparison, setShowComparison] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dlError, setDlError] = useState('');

  const originalText = assembleLetter(data, null);
  const displayText = assembleLetter(data, polishedVersion);

  const handlePolish = () => {
    setPolishing(true);
    setPolishStream('');
    setShowComparison(false);
    streamPolishLetter(
      originalText,
      (chunk) => setPolishStream((p) => p + chunk),
      () => { setPolishing(false); setShowComparison(true); },
      (err) => { setPolishing(false); setPolishStream(''); alert('AI polish failed: ' + err); },
    );
  };

  const handleAcceptPolish = () => {
    onSetPolished(polishStream);
    setShowComparison(false);
    setPolishStream('');
  };

  const handleRejectPolish = () => {
    setShowComparison(false);
    setPolishStream('');
  };

  const handleDownload = async () => {
    setDownloading(true);
    setDlError('');
    try {
      const blob = await generateLOIDocx({
        ...data,
        polishedText: polishedVersion,
      });
      const nameParts = data.fullName.trim().split(/\s+/);
      downloadDocx(blob, nameParts[0] || 'Mentee', nameParts.slice(1).join('_'));
    } catch (e: any) {
      setDlError('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-[860px] mx-auto">
      {/* Action bar */}
      <div className="flex flex-wrap gap-3">
        <button onClick={onEdit} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
          <span className="material-symbols-outlined text-[18px]">edit</span>
          Edit My Letter
        </button>
        <button
          onClick={handlePolish}
          disabled={polishing}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#7EC5B3] text-[#7EC5B3] text-sm font-bold hover:bg-[#7EC5B3]/10 transition-colors disabled:opacity-60"
        >
          {polishing ? (
            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          )}
          {polishing ? 'AI is reviewing…' : 'AI Final Polish'}
        </button>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#183B68] hover:bg-[#183B68]/90 text-white text-sm font-bold transition-colors disabled:opacity-60 shadow-md"
        >
          {downloading ? (
            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">download</span>
          )}
          Download as Word (.docx)
        </button>
        <button onClick={handleCopy} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
          <span className="material-symbols-outlined text-[18px]">{copied ? 'check' : 'content_copy'}</span>
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </div>

      {dlError && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{dlError}</p>
      )}

      {polishedVersion && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#7EC5B3]/10 border border-[#7EC5B3] rounded-xl text-sm text-[#183B68] font-medium">
          <span className="material-symbols-outlined text-[#7EC5B3] text-[18px]">auto_awesome</span>
          Showing AI polished version.
          <button onClick={() => onSetPolished(null)} className="ml-auto text-slate-500 hover:text-red-500 text-xs underline">Revert to original</button>
        </div>
      )}

      {/* AI Polish comparison */}
      {showComparison && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
          <h3 className="font-black text-[#183B68] text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7EC5B3]">compare</span>
            AI Polish — Review Changes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Your Version</p>
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                {originalText}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-[#7EC5B3] uppercase tracking-wide">AI Polished Version</p>
              <div className="bg-[#EFF6FF] rounded-xl border border-[#7EC5B3] p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                {polishStream || <span className="animate-pulse text-slate-400">Writing…</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleAcceptPolish} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#7EC5B3] text-white text-sm font-bold hover:bg-[#6ab5a3] transition-colors">
              <span className="material-symbols-outlined text-[18px]">check</span>
              Use AI Version
            </button>
            <button onClick={handleRejectPolish} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-500 text-sm font-medium hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-[18px]">close</span>
              Keep My Version
            </button>
          </div>
        </div>
      )}

      {/* Letter preview card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 md:p-12">
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-[#183B68] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#F3B557] text-[16px]">hub</span>
            </div>
            <span className="text-[#183B68] font-bold text-sm">YouthToPro Hub</span>
          </div>
          <span className="text-slate-400 text-sm">{data.date}</span>
        </div>

        <div className="whitespace-pre-wrap text-slate-700 text-sm leading-[1.9] font-[Calibri,sans-serif]">
          {displayText}
        </div>
      </div>
    </div>
  );
}
