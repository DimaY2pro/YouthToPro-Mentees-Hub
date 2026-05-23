import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  where,
  limit,
  serverTimestamp,
  onSnapshot,
  writeBatch,
  getDocs,
  addDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const ADMIN_EMAIL = 'dimakandalaft@gmail.com';

// ── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'mentee' | 'admin' | 'superadmin';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  provider: string;
  status: UserStatus;
  role: UserRole;
  createdAt: any;
  approvedAt: any | null;
  approvedBy: string | null;
  rejectedReason: string | null;
}

export interface AdminLog {
  id: string;
  action: string;
  targetUid: string;
  targetEmail: string;
  performedBy: string;
  performedAt: any;
  note: string | null;
}

// Keep for backward compat with existing Admin.tsx
export interface UserRecord {
  uid: string;
  email: string;
  displayName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

// ── Auth: Sign in / Register ─────────────────────────────────────────────────

export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const registerWithEmail = async (
  email: string,
  password: string,
  displayName?: string
) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(result.user, { displayName });
  return result.user;
};

export const loginWithEmail = async (email: string, password: string) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const logout = async () => {
  await signOut(auth);
};

// ── Auth: Profile updates ────────────────────────────────────────────────────

export const updateDisplayName = async (displayName: string) => {
  if (!auth.currentUser) throw new Error('No authenticated user.');
  await updateProfile(auth.currentUser, { displayName });
};

// ── Auth: Password management ────────────────────────────────────────────────

export const sendPasswordReset = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('No authenticated user.');
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};

// ── Auth: Account deletion ───────────────────────────────────────────────────

export const deleteAccount = async (currentPassword?: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user.');
  if (currentPassword && user.email) {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
  }
  await deleteUser(user);
};

// ── Helpers ──────────────────────────────────────────────────────────────────

export const isEmailUser = () =>
  auth.currentUser?.providerData.some((p) => p.providerId === 'password') ?? false;

// ── Firestore: profile creation ──────────────────────────────────────────────

const buildInitialProfile = (user: User) => {
  const isSuperAdmin = user.email === ADMIN_EMAIL;
  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? '',
    photoURL: user.photoURL ?? null,
    provider: user.providerData[0]?.providerId ?? 'password',
    status: isSuperAdmin ? 'approved' : 'pending',
    role: isSuperAdmin ? 'superadmin' : 'mentee',
    createdAt: serverTimestamp(),
    approvedAt: isSuperAdmin ? serverTimestamp() : null,
    approvedBy: isSuperAdmin ? 'system' : null,
    rejectedReason: null,
  };
};

/** Create user profile doc on first sign-in. Admin email is auto-approved as superadmin. */
export const createUserDoc = async (user: User) => {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, buildInitialProfile(user));
  }
};

/** Register with email + password and create Firestore profile. */
export const registerAndCreateProfile = async (
  email: string,
  password: string,
  displayName?: string
) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(result.user, { displayName });
  await createUserDoc(result.user);
  return result.user;
};

/** Google sign-in and create Firestore profile if new user. */
export const googleSignInAndCreateProfile = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  await createUserDoc(result.user);
  return result.user;
};

// ── Firestore: profile reads ──────────────────────────────────────────────────

const docToProfile = (uid: string, data: any): UserProfile => ({
  uid: data.uid ?? uid,
  email: data.email ?? '',
  displayName: data.displayName ?? '',
  photoURL: data.photoURL ?? null,
  provider: data.provider ?? 'password',
  status: data.status ?? 'pending',
  role: data.role ?? 'mentee',
  createdAt: data.createdAt ?? null,
  approvedAt: data.approvedAt ?? null,
  approvedBy: data.approvedBy ?? null,
  rejectedReason: data.rejectedReason ?? null,
});

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return docToProfile(uid, snap.data());
};

export const subscribeUserProfile = (
  uid: string,
  callback: (profile: UserProfile | null) => void
) =>
  onSnapshot(doc(db, 'users', uid), (snap) => {
    callback(snap.exists() ? docToProfile(uid, snap.data()) : null);
  });

// Legacy status listener kept for backward compat
export const subscribeUserStatus = (
  uid: string,
  callback: (status: 'pending' | 'approved' | 'rejected') => void
) =>
  onSnapshot(doc(db, 'users', uid), (snap) => {
    if (snap.exists()) callback(snap.data().status);
  });

// ── Firestore: admin reads ────────────────────────────────────────────────────

export const subscribeAllUsers = (callback: (users: UserRecord[]) => void) => {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as UserRecord));
  });
};

export const subscribeAllProfiles = (callback: (users: UserProfile[]) => void) => {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => docToProfile(d.id, d.data())));
  });
};

// ── Firestore: admin actions ──────────────────────────────────────────────────

// Audit log is fire-and-forget so it never blocks the main operation
const writeLog = (
  action: string,
  targetUid: string,
  targetEmail: string,
  performedBy: string,
  note?: string
) => {
  addDoc(collection(db, 'adminLogs'), {
    action,
    targetUid,
    targetEmail,
    performedBy,
    performedAt: serverTimestamp(),
    note: note ?? null,
  }).catch((e) => console.warn('Audit log write failed:', e));
};

export const approveUser = async (
  uid: string,
  email: string,
  performedBy: string,
  note?: string
) => {
  await updateDoc(doc(db, 'users', uid), {
    status: 'approved',
    approvedAt: serverTimestamp(),
    approvedBy: performedBy,
    rejectedReason: null,
  });
  writeLog('approve', uid, email, performedBy, note);
};

export const rejectUser = async (
  uid: string,
  email: string,
  performedBy: string,
  reason: string
) => {
  await updateDoc(doc(db, 'users', uid), {
    status: 'rejected',
    rejectedReason: reason,
    approvedAt: null,
    approvedBy: null,
  });
  writeLog('reject', uid, email, performedBy, reason);
};

export const revokeAccess = async (
  uid: string,
  email: string,
  performedBy: string,
  reason?: string
) => {
  await updateDoc(doc(db, 'users', uid), {
    status: 'pending',
    approvedAt: null,
    approvedBy: null,
  });
  writeLog('revoke', uid, email, performedBy, reason);
};

export const deleteUserDoc = async (
  uid: string,
  email: string,
  performedBy: string
) => {
  await deleteDoc(doc(db, 'users', uid));
  writeLog('delete', uid, email, performedBy);
};

export const makeAdmin = async (
  uid: string,
  email: string,
  performedBy: string
) => {
  await updateDoc(doc(db, 'users', uid), { role: 'admin' });
  writeLog('make_admin', uid, email, performedBy);
};

export const removeAdmin = async (
  uid: string,
  email: string,
  performedBy: string
) => {
  await updateDoc(doc(db, 'users', uid), { role: 'mentee' });
  writeLog('remove_admin', uid, email, performedBy);
};

export const demoteSuperAdmin = async (
  uid: string,
  email: string,
  performedBy: string
) => {
  await updateDoc(doc(db, 'users', uid), { role: 'admin' });
  writeLog('demote_superadmin', uid, email, performedBy);
};

// Legacy — kept for existing Admin.tsx
export const updateUserStatus = async (uid: string, status: 'approved' | 'rejected') => {
  await updateDoc(doc(db, 'users', uid), { status });
};

// ── Firestore: audit logs ─────────────────────────────────────────────────────

export const subscribeAdminLogs = (callback: (logs: AdminLog[]) => void) => {
  const q = query(collection(db, 'adminLogs'), orderBy('performedAt', 'desc'), limit(50));
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminLog))
    );
  });
};

// ── Firestore: superadmin bootstrap ──────────────────────────────────────────

export const checkSuperAdminExists = async (): Promise<boolean> => {
  const q = query(collection(db, 'users'), where('role', '==', 'superadmin'), limit(1));
  const snap = await getDocs(q);
  return !snap.empty;
};

export const bootstrapSuperAdmin = async (uid: string) => {
  // setDoc with merge so it works whether the doc exists or not
  await setDoc(doc(db, 'users', uid), {
    role: 'superadmin',
    status: 'approved',
    approvedAt: serverTimestamp(),
    approvedBy: 'bootstrap',
  }, { merge: true });
};

export const makeSuperAdmin = async (
  uid: string,
  email: string,
  performedBy: string
) => {
  await updateDoc(doc(db, 'users', uid), { role: 'superadmin', status: 'approved' });
  writeLog('make_superadmin', uid, email, performedBy);
};

// ── Firestore: Letter of Intent draft ────────────────────────────────────────

export interface LOIDraft {
  date: string;
  fullName: string;
  program: string;
  university: string;
  cityCountry: string;
  graduationMonth: string;
  graduationYear: string;
  enjoyed: string;
  challenging: string;
  industry: string;
  preferredLocations: string;
  careerGoals: string;
  skills: string;
  challenges: string[];
  expectations: string[];
  availability: string;
  mobile: string;
  whatsapp: string;
  email: string;
  aiPolishedVersion: string | null;
  lastSaved: any;
}

export const saveLOIDraft = async (uid: string, draft: Omit<LOIDraft, 'lastSaved'>) => {
  await setDoc(
    doc(db, 'users', uid, 'loi_drafts', 'current'),
    { ...draft, lastSaved: serverTimestamp() },
    { merge: true },
  );
};

export const loadLOIDraft = async (uid: string): Promise<LOIDraft | null> => {
  const snap = await getDoc(doc(db, 'users', uid, 'loi_drafts', 'current'));
  if (!snap.exists()) return null;
  return snap.data() as LOIDraft;
};
