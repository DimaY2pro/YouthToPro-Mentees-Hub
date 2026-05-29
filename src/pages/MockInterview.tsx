import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { UserProfile, loadMenteeProfile } from '../lib/firebase';
import Sidebar from '../components/Sidebar';
import { SetupForm } from '../components/MockInterview/SetupForm';
import { InterviewSession } from '../components/MockInterview/InterviewSession';
import { FeedbackReport } from '../components/MockInterview/FeedbackReport';
import { AppStep, FeedbackData, InterviewSettings } from '../lib/mockInterviewTypes';
import { generateFeedback } from '../lib/geminiService';

interface MockInterviewProps {
  user: User | null;
  profile?: UserProfile | null;
}

export default function MockInterview({ user, profile }: MockInterviewProps) {
  const [step, setStep] = useState<AppStep>('SETUP');
  const [settings, setSettings] = useState<InterviewSettings | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadMenteeProfile(user.uid)
      .then((mp) => {
        if (mp?.fullName) setCandidateName(mp.fullName);
        else if (user.displayName) setCandidateName(user.displayName);
      })
      .catch(() => {
        if (user.displayName) setCandidateName(user.displayName);
      });
  }, [user?.uid]);

  if (!user) return <Navigate to="/" replace />;

  const handleStart = (newSettings: InterviewSettings) => {
    setSettings(newSettings);
    setStep('INTERVIEW');
  };

  const handleEndInterview = async (transcript: string, snapshots: string[], recordingBlob?: Blob) => {
    if (!settings) return;
    setLoadingFeedback(true);
    setStep('FEEDBACK');
    try {
      const data = await generateFeedback(
        transcript,
        settings.jobDescription,
        settings.cvContent,
        snapshots,
        settings.role,
        settings.candidateName,
      );
      data.snapshots = snapshots;
      data.transcript = transcript;
      if (recordingBlob) data.recordingUrl = URL.createObjectURL(recordingBlob);
      setFeedback(data);
    } catch (e: any) {
      console.error('Assessment error:', e);
      alert(`Assessment failed: ${e?.message || 'Unknown error'}. Please try again.`);
      setStep('INTERVIEW');
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleRestart = () => {
    setStep('SETUP');
    setSettings(null);
    setFeedback(null);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar user={user} profile={profile} />

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#183B68] flex items-center justify-between px-4 z-50">
        <h1 className="text-white font-bold text-sm">AI Mock Interview</h1>
        <button onClick={() => setMobileSidebarOpen(true)} className="text-white/80 hover:text-white">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)}>
          <div className="absolute inset-y-0 left-0 w-64 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <Sidebar user={user} profile={profile} />
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark relative pt-14 md:pt-0">
        {/* Step indicator */}
        <div className="max-w-[1100px] mx-auto px-4 md:px-8 pt-6 pb-2 flex items-center gap-3">
          {(['SETUP', 'INTERVIEW', 'FEEDBACK'] as AppStep[]).map((s, idx) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${step === s ? 'text-[#183B68]' : idx < (['SETUP', 'INTERVIEW', 'FEEDBACK'] as AppStep[]).indexOf(step) ? 'text-[#7EC5B3]' : 'text-slate-300'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${step === s ? 'bg-[#183B68] text-white' : idx < (['SETUP', 'INTERVIEW', 'FEEDBACK'] as AppStep[]).indexOf(step) ? 'bg-[#7EC5B3] text-white' : 'bg-slate-200 text-slate-400'}`}>
                  {idx + 1}
                </span>
                {s}
              </div>
              {idx < 2 && <div className={`flex-1 h-px ${idx < (['SETUP', 'INTERVIEW', 'FEEDBACK'] as AppStep[]).indexOf(step) ? 'bg-[#7EC5B3]' : 'bg-slate-200'}`}></div>}
            </React.Fragment>
          ))}
        </div>

        <div className="max-w-[1100px] mx-auto p-4 md:p-8">
          {step === 'SETUP' && (
            <SetupForm onStart={handleStart} initialName={candidateName} />
          )}

          {step === 'INTERVIEW' && settings && (
            <InterviewSession
              settings={settings}
              onEnd={handleEndInterview}
              onRestart={handleRestart}
              onAuthError={handleRestart}
            />
          )}

          {step === 'FEEDBACK' && (
            <div className="relative">
              {loadingFeedback && (
                <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-20 h-20 border-4 border-[#7EC5B3] border-t-transparent rounded-full animate-spin mb-6"></div>
                  <h2 className="text-3xl font-black text-[#183B68] mb-2">Analyzing Your Session</h2>
                  <p className="text-slate-500 max-w-sm">Evaluating confidence, tone, and technical accuracy...</p>
                </div>
              )}
              {feedback && <FeedbackReport data={feedback} onRestart={handleRestart} />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
