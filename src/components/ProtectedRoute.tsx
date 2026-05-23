import React from 'react';
import { Navigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { UserProfile } from '../lib/firebase';

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f6f7f8]">
      <span className="material-symbols-outlined animate-spin text-[40px] text-[#7EC5B3]">
        progress_activity
      </span>
    </div>
  );
}

interface RouteProps {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  children: React.ReactNode;
}

export function ApprovedRoute({ user, profile, loading, children }: RouteProps) {
  if (loading) return <Spinner />;
  if (!user || !profile) return <Navigate to="/" replace />;
  if (profile.status !== 'approved') return <Navigate to="/pending" replace />;
  return <>{children}</>;
}

export function AdminRoute({ user, profile, loading, children }: RouteProps) {
  if (loading) return <Spinner />;
  if (!user || !profile) return <Navigate to="/" replace />;
  if (profile.role !== 'admin' && profile.role !== 'superadmin') {
    return <Navigate to="/modules" replace />;
  }
  return <>{children}</>;
}
