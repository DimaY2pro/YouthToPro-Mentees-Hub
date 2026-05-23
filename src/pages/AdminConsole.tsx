import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import {
  UserProfile,
  AdminLog,
  subscribeAllProfiles,
  subscribeAdminLogs,
  approveUser,
  rejectUser,
  revokeAccess,
  deleteUserDoc,
  makeAdmin,
  makeSuperAdmin,
  removeAdmin,
  demoteSuperAdmin,
} from '../lib/firebase';
import AdminSidebar from '../components/AdminSidebar';

// ── Toast ─────────────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

let toastId = 0;

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto max-w-sm ${
            t.type === 'success' ? 'bg-[#7EC5B3] text-white'
            : t.type === 'error'   ? 'bg-red-500 text-white'
            : 'bg-[#183B68] text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'info'}
          </span>
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="opacity-70 hover:opacity-100">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Reject modal ──────────────────────────────────────────────────────────────

function RejectModal({
  target,
  onConfirm,
  onCancel,
  loading,
}: {
  target: { uid: string; email: string; displayName: string };
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-md w-full">
        <h3 className="text-lg font-black text-[#183B68] mb-1">Reject Application</h3>
        <p className="text-slate-500 text-sm mb-4">
          Rejecting <span className="font-bold text-slate-700">{target.displayName || target.email}</span>. Provide a reason (required).
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Application incomplete, not eligible at this time…"
          rows={3}
          className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] resize-none mb-4"
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={!reason.trim() || loading}
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>}
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stats card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`size-12 rounded-xl flex items-center justify-center ${color}`}>
        <span className="material-symbols-outlined text-[22px] text-white">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-black text-[#183B68]">{value}</p>
        <p className="text-slate-500 text-xs font-medium">{label}</p>
      </div>
    </div>
  );
}

// ── User row actions ──────────────────────────────────────────────────────────

function ActionBtn({
  icon, label, onClick, disabled, variant = 'neutral',
}: {
  icon: string; label: string; onClick: () => void; disabled?: boolean;
  variant?: 'green' | 'red' | 'yellow' | 'neutral' | 'outline';
}) {
  const cls = {
    green:   'bg-[#7EC5B3]/20 hover:bg-[#7EC5B3]/40 text-[#2d7a6b]',
    red:     'bg-red-50 hover:bg-red-100 text-red-600',
    yellow:  'bg-[#F3B557]/15 hover:bg-[#F3B557]/30 text-[#b8862a]',
    neutral: 'bg-slate-100 hover:bg-slate-200 text-slate-600',
    outline: 'border border-slate-200 hover:border-red-300 hover:text-red-500 text-slate-400',
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 ${cls}`}
    >
      <span className="material-symbols-outlined text-[14px]">{icon}</span>
      {label}
    </button>
  );
}

// ── User card ─────────────────────────────────────────────────────────────────

function UserCard({
  u, currentUid, isSuperAdmin, actionKey, onApprove, onRejectClick, onRevoke, onDelete, onMakeAdmin, onMakeSuperAdmin, onRemoveAdmin, onDemote,
}: {
  u: UserProfile;
  currentUid: string;
  isSuperAdmin: boolean;
  actionKey: string | null;
  onApprove: (u: UserProfile) => void;
  onRejectClick: (u: UserProfile) => void;
  onRevoke: (u: UserProfile) => void;
  onDelete: (u: UserProfile) => void;
  onMakeAdmin: (u: UserProfile) => void;
  onMakeSuperAdmin: (u: UserProfile) => void;
  onRemoveAdmin: (u: UserProfile) => void;
  onDemote: (u: UserProfile) => void;
}) {
  const isLoading = actionKey === u.uid;
  const isSelf = u.uid === currentUid;

  const initials = u.displayName
    ? u.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : (u.email?.[0] ?? 'U').toUpperCase();

  const statusBadge = {
    pending:  'bg-[#F3B557]/15 text-[#b8862a]',
    approved: 'bg-[#7EC5B3]/20 text-[#2d7a6b]',
    rejected: 'bg-red-100 text-red-600',
  }[u.status];

  const roleBadge = {
    mentee:     '',
    admin:      'bg-[#183B68]/10 text-[#183B68]',
    superadmin: 'bg-[#F3B557]/20 text-[#b8862a]',
  }[u.role];

  const createdAt = u.createdAt?.toDate?.()
    ? new Date(u.createdAt.toDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-start gap-3">
        <div className="size-11 rounded-full bg-[#183B68] flex items-center justify-center text-[#F3B557] font-black text-sm shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-[#183B68] text-sm truncate">
              {u.displayName || <span className="text-slate-400 font-normal italic">No name</span>}
            </p>
            {u.role !== 'mentee' && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${roleBadge}`}>
                {u.role === 'superadmin' ? 'Super Admin' : 'Admin'}
              </span>
            )}
            {isSelf && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">You</span>
            )}
          </div>
          <p className="text-slate-500 text-xs truncate">{u.email}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${statusBadge}`}>
              {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
            </span>
            <span className="text-slate-400 text-xs flex items-center gap-1">
              <span className="material-symbols-outlined text-[11px]">calendar_today</span>
              {createdAt}
            </span>
          </div>
          {u.rejectedReason && (
            <p className="text-xs text-red-500 mt-1 italic truncate">Reason: {u.rejectedReason}</p>
          )}
        </div>
        {isLoading && (
          <span className="material-symbols-outlined animate-spin text-[20px] text-[#7EC5B3] shrink-0">progress_activity</span>
        )}
      </div>

      {/* Actions */}
      {!isSelf && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
          {u.status !== 'approved' && (
            <ActionBtn icon="check_circle" label="Approve" variant="green" disabled={!!actionKey} onClick={() => onApprove(u)} />
          )}
          {u.status === 'approved' && (
            <ActionBtn icon="block" label="Revoke" variant="outline" disabled={!!actionKey} onClick={() => onRevoke(u)} />
          )}
          {u.status !== 'rejected' && (
            <ActionBtn icon="cancel" label="Reject" variant="red" disabled={!!actionKey} onClick={() => onRejectClick(u)} />
          )}
          {u.status === 'rejected' && (
            <ActionBtn icon="refresh" label="Re-Review" variant="yellow" disabled={!!actionKey} onClick={() => onRevoke(u)} />
          )}
          {isSuperAdmin && u.role === 'mentee' && u.status === 'approved' && (
            <ActionBtn icon="admin_panel_settings" label="Make Admin" variant="neutral" disabled={!!actionKey} onClick={() => onMakeAdmin(u)} />
          )}
          {isSuperAdmin && (u.role === 'mentee' || u.role === 'admin') && u.status === 'approved' && (
            <ActionBtn icon="verified_user" label="Make Super Admin" variant="yellow" disabled={!!actionKey} onClick={() => onMakeSuperAdmin(u)} />
          )}
          {isSuperAdmin && u.role === 'admin' && (
            <ActionBtn icon="person_remove" label="Remove Admin" variant="neutral" disabled={!!actionKey} onClick={() => onRemoveAdmin(u)} />
          )}
          {isSuperAdmin && u.role === 'superadmin' && (
            <ActionBtn icon="arrow_downward" label="Demote to Admin" variant="neutral" disabled={!!actionKey} onClick={() => onDemote(u)} />
          )}
          <ActionBtn icon="delete" label="Delete" variant="red" disabled={!!actionKey} onClick={() => onDelete(u)} />
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  user: User | null;
  profile: UserProfile | null;
  profileLoading: boolean;
}

export default function AdminConsole({ user, profile, profileLoading }: Props) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<UserProfile | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const dismissToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  useEffect(() => {
    const unsub = subscribeAllProfiles((users) => {
      setAllUsers(users);
      setDataLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeAdminLogs(setLogs);
    return unsub;
  }, []);

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f6f7f8]">
        <span className="material-symbols-outlined animate-spin text-[40px] text-[#7EC5B3]">progress_activity</span>
      </div>
    );
  }

  if (!user || !profile) return <Navigate to="/" replace />;
  if (profile.role !== 'admin' && profile.role !== 'superadmin') return <Navigate to="/modules" replace />;

  const isSuperAdmin = profile.role === 'superadmin';
  const performedBy = profile.email;

  // ── Action handlers ──────────────────────────────────────────────────────

  const withAction = async (uid: string, fn: () => Promise<void>, successMsg: string) => {
    setActionKey(uid);
    try {
      await fn();
      addToast('success', successMsg);
    } catch (e) {
      addToast('error', 'Action failed. Please try again.');
      console.error(e);
    } finally {
      setActionKey(null);
    }
  };

  const handleApprove = (u: UserProfile) =>
    withAction(u.uid, () => approveUser(u.uid, u.email, performedBy), `${u.displayName || u.email} approved.`);

  const handleRejectClick = (u: UserProfile) => setRejectTarget(u);

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTarget) return;
    setRejectLoading(true);
    try {
      await rejectUser(rejectTarget.uid, rejectTarget.email, performedBy, reason);
      addToast('success', `${rejectTarget.displayName || rejectTarget.email} rejected.`);
      setRejectTarget(null);
    } catch (e) {
      addToast('error', 'Rejection failed. Please try again.');
      console.error(e);
    } finally {
      setRejectLoading(false);
    }
  };

  const handleRevoke = (u: UserProfile) =>
    withAction(u.uid, () => revokeAccess(u.uid, u.email, performedBy), `Access revoked for ${u.email}.`);

  const handleDelete = (u: UserProfile) => {
    if (!window.confirm(
      `Remove ${u.email} from the Hub?\n\nThis deletes their profile and blocks access. Their login account remains in Firebase Auth — if they sign in again they will be placed back in "pending" status.`
    )) return;
    withAction(u.uid, () => deleteUserDoc(u.uid, u.email, performedBy), `${u.email} removed.`);
  };

  const handleMakeAdmin = (u: UserProfile) =>
    withAction(u.uid, () => makeAdmin(u.uid, u.email, performedBy), `${u.email} is now an Admin.`);

  const handleMakeSuperAdmin = (u: UserProfile) => {
    if (!window.confirm(`Grant Super Admin to ${u.email}?\n\nThey will have full admin powers including managing other admins.`)) return;
    withAction(u.uid, () => makeSuperAdmin(u.uid, u.email, performedBy), `${u.email} is now a Super Admin.`);
  };

  const handleRemoveAdmin = (u: UserProfile) =>
    withAction(u.uid, () => removeAdmin(u.uid, u.email, performedBy), `${u.email} admin role removed.`);

  const handleDemote = (u: UserProfile) => {
    if (!window.confirm(`Demote ${u.email} from Super Admin to Admin?`)) return;
    withAction(u.uid, () => demoteSuperAdmin(u.uid, u.email, performedBy), `${u.email} demoted to Admin.`);
  };

  // ── Derived data ─────────────────────────────────────────────────────────

  const counts = {
    total:    allUsers.length,
    pending:  allUsers.filter((u) => u.status === 'pending').length,
    approved: allUsers.filter((u) => u.status === 'approved').length,
    rejected: allUsers.filter((u) => u.status === 'rejected').length,
    admins:   allUsers.filter((u) => u.role === 'admin' || u.role === 'superadmin').length,
  };

  const pendingUsers = allUsers.filter((u) => u.status === 'pending');

  const filteredUsers = allUsers.filter((u) => {
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || u.email.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const adminUsers = allUsers.filter((u) => u.role === 'admin' || u.role === 'superadmin');

  const renderCard = (u: UserProfile) => (
    <React.Fragment key={u.uid}>
      <UserCard
        u={u}
        currentUid={user.uid}
        isSuperAdmin={isSuperAdmin}
        actionKey={actionKey}
        onApprove={handleApprove}
        onRejectClick={handleRejectClick}
        onRevoke={handleRevoke}
        onDelete={handleDelete}
        onMakeAdmin={handleMakeAdmin}
        onMakeSuperAdmin={handleMakeSuperAdmin}
        onRemoveAdmin={handleRemoveAdmin}
        onDemote={handleDemote}
      />
    </React.Fragment>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-[#f6f7f8] overflow-hidden">
      <AdminSidebar user={user} profile={profile} activeTab={tab} onTabChange={setTab} />

      <main className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="md:hidden bg-[#183B68] text-white px-4 py-3 flex items-center justify-between">
          <span className="font-black text-sm">Admin Console</span>
          <div className="flex gap-2">
            {(['dashboard','pending','users','admins','logs'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-2 py-1 rounded text-xs font-bold transition-colors ${tab === t ? 'bg-[#F3B557] text-[#183B68]' : 'text-white/60'}`}>
                {t.charAt(0).toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 max-w-4xl mx-auto">

          {/* ── Dashboard ─────────────────────────────────── */}
          {tab === 'dashboard' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-black text-[#183B68]">Dashboard</h2>
                <p className="text-slate-500 text-sm mt-1">Overview of all mentee applications.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <StatCard label="Total Users"       value={counts.total}    icon="group"               color="bg-[#183B68]" />
                <StatCard label="Pending Review"    value={counts.pending}  icon="hourglass_top"       color="bg-[#F3B557]" />
                <StatCard label="Approved"          value={counts.approved} icon="check_circle"        color="bg-[#7EC5B3]" />
                <StatCard label="Rejected"          value={counts.rejected} icon="cancel"              color="bg-red-400" />
                <StatCard label="Admins"            value={counts.admins}   icon="admin_panel_settings" color="bg-slate-500" />
              </div>
              {counts.pending > 0 && (
                <div
                  onClick={() => setTab('pending')}
                  className="bg-[#F3B557]/10 border border-[#F3B557]/30 rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:bg-[#F3B557]/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-[#F3B557] text-[28px]">notifications_active</span>
                  <div>
                    <p className="font-bold text-[#183B68] text-sm">{counts.pending} application{counts.pending > 1 ? 's' : ''} awaiting review</p>
                    <p className="text-slate-500 text-xs">Click to review pending users</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 text-[20px] ml-auto">chevron_right</span>
                </div>
              )}
            </div>
          )}

          {/* ── Pending ───────────────────────────────────── */}
          {tab === 'pending' && (
            <div>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-[#183B68]">Pending Applications</h2>
                  <p className="text-slate-500 text-sm mt-1">Review and approve new mentee requests.</p>
                </div>
                {counts.pending > 0 && (
                  <div className="flex items-center gap-1.5 bg-[#F3B557]/20 text-[#b8862a] px-3 py-1.5 rounded-full text-xs font-bold">
                    <span className="material-symbols-outlined text-[14px]">notifications_active</span>
                    {counts.pending} pending
                  </div>
                )}
              </div>
              {dataLoading ? (
                <div className="flex justify-center py-20">
                  <span className="material-symbols-outlined animate-spin text-[36px] text-[#7EC5B3]">progress_activity</span>
                </div>
              ) : pendingUsers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center">
                  <span className="material-symbols-outlined text-[48px] text-slate-200">how_to_reg</span>
                  <p className="text-slate-400 text-sm mt-3">No pending applications.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {pendingUsers.map(renderCard)}
                </div>
              )}
            </div>
          )}

          {/* ── All Users ─────────────────────────────────── */}
          {tab === 'users' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-black text-[#183B68]">All Users</h2>
                <p className="text-slate-500 text-sm mt-1">Search, filter, and manage all mentee accounts.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <span className="material-symbols-outlined text-[20px]">search</span>
                  </span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email…"
                    className="w-full h-10 pl-10 pr-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#7EC5B3] bg-white"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        statusFilter === f
                          ? 'bg-[#183B68] text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-[#183B68]/40'
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {dataLoading ? (
                <div className="flex justify-center py-20">
                  <span className="material-symbols-outlined animate-spin text-[36px] text-[#7EC5B3]">progress_activity</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 py-12 text-center">
                  <span className="material-symbols-outlined text-[48px] text-slate-200">person_search</span>
                  <p className="text-slate-400 text-sm mt-3">No users match your search.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredUsers.map(renderCard)}
                </div>
              )}
            </div>
          )}

          {/* ── Admin Team ────────────────────────────────── */}
          {tab === 'admins' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-black text-[#183B68]">Admin Team</h2>
                <p className="text-slate-500 text-sm mt-1">
                  {isSuperAdmin ? 'Grant or revoke admin access. Only you can manage this.' : 'Current admin team members.'}
                </p>
              </div>
              {adminUsers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 py-12 text-center">
                  <span className="material-symbols-outlined text-[48px] text-slate-200">admin_panel_settings</span>
                  <p className="text-slate-400 text-sm mt-3">No admins configured yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {adminUsers.map(renderCard)}
                </div>
              )}
              {isSuperAdmin && (
                <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-bold text-[#183B68] text-sm mb-2">Grant Admin to Approved User</h3>
                  <p className="text-slate-500 text-xs mb-3">Find an approved mentee in the All Users tab and use "Make Admin".</p>
                  <button
                    onClick={() => setTab('users')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#183B68] text-white text-sm font-bold hover:bg-[#183B68]/90 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">group</span>
                    Go to All Users
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Audit Logs ────────────────────────────────── */}
          {tab === 'logs' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-black text-[#183B68]">Audit Logs</h2>
                <p className="text-slate-500 text-sm mt-1">Last 50 admin actions, most recent first.</p>
              </div>
              {logs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 py-12 text-center">
                  <span className="material-symbols-outlined text-[48px] text-slate-200">receipt_long</span>
                  <p className="text-slate-400 text-sm mt-3">No admin actions recorded yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {logs.map((log) => {
                    const actionColor: Record<string, string> = {
                      approve:      'bg-[#7EC5B3]/20 text-[#2d7a6b]',
                      reject:       'bg-red-100 text-red-600',
                      revoke:       'bg-[#F3B557]/15 text-[#b8862a]',
                      delete:       'bg-red-100 text-red-600',
                      make_admin:   'bg-[#183B68]/10 text-[#183B68]',
                      remove_admin: 'bg-slate-100 text-slate-600',
                    };
                    const ts = log.performedAt?.toDate?.()
                      ? new Date(log.performedAt.toDate()).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '—';
                    return (
                      <div key={log.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-black shrink-0 ${actionColor[log.action] ?? 'bg-slate-100 text-slate-500'}`}>
                          {log.action.replace('_', ' ').toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800 truncate">{log.targetEmail}</p>
                          {log.note && <p className="text-xs text-slate-500 italic truncate">{log.note}</p>}
                          <p className="text-xs text-slate-400 mt-0.5">by {log.performedBy} · {ts}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          target={rejectTarget}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
          loading={rejectLoading}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
