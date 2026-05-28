import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { UserProfile, loadMenteeProfile, MenteeProfile } from '../lib/firebase';
import Sidebar from '../components/Sidebar';
import CareerExplorer from '../components/CareerPath/CareerExplorer';

interface Props {
  user: User | null;
  profile?: UserProfile | null;
}

export default function CareerExplorerPage({ user, profile }: Props) {
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [menteeProfile, setMenteeProfile] = useState<MenteeProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    loadMenteeProfile(user.uid).then(setMenteeProfile).catch(() => {});
  }, [user?.uid]);

  if (!user) return <Navigate to="/" replace />;

  const initialDegree = menteeProfile
    ? (menteeProfile.minor
        ? `${menteeProfile.major}, Minor: ${menteeProfile.minor}`
        : menteeProfile.major || '')
    : '';
  const initialRegion = menteeProfile?.location || '';

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar user={user} profile={profile} />

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#183B68] flex items-center justify-between px-4 z-50">
        <h1 className="text-white font-bold text-sm">Career Explorer</h1>
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
        <div className="max-w-[1200px] mx-auto p-4 md:p-8 flex flex-col gap-6">
          <header className="flex flex-col gap-1">
            <h2 className="text-[#183B68] dark:text-white text-2xl md:text-3xl font-black tracking-tight">Career Explorer</h2>
            <p className="text-slate-500 text-sm max-w-xl">Discover career paths that match your degree, interests, and work style.</p>
          </header>

          <CareerExplorer
            onSelectCareer={(title) => {
              navigate(`/modules/career-path?career=${encodeURIComponent(title)}`);
            }}
            initialDegree={initialDegree}
            initialRegion={initialRegion}
          />
        </div>
      </main>
    </div>
  );
}
