import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { subscribeUserProfile, UserProfile } from '../lib/firebase';

export function useUserProfile(user: User | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeUserProfile(user.uid, (p) => {
      setProfile(p);
      setLoading(false);
    });
    return unsub;
  }, [user?.uid]);

  return { profile, loading };
}
