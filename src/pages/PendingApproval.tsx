import { useState, useEffect, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { logout, UserProfile, getUserProfile } from '../lib/firebase';

interface Props {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

export default function PendingApproval({ user, profile, loading }: Props) {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleManualRefresh = useCallback(async () => {
    if (!user || refreshing) return;
    setRefreshing(true);
    try {
      const fresh = await getUserProfile(user.uid);
      if (fresh?.status === 'approved') {
        navigate('/modules', { replace: true });
      }
    } finally {
      setRefreshing(false);
      setCountdown(60);
    }
  }, [user, refreshing, navigate]);

  // 60-second auto-refresh
  useEffect(() => {
    if (!user || profile?.status === 'approved') return;
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          handleManualRefresh();
          return 60;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [user, profile?.status, handleManualRefresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f6f7f8]">
        <span className="material-symbols-outlined animate-spin text-[40px] text-[#7EC5B3]">progress_activity</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (profile?.status === 'approved') return <Navigate to="/modules" replace />;

  const rejected = profile?.status === 'rejected';

  return (
    <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center">

        {/* Status icon */}
        <div className={`size-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
          rejected ? 'bg-red-100' : 'bg-[#F3B557]/15'
        }`}>
          <span className={`material-symbols-outlined text-[40px] ${
            rejected ? 'text-red-500' : 'text-[#F3B557]'
          }`}>
            {rejected ? 'cancel' : 'hourglass_top'}
          </span>
        </div>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="size-8 rounded-lg bg-[#183B68]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#183B68] text-[18px]">hub</span>
          </div>
          <span className="font-bold text-[#183B68] text-sm">YouthToPro Hub</span>
        </div>

        <h1 className="text-2xl font-black text-[#183B68] mb-3">
          {rejected ? 'Application Not Approved' : 'Application Under Review'}
        </h1>

        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          {rejected
            ? 'Unfortunately your application was not approved at this time. Please reach out to the YouthToPro team if you have questions.'
            : "Thanks for signing up! A YouthToPro admin will review your application and grant you access shortly."}
        </p>

        {/* Rejection reason */}
        {rejected && profile?.rejectedReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs font-bold text-red-600 mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">info</span>
              Reason provided
            </p>
            <p className="text-sm text-red-700">{profile.rejectedReason}</p>
          </div>
        )}

        {/* Email chip */}
        <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 mb-6">
          <span className="material-symbols-outlined text-[16px] text-[#7EC5B3]">mail</span>
          {user.email}
        </div>

        {/* Auto-refresh indicator */}
        {!rejected && (
          <div className="mb-6">
            <div className="flex items-center gap-2 justify-center text-xs text-slate-400 mb-3">
              <span className="material-symbols-outlined text-[14px] text-[#7EC5B3]">wifi</span>
              Listening for approval in real-time…
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg bg-[#7EC5B3]/20 hover:bg-[#7EC5B3]/30 text-[#2d7a6b] text-sm font-medium transition-colors disabled:opacity-60"
            >
              {refreshing ? (
                <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[16px]">refresh</span>
              )}
              {refreshing ? 'Checking…' : `Check now (auto in ${countdown}s)`}
            </button>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 mx-auto text-sm text-slate-400 hover:text-red-500 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          Log Out
        </button>
      </div>
    </div>
  );
}
