import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { updateDisplayName, UserProfile } from '../lib/firebase';
import Sidebar from '../components/Sidebar';

interface ProfileData {
  bio: string;
  location: string;
  careerGoal: string;
  industry: string;
  linkedIn: string;
  phone: string;
}

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Marketing',
  'Design', 'Engineering', 'Law', 'Non-profit', 'Other',
];

function storageKey(uid: string) {
  return `y2p_profile_${uid}`;
}

function getInitials(user: User) {
  if (user.displayName) {
    return user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }
  return (user.email?.[0] ?? 'M').toUpperCase();
}

// ── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-xl text-sm font-semibold animate-fade-in ${
        type === 'success'
          ? 'bg-[#7EC5B3] text-[#183B68]'
          : 'bg-red-500 text-white'
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">
        {type === 'success' ? 'check_circle' : 'error'}
      </span>
      {message}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface ProfileProps {
  user: User | null;
  profile?: UserProfile | null;
}

export default function Profile({ user, profile: userProfile }: ProfileProps) {
  const [displayName, setDisplayName] = useState('');
  const [data, setData] = useState<ProfileData>({
    bio: '', location: '', careerGoal: '', industry: '', linkedIn: '', phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName ?? '');
    const stored = localStorage.getItem(storageKey(user.uid));
    if (stored) {
      try { setData(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, [user]);

  if (!user) return <Navigate to="/" replace />;

  const showToast = (message: string, type: 'success' | 'error') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (displayName.trim() !== (user.displayName ?? '')) {
        await updateDisplayName(displayName.trim());
      }
      localStorage.setItem(storageKey(user.uid), JSON.stringify(data));
      showToast('Profile saved successfully!', 'success');
    } catch (err: any) {
      showToast(err.message ?? 'Failed to save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const initials = getInitials(user);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f6f7f8] dark:bg-[#101922]">
      {/* ── Sidebar ───────────────────────────────────── */}
      <Sidebar user={user} profile={userProfile} />

      {/* ── Mobile sidebar overlay ──────────────────────── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute left-0 top-0 h-full w-64 bg-[#183B68]" onClick={(e) => e.stopPropagation()}>
            <Sidebar user={user} profile={userProfile} />
          </div>
        </div>
      )}

      {/* ── Main content ──────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#183B68] text-white sticky top-0 z-30">
          <button onClick={() => setMobileSidebarOpen(true)}>
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span className="font-bold text-sm">My Profile</span>
          <div className="w-6" />
        </div>

        <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">

          {/* ── Page header ───────────────────────────── */}
          <div className="mb-8">
            <h1 className="text-2xl font-black text-[#183B68] dark:text-white">My Profile</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Manage how you appear to mentors and the YouthToPro community.
            </p>
          </div>

          {/* ── Avatar ──────────────────────────────────── */}
          <div className="bg-white dark:bg-[#15202b] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="avatar"
                  className="size-20 rounded-full ring-4 ring-[#F3B557]/40 object-cover shrink-0"
                />
              ) : (
                <div className="size-20 rounded-full ring-4 ring-[#F3B557]/40 bg-[#183B68] flex items-center justify-center text-[#F3B557] font-black text-2xl shrink-0">
                  {initials}
                </div>
              )}
              <div>
                <p className="font-bold text-[#183B68] dark:text-white text-base">
                  {user.displayName ?? user.email?.split('@')[0] ?? 'Mentee'}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{user.email}</p>
                {user.photoURL && (
                  <p className="text-xs text-[#7EC5B3] mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    Photo synced from Google
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Personal info form ────────────────────────── */}
          <div className="bg-white dark:bg-[#15202b] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
            <h2 className="text-base font-bold text-[#183B68] dark:text-white mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#7EC5B3]">badge</span>
              Personal Information
            </h2>

            <div className="flex flex-col gap-5">
              {/* Display name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Jordan Smith"
                  className="h-11 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all placeholder:text-slate-400 text-sm"
                />
                <p className="text-xs text-slate-400">This is the name mentors will see.</p>
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Phone Number <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">call</span>
                  </span>
                  <input
                    value={data.phone}
                    onChange={(e) => setData((d) => ({ ...d, phone: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                    className="h-11 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-3 text-slate-900 dark:text-white focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all placeholder:text-slate-400 text-sm"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                  </span>
                  <input
                    value={data.location}
                    onChange={(e) => setData((d) => ({ ...d, location: e.target.value }))}
                    placeholder="e.g. New York, NY"
                    className="h-11 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-3 text-slate-900 dark:text-white focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all placeholder:text-slate-400 text-sm"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Bio <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={data.bio}
                  onChange={(e) => setData((d) => ({ ...d, bio: e.target.value }))}
                  rows={3}
                  maxLength={300}
                  placeholder="Tell your mentor a bit about yourself..."
                  className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-slate-900 dark:text-white focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all placeholder:text-slate-400 text-sm resize-none"
                />
                <p className="text-xs text-slate-400 text-right">{data.bio.length}/300</p>
              </div>
            </div>
          </div>

          {/* ── Career info ───────────────────────────────── */}
          <div className="bg-white dark:bg-[#15202b] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
            <h2 className="text-base font-bold text-[#183B68] dark:text-white mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#F3B557]">trending_up</span>
              Career Goals
            </h2>

            <div className="flex flex-col gap-5">
              {/* Industry */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Target Industry</label>
                <select
                  value={data.industry}
                  onChange={(e) => setData((d) => ({ ...d, industry: e.target.value }))}
                  className="h-11 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all text-sm"
                >
                  <option value="">Select an industry…</option>
                  {INDUSTRIES.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>

              {/* Career goal */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Career Goal</label>
                <input
                  value={data.careerGoal}
                  onChange={(e) => setData((d) => ({ ...d, careerGoal: e.target.value }))}
                  placeholder="e.g. Become a UX Designer at a tech company"
                  className="h-11 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all placeholder:text-slate-400 text-sm"
                />
              </div>

              {/* LinkedIn */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  LinkedIn URL <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">link</span>
                  </span>
                  <input
                    value={data.linkedIn}
                    onChange={(e) => setData((d) => ({ ...d, linkedIn: e.target.value }))}
                    placeholder="https://linkedin.com/in/yourname"
                    className="h-11 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-3 text-slate-900 dark:text-white focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all placeholder:text-slate-400 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Save button ───────────────────────────────── */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#183B68] hover:bg-[#1a4480] disabled:opacity-60 text-white px-8 py-3 font-bold text-sm transition-all shadow-md hover:shadow-lg"
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  Saving…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Save Profile
                </>
              )}
            </button>
          </div>

        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
