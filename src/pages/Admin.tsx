import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import {
  logout,
  subscribeAllUsers,
  updateUserStatus,
  UserRecord,
  ADMIN_EMAIL,
} from '../lib/firebase';

interface Props {
  user: User | null;
}

type Filter = 'pending' | 'all' | 'approved' | 'rejected';

export default function Admin({ user }: Props) {
  const [users, setUsers]               = useState<UserRecord[]>([]);
  const [filter, setFilter]             = useState<Filter>('pending');
  const [dataLoading, setDataLoading]   = useState(true);
  const [actionKey, setActionKey]       = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = subscribeAllUsers((u) => {
      setUsers(u);
      setDataLoading(false);
    });
    return unsub;
  }, []);

  if (!user || user.email !== ADMIN_EMAIL) return <Navigate to="/" replace />;

  const counts = {
    all:      users.length,
    pending:  users.filter((u) => u.status === 'pending').length,
    approved: users.filter((u) => u.status === 'approved').length,
    rejected: users.filter((u) => u.status === 'rejected').length,
  };

  const filtered = filter === 'all' ? users : users.filter((u) => u.status === filter);

  const handleAction = async (uid: string, status: 'approved' | 'rejected') => {
    const key = uid + status;
    setActionKey(key);
    try { await updateUserStatus(uid, status); }
    finally { setActionKey(null); }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8]">

      {/* ── Header ────────────────────────────────────────── */}
      <header className="bg-[#183B68] text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-[#F3B557]/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#F3B557] text-[20px]">admin_panel_settings</span>
          </div>
          <div>
            <h1 className="font-black text-base leading-tight">YouthToPro Admin</h1>
            <p className="text-white/50 text-xs">Mentee access management</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/50 text-xs hidden md:block">{user.email}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-white/70 hover:text-red-400 text-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span className="hidden md:inline">Log Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">

        {/* Page title + pending badge */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-[#183B68]">User Applications</h2>
            <p className="text-slate-500 text-sm mt-1">Review and approve mentee access requests.</p>
          </div>
          {counts.pending > 0 && (
            <div className="flex items-center gap-1.5 bg-[#F3B557]/20 text-[#b8862a] px-3 py-1.5 rounded-full text-xs font-bold">
              <span className="material-symbols-outlined text-[14px]">notifications_active</span>
              {counts.pending} pending
            </div>
          )}
        </div>

        {/* ── Filter tabs ──────────────────────────────────── */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['pending', 'all', 'approved', 'rejected'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                filter === f
                  ? 'bg-[#183B68] text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-[#183B68]/40'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                filter === f ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* ── User list ────────────────────────────────────── */}
        {dataLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-[36px] text-[#7EC5B3]">progress_activity</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center">
            <span className="material-symbols-outlined text-[48px] text-slate-200">person_search</span>
            <p className="text-slate-400 text-sm mt-3">
              No {filter === 'all' ? '' : filter + ' '}users yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((u) => (
              <UserRow
                key={u.uid}
                record={u}
                actionKey={actionKey}
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ── User row ──────────────────────────────────────────────────────────────────

function UserRow({ record, actionKey, onAction }: {
  record: UserRecord;
  actionKey: string | null;
  onAction: (uid: string, status: 'approved' | 'rejected') => void;
}) {
  const initials = record.displayName
    ? record.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : (record.email?.[0] ?? 'U').toUpperCase();

  const createdAt = record.createdAt?.toDate?.()
    ? new Date(record.createdAt.toDate()).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : '—';

  const statusBadge = {
    pending:  'bg-[#F3B557]/15 text-[#b8862a]',
    approved: 'bg-[#7EC5B3]/20 text-[#2d7a6b]',
    rejected: 'bg-red-100 text-red-600',
  }[record.status];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-4">

      {/* Avatar */}
      <div className="size-11 rounded-full bg-[#183B68] flex items-center justify-center text-[#F3B557] font-black text-sm shrink-0">
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[#183B68] text-sm truncate">
          {record.displayName || <span className="text-slate-400 font-normal italic">No name</span>}
        </p>
        <p className="text-slate-500 text-xs truncate">{record.email}</p>
        <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">calendar_today</span>
          {createdAt}
        </p>
      </div>

      {/* Status badge */}
      <span className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${statusBadge}`}>
        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
      </span>

      {/* Action buttons */}
      <div className="flex gap-2 shrink-0">
        {record.status !== 'approved' && (
          <button
            onClick={() => onAction(record.uid, 'approved')}
            disabled={!!actionKey}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#7EC5B3]/20 hover:bg-[#7EC5B3]/40 text-[#2d7a6b] font-bold text-xs transition-all disabled:opacity-50"
          >
            {actionKey === record.uid + 'approved' ? (
              <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
            )}
            Approve
          </button>
        )}
        {record.status !== 'rejected' && (
          <button
            onClick={() => onAction(record.uid, 'rejected')}
            disabled={!!actionKey}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 font-bold text-xs transition-all disabled:opacity-50"
          >
            {actionKey === record.uid + 'rejected' ? (
              <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[14px]">cancel</span>
            )}
            Reject
          </button>
        )}
        {record.status === 'approved' && (
          <button
            onClick={() => onAction(record.uid, 'rejected')}
            disabled={!!actionKey}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500 font-bold text-xs transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[14px]">block</span>
            Revoke
          </button>
        )}
      </div>
    </div>
  );
}
