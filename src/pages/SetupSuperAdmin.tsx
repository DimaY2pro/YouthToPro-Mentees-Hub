import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { checkSuperAdminExists, bootstrapSuperAdmin, logout, ADMIN_EMAIL } from '../lib/firebase';

interface Props {
  user: User | null;
  authLoading?: boolean;
}

export default function SetupSuperAdmin({ user, authLoading }: Props) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return; // wait for auth to settle
    if (!user) return;
    checkSuperAdminExists()
      .then((e) => { setExists(e); })
      .catch(() => { setExists(false); })
      .finally(() => setChecking(false));
  }, [user, authLoading]);

  // Show spinner while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f6f7f8]">
        <span className="material-symbols-outlined animate-spin text-[40px] text-[#7EC5B3]">progress_activity</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f6f7f8]">
        <span className="material-symbols-outlined animate-spin text-[40px] text-[#7EC5B3]">progress_activity</span>
      </div>
    );
  }

  // ADMIN_EMAIL can always reclaim superadmin — skip the "already exists" block
  const isAdminEmail = user.email === ADMIN_EMAIL;

  if (exists && !done && !isAdminEmail) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center">
          <div className="size-16 rounded-full bg-[#7EC5B3]/20 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px] text-[#7EC5B3]">check_circle</span>
          </div>
          <h1 className="text-xl font-black text-[#183B68] mb-2">Setup Already Complete</h1>
          <p className="text-slate-500 text-sm mb-6">
            A Super Admin already exists. Your account should already have admin access.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/admin-console')}
              className="px-6 py-2.5 rounded-lg bg-[#183B68] text-white text-sm font-bold hover:bg-[#183B68]/90 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              Open Admin Console
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center">
          <div className="size-16 rounded-full bg-[#F3B557]/20 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px] text-[#F3B557]">verified_user</span>
          </div>
          <h1 className="text-xl font-black text-[#183B68] mb-2">Super Admin Configured!</h1>
          <p className="text-slate-500 text-sm mb-6">Redirecting to Admin Console…</p>
          <span className="material-symbols-outlined animate-spin text-[28px] text-[#7EC5B3]">progress_activity</span>
        </div>
      </div>
    );
  }

  const handleSetup = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      await bootstrapSuperAdmin(user.uid);
      setDone(true);
      setTimeout(() => navigate('/admin-console'), 1500);
    } catch (e: any) {
      setError(e.message || 'Setup failed. Ensure you have a user document in Firestore first.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full">

        <div className="flex items-center gap-3 mb-6">
          <div className="size-12 rounded-xl bg-[#183B68] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#F3B557] text-[24px]">admin_panel_settings</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-[#183B68]">Super Admin Setup</h1>
            <p className="text-slate-500 text-xs">One-time configuration</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-bold text-slate-500 mb-1">Signed in as</p>
          <p className="text-sm font-bold text-[#183B68]">{user.displayName || user.email}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>

        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          This will grant <strong>Super Admin</strong> privileges to your account, giving you full access to the Admin Console including user management, admin team control, and audit logs.
        </p>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2 mb-4">
            <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0">error</span>
            {error}
          </div>
        )}

        <button
          onClick={handleSetup}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#183B68] hover:bg-[#183B68]/90 text-white font-bold text-sm transition-colors disabled:opacity-60"
        >
          {loading ? (
            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
          )}
          {loading ? 'Setting up…' : 'Set Me as Super Admin'}
        </button>

        <button
          onClick={async () => { await logout(); navigate('/'); }}
          className="w-full mt-3 text-sm text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          Log Out Instead
        </button>
      </div>
    </div>
  );
}
