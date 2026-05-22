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
  collection,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const ADMIN_EMAIL = 'dimakandalaft@gmail.com';

// ── Types ────────────────────────────────────────────────────────────────────

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
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
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

// ── Firestore: approval flow ─────────────────────────────────────────────────

/** Create user doc on first sign-in. Admin email is auto-approved. */
export const createUserDoc = async (user: User) => {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? '',
      status: user.email === ADMIN_EMAIL ? 'approved' : 'pending',
      createdAt: serverTimestamp(),
    });
  }
};

/** Real-time listener for a single user's approval status. */
export const subscribeUserStatus = (
  uid: string,
  callback: (status: 'pending' | 'approved' | 'rejected') => void
) =>
  onSnapshot(doc(db, 'users', uid), (snap) => {
    if (snap.exists()) callback(snap.data().status);
  });

/** Real-time listener for all users (admin panel). */
export const subscribeAllUsers = (callback: (users: UserRecord[]) => void) => {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as UserRecord));
  });
};

/** Approve or reject a user. */
export const updateUserStatus = async (uid: string, status: 'approved' | 'rejected') => {
  await updateDoc(doc(db, 'users', uid), { status });
};
