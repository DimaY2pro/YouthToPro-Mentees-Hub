import {
  initializeApp
} from 'firebase/app';
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
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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

export const changePassword = async (
  currentPassword: string,
  newPassword: string
) => {
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

export const isEmailUser = () => {
  return auth.currentUser?.providerData.some(
    (p) => p.providerId === 'password'
  ) ?? false;
};
