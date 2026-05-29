import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FeedbackData } from '../../lib/mockInterviewTypes';

interface FeedbackReportProps {
  data: FeedbackData;
  onRestart: () => void;
}

export const FeedbackReport: React.FC<FeedbackReportProps> = ({ data, onRestart }) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const getOutcomeTheme = (outcome: string) => {
    const o = outcome.toLowerCase();
    if (o.includes('high') || o.includes('strong')) return { color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    if (o.includes('ready')) return { color: '#3b82f6', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    if (o.includes('developing')) return { color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    return { color: '#ef4444', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
  };

  const theme = getOutcomeTheme(data.outcome);

  const handleDownloadVideo = () => {
    if (!data.recordingUrl) return;
    const a = document.createElement('a');
    a.href = data.recordingUrl;
    a.download = `Interview_Lab_${data.candidateName.replace(/\s+/g, '_')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const primaryColor: [number, number, number] = [24, 59, 104];
      const accentColor: [number, number, number] = [126, 197, 179];

      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 15, 297, 'F');

      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('INTERVIEW LAB', 25, 28);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('EXECUTIVE ASSESSMENT SUMMARY', 25, 36);

      doc.setFillColor(245, 247, 250);
      doc.roundedRect(145, 18, 50, 30, 4, 4, 'F');
      doc.setTextColor(...primaryColor);
      doc.setFontSize(20);
      doc.text(`${Math.round(data.overallScore)}%`, 155, 36);
      doc.setFontSize(7);
      doc.text('OVERALL READINESS', 151, 44);

      doc.setFontSize(12);
      doc.setTextColor(...primaryColor);
      doc.text(`Candidate: ${data.candidateName}`, 25, 52);
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`Assessment Date: ${new Date().toLocaleDateString()}`, 25, 58);

      doc.setFillColor(250, 251, 253);
      doc.rect(25, 65, 170, 30, 'F');
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
      const summaryLines = doc.splitTextToSize(data.summary, 160);
      doc.text(summaryLines, 30, 73);

      let y = 110;

      doc.setTextColor(...primaryColor);
      doc.setFontSize(12);
      doc.text('VERBAL INTELLIGENCE', 25, y);
      y += 8;

      const metrics = [
        { l: 'Confidence', v: data.sentiment.confidenceScore, max: 100 },
        { l: 'Filler Control', v: data.sentiment.fillerWordFrequency.toLowerCase().includes('low') ? 90 : data.sentiment.fillerWordFrequency.toLowerCase().includes('med') ? 60 : 30, max: 100 },
      ];
      metrics.forEach((m) => {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(m.l, 25, y);
        doc.setFillColor(230, 230, 230);
        doc.rect(70, y - 2.5, 100, 2.5, 'F');
        doc.setFillColor(...accentColor);
        doc.rect(70, y - 2.5, (m.v / m.max) * 100, 2.5, 'F');
        y += 7;
      });

      y += 8;
      doc.setTextColor(...primaryColor);
      doc.setFontSize(12);
      doc.text('VISUAL INTELLIGENCE', 25, y);
      y += 8;

      const visualMetrics = [
        { l: 'Eye Contact', s: data.visualIntelligence.eyeContactScore },
        { l: 'Posture', s: data.visualIntelligence.postureScore },
        { l: 'Presence', s: data.visualIntelligence.professionalPresence },
      ];
      visualMetrics.forEach((m) => {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(m.l, 25, y);
        for (let i = 1; i <= 5; i++) {
          if (i <= m.s) doc.setFillColor(...accentColor);
          else doc.setFillColor(240, 240, 240);
          doc.rect(70 + i * 12, y - 4, 10, 4, 'F');
        }
        y += 7;
      });

      y += 10;
      autoTable(doc, {
        startY: y,
        margin: { left: 25 },
        head: [['Dimension', 'Score', 'Feedback Note']],
        body: data.rubric.map((r) => [r.dimension, `${Math.min(5, r.score)}/5`, r.justification]),
        headStyles: { fillColor: primaryColor, fontSize: 9 },
        styles: { fontSize: 7, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 }, 1: { cellWidth: 15 } },
      });

      y = (doc as any).lastAutoTable.finalY + 12;

      doc.setTextColor(...primaryColor);
      doc.setFontSize(12);
      doc.text('GROWTH PIPELINE', 25, y);
      y += 7;

      data.improvements.slice(0, 3).forEach((imp) => {
        if (y > 270) { doc.addPage(); y = 30; }
        doc.setFillColor(255, 245, 245);
        doc.rect(25, y, 170, 14, 'F');
        doc.setFontSize(8);
        doc.setTextColor(200, 0, 0);
        doc.text(`${imp.topic}:`, 30, y + 5);
        doc.setTextColor(60, 60, 60);
        const step = doc.splitTextToSize(imp.actionableStep, 155);
        doc.text(step[0] || '', 30, y + 10);
        y += 17;
      });

      doc.save(`Interview_Report_${data.candidateName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const GraphicBar = ({ label, score, max = 5 }: { label: string; score: number; max?: number }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
        <span>{label}</span>
        <span className="text-[#183B68]">{score} / {max}</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
        <div
          className="h-full bg-gradient-to-r from-[#7EC5B3] to-[#183B68] rounded-full transition-all duration-1000"
          style={{ width: `${(score / max) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#7EC5B3]/5 rounded-full -mr-36 -mt-36 blur-[80px]"></div>
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className={`inline-flex items-center gap-2 px-5 py-1.5 rounded-full border font-black text-[10px] uppercase tracking-[0.2em] ${theme.text} ${theme.bg} ${theme.border}`}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.color }}></span>
              {data.outcome}
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-[#183B68] tracking-tight leading-none">
              {data.candidateName}
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">
              Executive Evaluation Summary & Professional Growth Pipeline
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleDownloadPDF}
                disabled={isExporting}
                className="px-8 py-4 bg-[#183B68] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {isExporting ? 'Preparing...' : 'Export PDF Report'}
              </button>
              {data.recordingUrl && (
                <button
                  onClick={handleDownloadVideo}
                  className="px-7 py-4 bg-white text-[#183B68] border-2 border-[#183B68]/10 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">videocam</span>
                  Session Recording
                </button>
              )}
              <button
                onClick={onRestart}
                className="px-7 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black rounded-2xl transition-all uppercase text-[10px] tracking-[0.3em]"
              >
                New Interview
              </button>
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-52 h-52 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="104" cy="104" r="90" stroke="#f1f5f9" strokeWidth="14" fill="transparent" />
                <circle
                  cx="104" cy="104" r="90"
                  stroke={theme.color}
                  strokeWidth="14"
                  strokeDasharray={2 * Math.PI * 90}
                  strokeDashoffset={(2 * Math.PI * 90) * (1 - data.overallScore / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-6xl font-black text-[#183B68] tracking-tighter">{Math.round(data.overallScore)}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebars */}
        <div className="lg:col-span-1 space-y-8">
          {/* Verbal */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-50 space-y-6">
            <h3 className="text-xs font-black text-[#183B68] uppercase tracking-[0.2em]">Verbal Matrix</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Confidence', value: `${data.sentiment.confidenceScore}%` },
                { label: 'Filler Words', value: data.sentiment.fillerWordFrequency },
                { label: 'Tone', value: data.sentiment.tone },
                { label: 'Engagement', value: data.sentiment.engagementLevel },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{label}</span>
                  <span className="text-lg font-black text-[#183B68]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="bg-[#183B68] rounded-[2.5rem] p-8 shadow-2xl text-white space-y-6">
            <h3 className="text-xs font-black text-[#7EC5B3] uppercase tracking-[0.2em]">Visual Audit</h3>
            <div className="space-y-6">
              <GraphicBar label="Eye Contact" score={data.visualIntelligence.eyeContactScore} />
              <GraphicBar label="Posture & Poise" score={data.visualIntelligence.postureScore} />
              <GraphicBar label="Executive Presence" score={data.visualIntelligence.professionalPresence} />
              <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                <span className="text-[9px] font-black text-[#7EC5B3] uppercase tracking-[0.2em] mb-2 block">Non-Verbal Summary</span>
                <p className="text-xs text-white/60 leading-relaxed italic">"{data.visualIntelligence.facialExpressions}"</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="lg:col-span-2 space-y-8">
          {/* Summary + Strengths */}
          <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-50 space-y-8">
            <div>
              <h3 className="text-xs font-black text-[#183B68] uppercase tracking-[0.3em] mb-3">Performance Narrative</h3>
              <p className="text-slate-600 text-xl font-serif font-medium leading-snug">{data.summary}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.strengths.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="w-7 h-7 bg-emerald-500 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rubric */}
          <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-50 space-y-10">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-[#183B68] uppercase tracking-[0.3em]">Score Matrix</h3>
              <div className="px-3 py-1 bg-slate-50 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">Level 1-5</div>
            </div>
            <div className="space-y-10">
              {data.rubric.map((item, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  <div className="md:col-span-4 space-y-2">
                    <h4 className="font-black text-lg text-[#183B68] tracking-tight">{item.dimension}</h4>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={`w-7 h-1.5 rounded-full ${i <= item.score ? 'bg-[#7EC5B3]' : 'bg-slate-100'}`}></div>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-8">
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">{item.justification}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Growth pipeline */}
          <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-200 space-y-8">
            <h3 className="text-xs font-black text-[#183B68] uppercase tracking-[0.3em]">Strategic Growth Pipeline</h3>
            <div className="space-y-5">
              {data.improvements.map((item, idx) => (
                <div key={idx} className="bg-white p-7 rounded-[2rem] border border-slate-200 hover:border-red-200 transition-all shadow-sm">
                  <div className="flex gap-5 items-start">
                    <div className="w-10 h-10 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center font-black text-base flex-shrink-0">!</div>
                    <div className="space-y-3 flex-1">
                      <h4 className="font-black text-[#183B68] uppercase tracking-tight">{item.topic}</h4>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed">{item.feedback}</p>
                      <div className="flex items-center gap-2 text-[10px] font-black text-red-600 bg-red-50 px-4 py-1.5 rounded-xl border border-red-100 uppercase tracking-widest w-fit">
                        Action: {item.actionableStep}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transcript */}
          {data.transcript && (
            <div className="bg-[#183B68] rounded-[3rem] p-10 shadow-2xl space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black text-[#7EC5B3] uppercase tracking-[0.3em]">Dialogue Audit Log</h3>
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-0.5">Full Session Transcription</p>
                </div>
                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all border border-white/10"
                >
                  {showTranscript ? 'Hide' : 'View Dialogue'}
                </button>
              </div>
              {showTranscript && (
                <div className="space-y-5 max-h-[400px] overflow-y-auto pr-2">
                  {data.transcript.split('\n').map((line, i) => {
                    const isCandidate = line.startsWith('Candidate');
                    return (
                      <div key={i} className={`flex gap-4 items-start ${isCandidate ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center font-black text-[9px] uppercase ${isCandidate ? 'bg-white text-[#183B68]' : 'bg-[#7EC5B3] text-white'}`}>
                          {isCandidate ? 'C' : 'I'}
                        </div>
                        <div className={`max-w-[85%] p-5 rounded-2xl text-sm leading-relaxed ${isCandidate ? 'bg-white text-[#183B68]' : 'bg-white/10 text-white/90 border border-white/5'}`}>
                          {line.split(':').slice(1).join(':').trim()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
