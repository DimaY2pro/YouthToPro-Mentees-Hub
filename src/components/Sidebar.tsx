import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { logout, UserProfile } from '../lib/firebase';

interface SidebarProps {
  user: User;
  profile?: UserProfile | null;
}

const baseNavItems = [
  { to: '/',        icon: 'home',     label: 'Home'            },
  { to: '/modules', icon: 'work',     label: 'Career Modules'  },
  { to: '/profile', icon: 'person',   label: 'My Profile'      },
  { to: '/settings',icon: 'settings', label: 'Account Settings'},
];

const adminNavItem = { to: '/admin-console', icon: 'admin_panel_settings', label: 'Admin Console' };

export default function Sidebar({ user, profile }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
  const navItems = isAdmin ? [...baseNavItems, adminNavItem] : baseNavItems;

  const initials = user.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user.email?.[0] ?? 'M').toUpperCase();

  const roleLabel = profile?.role === 'superadmin'
    ? 'Super Admin · YouthToPro'
    : profile?.role === 'admin'
    ? 'Admin · YouthToPro'
    : 'Mentee · YouthToPro';

  const handleLogout = async () => {
    try { await logout(); } catch (e) { console.error(e); }
    navigate('/');
  };

  return (
    <aside className="hidden md:flex w-64 bg-[#183B68] flex-col justify-between h-full p-4 shrink-0 text-white">
      {/* ── User info ───────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName ?? 'avatar'}
              className="size-12 rounded-full ring-2 ring-white/20 object-cover shrink-0"
            />
          ) : (
            <div className="size-12 rounded-full ring-2 ring-white/20 bg-[#F3B557] flex items-center justify-center text-[#183B68] font-bold text-lg shrink-0">
              {initials}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-white text-sm font-bold truncate">
              {user.displayName ?? user.email?.split('@')[0] ?? 'Mentee'}
            </span>
            <span className="text-white/60 text-xs">{roleLabel}</span>
          </div>
        </div>

        {/* ── Navigation ──────────────────────────────────── */}
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, icon, label }) => {
            const isActive = to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                  isActive ? 'bg-[#F3B557] text-[#183B68]' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] transition-colors ${
                  isActive ? 'text-[#183B68]' : 'text-white/60 group-hover:text-[#F3B557]'
                }`}>
                  {icon}
                </span>
                <span className="text-sm font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Logout ────────────────────────────────────────── */}
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
