/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  auth,
  loginWithGoogle,
  logout,
  registerWithEmail,
  loginWithEmail,
  sendPasswordReset,
} from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import Privacy          from './pages/Privacy';
import Terms            from './pages/Terms';
import CareerDevelopment from './pages/CareerDevelopment';
import Profile          from './pages/Profile';
import AccountSettings  from './pages/AccountSettings';

// ── Home / Auth page ─────────────────────────────────────────────────────────

function Home({
  user,
  handleGoogleLogin,
}: {
  user: User | null;
  handleGoogleLogin: () => void;
}) {
  const navigate = useNavigate();

  const [isLoginMode,    setIsLoginMode]    = useState(false);
  const [showForgot,     setShowForgot]     = useState(false);
  const [email,          setEmail]          = useState('');
  const [password,       setPassword]       = useState('');
  const [firstName,      setFirstName]      = useState('');
  const [lastName,       setLastName]       = useState('');
  const [termsAccepted,  setTermsAccepted]  = useState(true);
  const [error,          setError]          = useState('');
  const [forgotSent,     setForgotSent]     = useState(false);
  const [forgotLoading,  setForgotLoading]  = useState(false);

  // suppress unused warning
  void showForgot;

  const scrollToRegister = () => {
    document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAuth = async () => {
    setError('');
    try {
      if (isLoginMode) {
        await loginWithEmail(email, password);
        navigate('/modules');
      } else {
        if (!termsAccepted) {
          setError('Please accept the Terms of Service and Privacy Policy');
          return;
        }
        const displayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
        await registerWithEmail(email, password, displayName || undefined);
        navigate('/modules');
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is not enabled. Please enable it in Firebase Console → Authentication → Sign-in method.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address above first.');
      return;
    }
    setForgotLoading(true);
    try {
      await sendPasswordReset(email);
      setForgotSent(true);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="layout-container flex flex-col">
        <div className="px-4 md:px-10 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col w-full max-w-[1200px] flex-1">
            <div className="@container">
              <div className="flex flex-col gap-6 py-10 lg:gap-12 lg:flex-row lg:items-center">
                {/* Left copy */}
                <div className="flex flex-col gap-6 lg:w-1/2 lg:pr-10">
                  <div className="flex flex-col gap-4 text-left">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-accent dark:border-teal-900/30 dark:bg-teal-900/20">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      <span className="text-teal-700 dark:text-teal-300">Bridging Education &amp; Employment</span>
                    </div>
                    <h1 className="text-primary dark:text-white text-4xl font-black leading-tight tracking-[-0.033em] md:text-5xl lg:text-6xl">
                      Launch Your Career with{' '}
                      <span className="text-cta">YouthToPro Hub</span>
                    </h1>
                    <h2 className="text-slate-600 dark:text-slate-300 text-base font-normal leading-relaxed md:text-lg">
                      Connecting ambitious youth with experienced professionals. Join a thriving
                      community where mentorship transforms potential into professional success.
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={scrollToRegister}
                      className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-cta hover:bg-yellow-500 text-primary text-base font-bold leading-normal tracking-[0.015em] transition-all shadow-md hover:shadow-lg"
                    >
                      <span className="truncate">Join as Mentee</span>
                    </button>
                    <button
                      disabled
                      className="flex items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-base font-bold leading-normal tracking-[0.015em] transition-all opacity-50 cursor-not-allowed"
                      title="Mentor registration is coming soon"
                    >
                      <span className="truncate">Join as Mentor</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex -space-x-2">
                      {[
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuD4-Fp-MnmPFWEszRk5rGootOw5g4yHjr8BpUy3ASoeBgrZA6UpADhZpxoFn-dO7OdL2IH8DwLztcEzrnY4abQ9uh8nzvOArXhyu0fnKtyA6B2TbAiZqncbOV-pTypd3LS_UriNQ0WdGgyhDtrLpHERxnj-at1rbiqcdELkKizsMgaamvlxOhAoOYoS5KsVpy9tlYRLe-nopG7dsyYZYl5gjSH6DKGGujSeCo6j3vtBFnzH0nFAhkWUTVgHXPPPw-17QyJ8NkDAzp8',
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuBlyA7Zg31GSbQZpWB1Z9i0qxxJfnJgfHNED0AmpzluOgvd30I1A1MmWrcBLfMP5MBfQlvBkcZu8N-8AHwaqzeELG_mKJsdJRP_dJv9avItgKSHzIGkf2787PD4i1rXUz8zODV-twkPmjhsC5vgv2EQ_5Qo3Ww_gTfqtDUc6rKdquWrC320RKTRblqvTonM-gv_6QzJGdlNnO-WTSDSCzJKsDN-7H9wDNH6dqZ2b1VtqYGXToCZCeL6ONwzYHqZbb6GN_ViWiaySq4',
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuBeDaqbjRbAm6BH7oCH2v8dlYmGzEJ-CElTD04m6VJWx0-25ErnrrFkzZROLWvQs3-S7WzulKrNtr0XPSyIbyVTRGtyqVs9FRo5CK2WNCxb-1yYnQqcK46kBpGpHwuIeASqMcQGgUnZhrgQFGHhLkTlz4luTsm05pGQhpE8m4B2xzXy8Eq7bkz2mC0MZCjjwouRijgY-EQaqPss7W9xG8jVupNqq83IvnjGVBgJGMHUMITBsb-KvZQ4Rbex7g7ba0PBC89eFV3izy4',
                      ].map((src, i) => (
                        <div
                          key={i}
                          className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 bg-center bg-cover"
                          style={{ backgroundImage: `url("${src}")` }}
                        />
                      ))}
                    </div>
                    <p>Join 2,000+ members today</p>
                  </div>
                </div>

                {/* Right image */}
                <div className="lg:w-1/2 mt-8 lg:mt-0 relative">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/30 rounded-full blur-2xl" />
                  <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-cta/30 rounded-full blur-2xl" />
                  <div
                    className="relative w-full aspect-[4/3] bg-center bg-no-repeat bg-cover rounded-2xl shadow-xl overflow-hidden"
                    style={{ backgroundImage: 'url("/main%20pic.png")' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-6 text-white">
                      <p className="font-bold text-lg">"The mentorship I received changed my career trajectory completely."</p>
                      <p className="text-sm opacity-90 mt-1">— Sarah J., Product Designer</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Auth card ──────────────────────────────────────── */}
      <div className="layout-container flex flex-col py-16" id="register">
        <div className="px-4 md:px-10 flex flex-1 justify-center">
          <div className="layout-content-container flex flex-col w-full max-w-[600px] flex-1">
            <div className="bg-white dark:bg-[#15202b] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">

              {/* Title */}
              <div className="px-8 pt-8 pb-4 text-center">
                <h2 className="text-primary dark:text-white text-2xl font-bold leading-tight tracking-[-0.015em] mb-2">
                  {isLoginMode ? 'Welcome Back' : 'Create Your Account'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {isLoginMode ? 'Log in to continue your journey.' : 'Join the community to start your journey.'}
                </p>
              </div>

              {/* Role toggle */}
              <div className="flex px-8 pb-6">
                <div className="flex h-12 flex-1 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 p-1 w-full">
                  <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-md px-2 has-[:checked]:bg-white dark:has-[:checked]:bg-slate-700 has-[:checked]:shadow-sm has-[:checked]:text-primary text-slate-500 dark:text-slate-400 text-sm font-bold transition-all">
                    <span className="truncate">I'm a Mentee</span>
                    <input defaultChecked className="invisible w-0 fixed" name="role-toggle" type="radio" value="mentee" />
                  </label>
                  <label
                    className="flex h-full grow items-center justify-center overflow-hidden rounded-md px-2 text-slate-400 dark:text-slate-500 text-sm font-bold transition-all opacity-50 cursor-not-allowed"
                    title="Mentor registration is coming soon"
                  >
                    <span className="truncate">I'm a Mentor</span>
                    <input disabled className="invisible w-0 fixed" name="role-toggle" type="radio" value="mentor" />
                  </label>
                </div>
              </div>

              {/* Form */}
              <form
                className="flex flex-col gap-5 px-8 pb-8"
                onSubmit={(e) => { e.preventDefault(); handleAuth(); }}
              >
                {/* Error banner */}
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium rounded-lg flex items-start gap-2">
                    <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0">error</span>
                    {error}
                  </div>
                )}

                {/* Forgot-password success */}
                {forgotSent && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm font-medium rounded-lg flex items-start gap-2">
                    <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0">mark_email_read</span>
                    Password reset email sent! Check your inbox.
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  {/* First / Last name */}
                  {!isLoginMode && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-700 dark:text-slate-300 text-sm font-medium" htmlFor="first-name">First Name</label>
                        <input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required={!isLoginMode}
                          className="flex h-11 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-slate-400"
                          id="first-name"
                          placeholder="Jordan"
                          type="text"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-700 dark:text-slate-300 text-sm font-medium" htmlFor="last-name">Last Name</label>
                        <input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required={!isLoginMode}
                          className="flex h-11 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-slate-400"
                          id="last-name"
                          placeholder="Smith"
                          type="text"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-700 dark:text-slate-300 text-sm font-medium" htmlFor="email">Email Address</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-400">
                        <span className="material-symbols-outlined text-[20px]">mail</span>
                      </span>
                      <input
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setForgotSent(false); }}
                        required
                        className="flex h-11 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-3 text-slate-900 dark:text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-slate-400"
                        id="email"
                        placeholder="you@example.com"
                        type="email"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-700 dark:text-slate-300 text-sm font-medium" htmlFor="password">Password</label>
                      {isLoginMode && (
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          disabled={forgotLoading}
                          className="text-xs text-primary dark:text-cta hover:underline font-medium disabled:opacity-60"
                        >
                          {forgotLoading ? 'Sending…' : 'Forgot password?'}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-400">
                        <span className="material-symbols-outlined text-[20px]">lock</span>
                      </span>
                      <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="flex h-11 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-3 text-slate-900 dark:text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-slate-400"
                        id="password"
                        placeholder={isLoginMode ? 'Enter your password' : 'Create a password (min. 8 chars)'}
                        type="password"
                      />
                    </div>
                    {!isLoginMode && (
                      <p className="text-xs text-slate-500">Must be at least 8 characters long.</p>
                    )}
                  </div>
                </div>

                {/* Terms */}
                {!isLoginMode && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                      id="terms"
                      type="checkbox"
                    />
                    <label className="text-xs text-slate-600 dark:text-slate-400" htmlFor="terms">
                      I agree to the{' '}
                      <Link className="text-primary hover:underline" to="/terms">Terms of Service</Link>{' '}
                      and{' '}
                      <Link className="text-primary hover:underline" to="/privacy">Privacy Policy</Link>.
                    </label>
                  </div>
                )}

                {/* Submit */}
                <button
                  className="flex w-full cursor-pointer items-center justify-center rounded-lg bg-cta hover:bg-yellow-500 py-3 px-4 text-primary text-base font-bold transition-colors shadow-md mt-2"
                  type="submit"
                >
                  {isLoginMode ? 'Log In' : 'Complete Registration'}
                </button>

                {/* Divider */}
                <div className="flex items-center justify-center gap-4 mt-6">
                  <div className="h-[1px] w-full bg-slate-200 dark:bg-slate-700" />
                  <span className="text-sm text-slate-500 font-medium whitespace-nowrap">OR</span>
                  <div className="h-[1px] w-full bg-slate-200 dark:bg-slate-700" />
                </div>

                {/* Google */}
                <button
                  onClick={handleGoogleLogin}
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 py-3 px-4 text-slate-700 dark:text-white text-base font-medium transition-all shadow-sm mt-4 gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Continue with Google
                </button>

                {/* Toggle login / register */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {isLoginMode ? "Don't have an account?" : 'Already have an account?'}
                  </span>
                  <button
                    onClick={() => { setIsLoginMode(!isLoginMode); setError(''); setForgotSent(false); }}
                    type="button"
                    className="text-sm font-bold text-primary dark:text-cta hover:underline"
                  >
                    {isLoginMode ? 'Register' : 'Log In'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Layout (nav + footer shell) ──────────────────────────────────────────────

function Layout() {
  const [user,           setUser]           = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  const isDashboard = location.pathname.startsWith('/modules')
    || location.pathname.startsWith('/profile')
    || location.pathname.startsWith('/settings');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/modules');
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try { await logout(); } catch (err) { console.error(err); }
    navigate('/');
  };

  return (
    <div
      className={
        isDashboard
          ? 'font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100'
          : 'font-display relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark group/design-root overflow-x-hidden text-slate-900 dark:text-slate-100'
      }
    >
      {/* ── Public nav ──────────────────────────────────── */}
      {!isDashboard && (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#101922]/90 backdrop-blur-sm">
          <div className="layout-container flex h-full grow flex-col">
            <div className="px-4 md:px-10 flex flex-1 justify-center py-0">
              <div className="layout-content-container flex flex-col w-full max-w-[1200px] flex-1">
                <div className="flex items-center justify-between whitespace-nowrap py-3">
                  {/* Logo */}
                  <Link to="/" className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                      <span className="material-symbols-outlined">hub</span>
                    </div>
                    <h2 className="text-primary dark:text-white text-xl font-bold leading-tight tracking-tight">
                      YouthToPro Hub
                    </h2>
                  </Link>

                  {/* Desktop nav */}
                  <div className="hidden md:flex flex-1 justify-end gap-8 items-center">
                    <div className="flex items-center gap-6">
                      <Link className="text-primary dark:text-slate-300 hover:text-accent dark:hover:text-accent text-sm font-medium leading-normal transition-colors" to="/">Home</Link>
                      <a className="text-primary dark:text-slate-300 hover:text-accent dark:hover:text-accent text-sm font-medium leading-normal transition-colors" href="https://youthtoprofessionals.org" target="_blank" rel="noopener noreferrer">Youth To Pro</a>
                    </div>
                    {user ? (
                      <div className="flex items-center gap-4">
                        <Link to="/modules" className="text-primary dark:text-slate-300 hover:text-accent text-sm font-bold leading-normal transition-colors mr-2">
                          Modules Dashboard
                        </Link>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden lg:block">{user.displayName ?? user.email}</span>
                        <button
                          onClick={handleLogout}
                          className="flex min-w-[100px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-sm font-bold leading-normal tracking-[0.015em] transition-colors shadow-sm"
                        >
                          <span className="truncate">Log Out</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => { document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' }); }}
                          className="text-primary dark:text-slate-300 hover:text-accent dark:hover:text-accent text-sm font-medium leading-normal transition-colors"
                        >
                          Login
                        </button>
                        <button
                          onClick={() => { document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' }); }}
                          className="flex min-w-[100px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-cta hover:bg-yellow-500 text-primary text-sm font-bold leading-normal tracking-[0.015em] transition-colors shadow-sm"
                        >
                          <span className="truncate">Register</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mobile hamburger */}
                  <div className="md:hidden flex items-center">
                    <button
                      onClick={() => setMobileMenuOpen((o) => !o)}
                      className="text-primary dark:text-white p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      aria-label="Toggle menu"
                    >
                      <span className="material-symbols-outlined">
                        {mobileMenuOpen ? 'close' : 'menu'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101922] px-4 py-4 flex flex-col gap-3">
              <Link to="/" className="block py-2 text-sm font-medium text-primary dark:text-slate-200">Home</Link>
              <a href="https://youthtoprofessionals.org" target="_blank" rel="noopener noreferrer" className="block py-2 text-sm font-medium text-primary dark:text-slate-200">Youth To Pro</a>
              {user ? (
                <>
                  <Link to="/modules" className="block py-2 text-sm font-bold text-primary dark:text-slate-200">Modules Dashboard</Link>
                  <Link to="/profile" className="block py-2 text-sm font-medium text-primary dark:text-slate-200">My Profile</Link>
                  <Link to="/settings" className="block py-2 text-sm font-medium text-primary dark:text-slate-200">Account Settings</Link>
                  <button onClick={handleLogout} className="w-full mt-1 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-white">
                    Log Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setMobileMenuOpen(false); document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="w-full py-2.5 rounded-lg bg-cta text-primary text-sm font-bold"
                >
                  Register / Log In
                </button>
              )}
            </div>
          )}
        </header>
      )}

      {/* ── Routes ────────────────────────────────────────── */}
      <Routes>
        <Route path="/"         element={<Home user={user} handleGoogleLogin={handleGoogleLogin} />} />
        <Route path="/modules"  element={<CareerDevelopment user={user} />} />
        <Route path="/profile"  element={<Profile user={user} />} />
        <Route path="/settings" element={<AccountSettings user={user} />} />
        <Route path="/privacy"  element={<Privacy />} />
        <Route path="/terms"    element={<Terms />} />
      </Routes>

      {/* ── Public footer ─────────────────────────────────── */}
      {!isDashboard && (
        <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#15202b] py-10 px-4 md:px-10">
          <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">hub</span>
              <span className="font-bold text-primary dark:text-white">YouthToPro Hub</span>
            </div>
            <div className="flex gap-6 text-sm text-slate-600 dark:text-slate-400">
              <Link className="hover:text-primary transition-colors" to="/privacy">Privacy</Link>
              <Link className="hover:text-primary transition-colors" to="/terms">Terms</Link>
              <a className="hover:text-primary transition-colors" href="#">Contact</a>
            </div>
            <div className="text-sm text-slate-500">
              © 2026 YouthToPro Hub. All rights reserved.
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
