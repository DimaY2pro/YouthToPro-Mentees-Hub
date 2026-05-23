import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { changePassword, deleteAccount, isEmailUser, UserProfile } from '../lib/firebase';
import Sidebar from '../components/Sidebar';

// ── Types ────────────────────────────────────────────────────────────────────

interface NotifPrefs {
  sessionReminders: boolean;
  weeklyDigest: boolean;
  mentorMessages: boolean;
  progressUpdates: boolean;
}

function notifKey(uid: string) { return `y2p_notif_${uid}`; }

// ── Small reusable pieces ────────────────────────────────────────────────────

function SectionCard({ icon, title, subtitle, children }: {
  icon: string; title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-[#15202b] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
      <div className="flex items-start gap-3 mb-5">
        <span className="material-symbols-outlined text-[22px] text-[#7EC5B3] mt-0.5">{icon}</span>
        <div>
          <h2 className="text-base font-bold text-[#183B68] dark:text-white">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label, desc }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-4 py-3 cursor-pointer group">
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-[#183B68] dark:group-hover:text-white transition-colors">
          {label}
        </p>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <div
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? 'bg-[#7EC5B3]' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
    </label>
  );
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-xl text-sm font-semibold ${
        type === 'success' ? 'bg-[#7EC5B3] text-[#183B68]' : 'bg-red-500 text-white'
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

interface AccountSettingsProps {
  user: User | null;
  profile?: UserProfile | null;
}

export default function AccountSettings({ user, profile }: AccountSettingsProps) {
  // Mobile sidebar
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Notifications
  const [notifs, setNotifs] = useState<NotifPrefs>({
    sessionReminders: true,
    weeklyDigest: true,
    mentorMessages: true,
    progressUpdates: false,
  });

  // Password change
  const [currentPwd,  setCurrentPwd]  = useState('');
  const [newPwd,      setNewPwd]      = useState('');
  const [confirmPwd,  setConfirmPwd]  = useState('');
  const [pwdLoading,  setPwdLoading]  = useState(false);
  const [showPwd,     setShowPwd]     = useState(false);

  // Delete account
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword,    setDeletePassword]    = useState('');
  const [deleteLoading,     setDeleteLoading]     = useState(false);
  const [showDeleteZone,    setShowDeleteZone]    = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(notifKey(user.uid));
    if (stored) {
      try { setNotifs(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, [user]);

  if (!user) return <Navigate to="/" replace />;

  const emailUser = isEmailUser();

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Handlers ─────────────────────────────────────────────

  const handleSaveNotifs = () => {
    localStorage.setItem(notifKey(user.uid), JSON.stringify(notifs));
    showToast('Notification preferences saved!', 'success');
  };

  const handleChangePassword = async () => {
    if (newPwd.length < 8) {
      showToast('New password must be at least 8 characters.', 'error'); return;
    }
    if (newPwd !== confirmPwd) {
      showToast('New passwords do not match.', 'error'); return;
    }
    setPwdLoading(true);
    try {
      await changePassword(currentPwd, newPwd);
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      showToast('Password updated successfully!', 'success');
    } catch (err: any) {
      const msg = err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'Current password is incorrect.'
        : err.message ?? 'Failed to update password.';
      showToast(msg, 'error');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      showToast('Please type DELETE to confirm.', 'error'); return;
    }
    setDeleteLoading(true);
    try {
      await deleteAccount(emailUser ? deletePassword : undefined);
      // User is now signed out automatically; routing handles redirect
    } catch (err: any) {
      const msg = err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'Password is incorrect.'
        : err.message ?? 'Failed to delete account.';
      showToast(msg, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f6f7f8] dark:bg-[#101922]">
      <Sidebar user={user} profile={profile} />

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute left-0 top-0 h-full w-64 bg-[#183B68]" onClick={(e) => e.stopPropagation()}>
            <Sidebar user={user} profile={profile} />
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#183B68] text-white sticky top-0 z-30">
          <button onClick={() => setMobileSidebarOpen(true)}>
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span className="font-bold text-sm">Account Settings</span>
          <div className="w-6" />
        </div>

        <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">

          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-2xl font-black text-[#183B68] dark:text-white">Account Settings</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Manage your security preferences and notification settings.
            </p>
          </div>

          {/* ── Account info (read-only) ────────────────────── */}
          <SectionCard icon="account_circle" title="Account Overview">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm text-slate-500 dark:text-slate-400">Email</span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{user.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm text-slate-500 dark:text-slate-400">Sign-in method</span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-slate-800 dark:text-slate-200">
                  {emailUser ? (
                    <><span className="material-symbols-outlined text-[16px] text-[#7EC5B3]">mail</span> Email &amp; Password</>
                  ) : (
                    <><span className="material-symbols-outlined text-[16px] text-[#7EC5B3]">g_mobiledata</span> Google</>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">Member since</span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {user.metadata.creationTime
                    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : '—'}
                </span>
              </div>
            </div>
          </SectionCard>

          {/* ── Password ──────────────────────────────────── */}
          {emailUser ? (
            <SectionCard
              icon="lock"
              title="Change Password"
              subtitle="Use a strong password you don't use elsewhere."
            >
              <div className="flex flex-col gap-4">
                {/* Current password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      placeholder="Enter current password"
                      className="h-11 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 pr-10 text-slate-900 dark:text-white focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">{showPwd ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="h-11 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all text-sm"
                  />
                  {/* Strength bar */}
                  {newPwd.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {[8, 12, 16].map((threshold, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            newPwd.length >= threshold
                              ? i === 0 ? 'bg-red-400' : i === 1 ? 'bg-[#F3B557]' : 'bg-[#7EC5B3]'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm New Password</label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="Repeat new password"
                    className={`h-11 rounded-lg border bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:ring-1 outline-none transition-all text-sm ${
                      confirmPwd && confirmPwd !== newPwd
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
                        : 'border-slate-300 dark:border-slate-600 focus:border-[#7EC5B3] focus:ring-[#7EC5B3]'
                    }`}
                  />
                  {confirmPwd && confirmPwd !== newPwd && (
                    <p className="text-xs text-red-500">Passwords do not match.</p>
                  )}
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={pwdLoading || !currentPwd || !newPwd || newPwd !== confirmPwd}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#183B68] hover:bg-[#1a4480] disabled:opacity-50 text-white px-6 py-2.5 font-bold text-sm transition-all shadow-sm mt-1 w-full md:w-auto self-start"
                >
                  {pwdLoading ? (
                    <><span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span> Updating…</>
                  ) : (
                    <><span className="material-symbols-outlined text-[16px]">lock_reset</span> Update Password</>
                  )}
                </button>
              </div>
            </SectionCard>
          ) : (
            <SectionCard icon="lock" title="Password" subtitle="You signed in with Google — password management is handled by your Google account.">
              <a
                href="https://myaccount.google.com/security"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#183B68] dark:text-[#7EC5B3] hover:underline"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                Manage Google Account Security
              </a>
            </SectionCard>
          )}

          {/* ── Notifications ─────────────────────────────── */}
          <SectionCard
            icon="notifications"
            title="Email Notifications"
            subtitle="Control what emails you receive from YouthToPro."
          >
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <Toggle
                checked={notifs.mentorMessages}
                onChange={(v) => setNotifs((n) => ({ ...n, mentorMessages: v }))}
                label="Mentor Messages"
                desc="Get notified when your mentor sends you a message."
              />
              <Toggle
                checked={notifs.sessionReminders}
                onChange={(v) => setNotifs((n) => ({ ...n, sessionReminders: v }))}
                label="Session Reminders"
                desc="Reminders before your scheduled mentoring sessions."
              />
              <Toggle
                checked={notifs.weeklyDigest}
                onChange={(v) => setNotifs((n) => ({ ...n, weeklyDigest: v }))}
                label="Weekly Progress Digest"
                desc="A summary of your module progress every week."
              />
              <Toggle
                checked={notifs.progressUpdates}
                onChange={(v) => setNotifs((n) => ({ ...n, progressUpdates: v }))}
                label="Achievement Badges"
                desc="Celebrate module completions with a notification."
              />
            </div>
            <button
              onClick={handleSaveNotifs}
              className="mt-5 flex items-center gap-2 rounded-xl bg-[#183B68] hover:bg-[#1a4480] text-white px-6 py-2.5 font-bold text-sm transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              Save Preferences
            </button>
          </SectionCard>

          {/* ── Danger zone ───────────────────────────────── */}
          <div className="bg-white dark:bg-[#15202b] rounded-2xl border border-red-200 dark:border-red-900/40 shadow-sm p-6 mb-8">
            <div className="flex items-start gap-3 mb-4">
              <span className="material-symbols-outlined text-[22px] text-red-500 mt-0.5">warning</span>
              <div>
                <h2 className="text-base font-bold text-red-600 dark:text-red-400">Danger Zone</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Permanently delete your account and all associated data. This cannot be undone.
                </p>
              </div>
            </div>

            {!showDeleteZone ? (
              <button
                onClick={() => setShowDeleteZone(true)}
                className="flex items-center gap-2 rounded-xl border border-red-400 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-5 py-2.5 font-bold text-sm transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                Delete My Account
              </button>
            ) : (
              <div className="flex flex-col gap-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                  To confirm, type <strong>DELETE</strong> below:
                </p>
                <input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="h-10 rounded-lg border border-red-300 dark:border-red-800 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:outline-none focus:border-red-500 text-sm"
                />
                {emailUser && (
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="h-10 rounded-lg border border-red-300 dark:border-red-800 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:outline-none focus:border-red-500 text-sm"
                  />
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
                    className="flex items-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-5 py-2.5 font-bold text-sm transition-all"
                  >
                    {deleteLoading
                      ? <><span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span> Deleting…</>
                      : <><span className="material-symbols-outlined text-[16px]">delete_forever</span> Confirm Delete</>
                    }
                  </button>
                  <button
                    onClick={() => { setShowDeleteZone(false); setDeleteConfirmText(''); setDeletePassword(''); }}
                    className="rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 px-5 py-2.5 font-bold text-sm transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
