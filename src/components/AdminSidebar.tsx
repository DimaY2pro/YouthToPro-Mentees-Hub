import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { logout, UserProfile } from '../lib/firebase';

interface AdminSidebarProps {
  user: User;
  profile: UserProfile;
}

const navItems = [
  { tab: 'dashboard', icon: 'dashboard',            label: 'Dashboard'   },
  { tab: 'pending',   icon: 'hourglass_top',        label: 'Pending'     },
  { tab: 'users',     icon: 'group',                label: 'All Users'   },
  { tab: 'admins',    icon: 'admin_panel_settings', label: 'Admin Team'  },
  { tab: 'logs',      icon: 'receipt_long',         label: 'Audit Logs'  },
];

interface Props extends AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function AdminSidebar({ user, profile, activeTab, onTabChange }: Props) {
  const navigate = useNavigate();

  const initials = profile.displayName
    ? profile.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : (profile.email?.[0] ?? 'A').toUpperCase();

  const roleLabel = profile.role === 'superadmin'
    ? 'Super Admin'
    : profile.role === 'admin'
    ? 'Admin'
    : 'Mentee';

  const handleLogout = async () => {
    try { await logout(); } catch (e) { console.error(e); }
    navigate('/');
  };

  return (
    <aside className="hidden md:flex w-64 bg-[#183B68] flex-col justify-between h-full p-4 shrink-0 text-white">
      {/* Header */}
      <div className="flex flex-col gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 pb-4 border-b border-white/10">
          <div className="size-9 rounded-lg bg-[#F3B557]/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#F3B557] text-[20px]">admin_panel_settings</span>
          </div>
          <div>
            <p className="text-white font-black text-sm leading-tight">Admin Console</p>
            <p className="text-white/40 text-xs">YouthToPro Hub</p>
          </div>
        </div>

        {/* Admin info */}
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName ?? 'avatar'}
              className="size-11 rounded-full ring-2 ring-white/20 object-cover shrink-0"
            />
          ) : (
            <div className="size-11 rounded-full ring-2 ring-white/20 bg-[#F3B557] flex items-center justify-center text-[#183B68] font-bold text-base shrink-0">
              {initials}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-white text-sm font-bold truncate">
              {profile.displayName || profile.email.split('@')[0]}
            </span>
            <span className="text-[#F3B557] text-xs font-medium">{roleLabel}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          {navItems.map(({ tab, icon, label }) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group w-full text-left ${
                  isActive ? 'bg-[#F3B557] text-[#183B68]' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] transition-colors ${
                  isActive ? 'text-[#183B68]' : 'text-white/60 group-hover:text-[#F3B557]'
                }`}>
                  {icon}
                </span>
                <span className="text-sm font-medium">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Back to app */}
        <Link
          to="/modules"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:bg-white/10 transition-colors group text-sm"
        >
          <span className="material-symbols-outlined text-[20px] text-white/40 group-hover:text-white transition-colors">
            arrow_back
          </span>
          Back to App
        </Link>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 transition-colors group w-full text-left mt-4"
      >
        <span className="material-symbols-outlined text-[20px] text-white/60 group-hover:text-red-400 transition-colors">
          logout
        </span>
        <span className="text-sm font-medium">Log Out</span>
      </button>
    </aside>
  );
}
