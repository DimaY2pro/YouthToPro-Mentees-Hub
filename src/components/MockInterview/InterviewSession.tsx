import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { InterviewRole, InterviewSettings } from '../../lib/mockInterviewTypes';
import { base64ToUint8Array, createPcmBlob, decodeAudioData } from '../../lib/audioUtils';

interface InterviewSessionProps {
  settings: InterviewSettings;
  onEnd: (transcript: string, snapshots: string[], recordingBlob?: Blob) => void;
  onAuthError?: () => void;
  onRestart: () => void;
}

function getGoogleKey(): string {
  return (import.meta as any).env?.VITE_GOOGLE_API_KEY || '';
}

export const InterviewSession: React.FC<InterviewSessionProps> = ({ settings, onEnd, onAuthError, onRestart }) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTalking, setIsTalking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [interviewerVideoReady, setInterviewerVideoReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const transcriptionRef = useRef<string[]>([]);
  const currentTurnInputRef = useRef<string>('');
  const currentTurnOutputRef = useRef<string>('');
  const snapshotsRef = useRef<string[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const interviewerVideoRef = useRef<HTMLVideoElement>(null);

  const assets = settings.role === InterviewRole.HR
    ? {
        video: 'https://videos.pexels.com/video-files/7689975/7689975-sd_640_360_25fps.mp4',
        static: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800',
        name: 'Karla',
        role: 'HR Manager',
        voice: 'Kore',
      }
    : {
        video: 'https://videos.pexels.com/video-files/8419163/8419163-sd_640_360_25fps.mp4',
        static: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800',
        name: 'Khaled',
        role: 'Technical Lead',
        voice: 'Fenrir',
      };

  useEffect(() => {
    let interval: number;
    if (isConnected) {
      interval = window.setInterval(() => setDuration((prev) => prev + 1), 1000);
      if (interviewerVideoRef.current && interviewerVideoReady) {
        interviewerVideoRef.current.play().catch(() => {});
      }
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isConnected, interviewerVideoReady]);

  useEffect(() => {
    if (interviewerVideoRef.current) {
      interviewerVideoRef.current.playbackRate = isTalking ? 1.0 : 0.4;
    }
  }, [isTalking]);

  const stopMediaTracks = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    if (inputContextRef.current) inputContextRef.current.close().catch(() => {});
  };

  const handleStartSession = async () => {
    const key = getGoogleKey();
    if (!key) {
      setError('No Google API key found. Add VITE_GOOGLE_API_KEY to your .env file and restart the dev server.');
      return;
    }

    setHasStarted(true);
    setIsConnecting(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try { await videoRef.current.play(); } catch {}
      }

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      await audioCtx.resume();
      await inputCtx.resume();
      audioContextRef.current = audioCtx;
      inputContextRef.current = inputCtx;
      nextStartTimeRef.current = audioCtx.currentTime;

      const destination = audioCtx.createMediaStreamDestination();
      const userSource = audioCtx.createMediaStreamSource(stream);
      userSource.connect(destination);

      const combinedStream = new MediaStream([...stream.getVideoTracks(), ...destination.stream.getAudioTracks()]);
      const recorder = new MediaRecorder(combinedStream);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);

      const ai = new GoogleGenAI({ apiKey: key });

      const guidelines = `
        You are ${assets.name}, the ${assets.role}.
        Interviewing: ${settings.candidateName} for Youth To Professionals.
        PHASE-BASED FLOW:
        1. Rapport & Intro: Introduce yourself warmly.
        2. Deep Dive: ${settings.role === InterviewRole.HR ? 'Motivation, Career Alignment, Soft Skills.' : 'Technical depth, Problem-solving, Experience.'}
        3. Wrap-up: Final closing.
        BEHAVIOR:
        - ONE question at a time. Responses under 3 sentences.
        - Context: JD: ${settings.jobDescription.substring(0, 500)}... CV: ${settings.cvContent.substring(0, 500)}...
        [SYSTEM INSTRUCTION]: Introduce yourself as ${assets.name} and begin.
      `;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-preview-native-audio-dialog',
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);

            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const pcmBlob = createPcmBlob(e.inputBuffer.getChannelData(0));
              sessionPromise.then((s) => s.sendRealtimeInput({ media: pcmBlob })).catch(() => {});
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);

            window.setInterval(() => {
              if (!videoRef.current || !canvasRef.current) return;
              const ctx = canvasRef.current.getContext('2d');
              if (!ctx) return;
              canvasRef.current.width = 320;
              canvasRef.current.height = 240;
              ctx.drawImage(videoRef.current, 0, 0, 320, 240);
              const data = canvasRef.current.toDataURL('image/jpeg', 0.6).split(',')[1];
              if (snapshotsRef.current.length < 8 && Math.random() > 0.9) snapshotsRef.current.push(data);
              sessionPromise.then((s) => s.sendRealtimeInput({ media: { mimeType: 'image/jpeg', data } }));
            }, 2000);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              currentTurnOutputRef.current += message.serverContent.outputTranscription.text;
              setIsTalking(true);
            }
            if (message.serverContent?.inputTranscription) {
              currentTurnInputRef.current += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.turnComplete) {
              if (currentTurnInputRef.current) transcriptionRef.current.push(`Candidate: ${currentTurnInputRef.current}`);
              if (currentTurnOutputRef.current) transcriptionRef.current.push(`${assets.name}: ${currentTurnOutputRef.current}`);
              currentTurnInputRef.current = '';
              currentTurnOutputRef.current = '';
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioCtx) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioCtx.currentTime);
              const audioBuffer = await decodeAudioData(base64ToUint8Array(base64Audio), audioCtx);
              const bufSource = audioCtx.createBufferSource();
              bufSource.buffer = audioBuffer;
              bufSource.connect(audioCtx.destination);
              bufSource.connect(destination);
              bufSource.onended = () => {
                sourcesRef.current.delete(bufSource);
                if (sourcesRef.current.size === 0) setIsTalking(false);
              };
              bufSource.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(bufSource);
              setIsTalking(true);
            }
          },
          onerror: (e: any) => {
            console.error('Session error:', e);
            if (e?.message?.includes('Requested entity was not found')) onAuthError?.();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: assets.voice } } },
          systemInstruction: guidelines,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err: any) {
      console.error('Session start error:', err);
      setIsConnecting(false);
      setError('Unable to access your camera or microphone. Please check permissions.');
      setHasStarted(false);
    }
  };

  const handleEndInterview = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        stopMediaTracks();
        onEnd(transcriptionRef.current.join('\n'), snapshotsRef.current, blob);
      };
      mediaRecorderRef.current.stop();
    } else {
      stopMediaTracks();
      onEnd(transcriptionRef.current.join('\n'), snapshotsRef.current);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px] md:h-[480px]">
        {/* Candidate feed */}
        <div className="relative bg-slate-200 rounded-[2rem] overflow-hidden flex items-center justify-center border-2 border-white shadow-lg">
          {!isConnected && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 z-10">
              <div className="w-10 h-10 rounded-full border-4 border-slate-300 border-t-[#183B68] animate-spin mb-3"></div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Waiting for Camera...</p>
            </div>
          )}
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md text-white px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest">
            {settings.candidateName}
          </div>
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-600/90 text-white p-6 text-center z-20 rounded-[2rem]">
              <div>
                <span className="material-symbols-outlined text-5xl mb-3">error</span>
                <p className="font-black mb-4">{error}</p>
                <button onClick={onRestart} className="mt-2 bg-white text-red-600 px-6 py-2 rounded-xl font-bold">
                  Go Back
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Interviewer feed */}
        <div className="relative bg-[#183B68] rounded-[2rem] overflow-hidden flex flex-col items-center justify-center border-2 border-[#183B68] shadow-lg">
          {!hasStarted && (
            <div className="absolute inset-0 z-40 bg-[#183B68] flex flex-col items-center justify-center p-8 text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-[#7EC5B3] shadow-2xl">
                <img src={assets.static} alt={assets.name} className="w-full h-full object-cover" />
              </div>
              <h2 className="text-2xl font-black text-white mb-1">{assets.name}</h2>
              <p className="text-[#7EC5B3] font-bold mb-6 uppercase tracking-widest text-xs">{assets.role}</p>
              <button
                onClick={handleStartSession}
                disabled={isConnecting}
                className="px-8 py-4 bg-[#7EC5B3] hover:bg-[#5aaa98] text-white font-black rounded-2xl shadow-xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {isConnecting ? 'Connecting...' : 'Enter Lab Session'}
              </button>
            </div>
          )}
          <img src={assets.static} alt="Interviewer" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${interviewerVideoReady ? 'opacity-0' : 'opacity-100'}`} />
          <video
            ref={interviewerVideoRef}
            src={assets.video}
            poster={assets.static}
            autoPlay loop muted playsInline preload="auto"
            onCanPlay={() => setInterviewerVideoReady(true)}
            className={`w-full h-full object-cover transition-opacity duration-1000 ${interviewerVideoReady ? 'opacity-100' : 'opacity-0'}`}
          />
          {isTalking && (
            <div className="absolute inset-0 border-8 border-[#7EC5B3]/30 animate-pulse pointer-events-none rounded-[1.8rem]"></div>
          )}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-5 py-2 bg-[#183B68]/80 backdrop-blur-md rounded-xl border border-white/10 text-white text-xs font-black uppercase tracking-widest">
            {assets.name}
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
            {isConnected && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>}
            {isConnected ? 'Live Audio' : isConnecting ? 'Connecting...' : 'Ready'}
          </div>
          <div className="text-lg font-mono font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl">
            {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
          </div>
        </div>
        <button
          onClick={handleEndInterview}
          className="px-8 py-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all border border-red-100"
        >
          Finish Assessment
        </button>
      </div>
    </div>
  );
};
