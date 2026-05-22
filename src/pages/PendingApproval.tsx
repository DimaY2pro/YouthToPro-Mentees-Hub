import { Navigate, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { logout } from '../lib/firebase';

type UserStatus = 'loading' | 'pending' | 'approved' | 'rejected' | null;

interface Props {
  user: User | null;
  userStatus: UserStatus;
}

export default function PendingApproval({ user, userStatus }: Props) {
  const navigate = useNavigate();

  if (!user) return <Navigate to="/" replace />;
  if (userStatus === 'loading') return (
    <div className="flex items-center justify-center min-h-screen bg-[#f6f7f8]">
      <span className="material-symbols-outlined animate-spin text-[40px] text-[#7EC5B3]">progress_activity</span>
    </div>
  );
  if (userStatus === 'approved') return <Navigate to="/modules" replace />;

  const rejected = userStatus === 'rejected';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center">

        {/* Icon */}
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
            : "Thanks for signing up! A YouthToPro admin will review your application and grant access shortly. This page will update automatically once you're approved — no need to refresh."
          }
        </p>

        {/* Email chip */}
        <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 mb-8">
          <span className="material-symbols-outlined text-[16px] text-[#7EC5B3]">mail</span>
          {user.email}
        </div>

        {!rejected && (
          <div className="flex items-center gap-2 justify-center text-xs text-slate-400 mb-6">
            <span className="material-symbols-outlined text-[14px] text-[#7EC5B3]">wifi</span>
            Listening for approval in real-time…
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
