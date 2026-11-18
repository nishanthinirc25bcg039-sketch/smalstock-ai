import { FormEvent, useState } from 'react';
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, PackageCheck } from 'lucide-react';
import { DEMO_IMAGES } from '../data/seedData';
import { UserSession } from '../types/inventory';
import { SafeImage } from './SafeImage';

interface AdminLoginProps {
  onSignIn: (session: UserSession) => void;
}

const DEMO_EMAIL = 'admin@smartstock.demo';
const DEMO_PASS = 'DemoPass2026';

export function AdminLogin({ onSignIn }: AdminLoginProps) {
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASS);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setAuthError('');

    let hasFieldError = false;
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setEmailError('Enter a valid work email address.');
      hasFieldError = true;
    }
    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      hasFieldError = true;
    }
    if (hasFieldError) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (trimmedEmail.toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASS) {
        setAuthError(
          `Demo credentials did not match. Use ${DEMO_EMAIL} with password "${DEMO_PASS}" or click Quick Demo Sign-In.`
        );
        return;
      }

      onSignIn({
        email: DEMO_EMAIL,
        name: 'Clara Vance',
        role: 'Operations Admin (Demo)',
        rememberMe,
        isDemo: true,
      });
    }, 220);
  };

  const handleDemoLogin = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASS);
    setEmailError('');
    setPasswordError('');
    setAuthError('');
    onSignIn({
      email: DEMO_EMAIL,
      name: 'Clara Vance',
      role: 'Operations Admin (Demo)',
      rememberMe,
      isDemo: true,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Left Branded Welcome Panel */}
        <div className="lg:col-span-6 bg-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between gap-8">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center">
                <PackageCheck className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <span className="font-display text-lg font-bold tracking-tight">SmartStock AI</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mt-8 text-balance">
              Clear inventory control for growing commerce teams.
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
              Track live stock counts, catch low-inventory risks early, manage supplier deliveries,
              and review sample demand insights from one fast workspace.
            </p>
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-800">
            <SafeImage
              src={DEMO_IMAGES.loginHero}
              alt="Organized retail stockroom shelves and fulfillment counter"
              className="w-full h-52 sm:h-60 object-cover"
            />
          </div>

          <div className="border-t border-slate-800 pt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-300">
            <span>Interactive Demo Mode</span>
            <span aria-hidden="true">·</span>
            <span>Local browser persistence</span>
            <span aria-hidden="true">·</span>
            <span>No external account required</span>
          </div>
        </div>

        {/* Right Sign-In Form */}
        <div className="lg:col-span-6 p-8 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-6">
              <p className="text-xs font-medium text-orange-600">Demo workspace sign-in</p>
              <h2 className="font-display text-2xl font-bold text-slate-900 mt-1">
                Sign in to SmartStock AI
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Sample store: Northwind Pantry & Brew Co. All data runs locally in your browser.
              </p>
            </div>

            {/* Demo Credentials Notice */}
            <div className="mb-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-700 space-y-0.5">
                <p className="font-semibold text-slate-900">Demo admin credentials</p>
                <p className="font-mono text-slate-600">
                  {DEMO_EMAIL} / {DEMO_PASS}
                </p>
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="px-3.5 py-2 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors whitespace-nowrap shrink-0"
              >
                Quick Demo Sign-In
              </button>
            </div>

            {authError && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-800"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    placeholder="admin@smartstock.demo"
                    aria-invalid={Boolean(emailError)}
                    className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 transition-colors ${
                      emailError ? 'border-red-400' : 'border-slate-200'
                    }`}
                  />
                </div>
                {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Enter password"
                    aria-invalid={Boolean(passwordError)}
                    className={`w-full pl-10 pr-11 py-2.5 text-sm bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 transition-colors ${
                      passwordError ? 'border-red-400' : 'border-slate-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-800 rounded-md transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {passwordError && <p className="text-xs text-red-600 mt-1">{passwordError}</p>}
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span>Remember this browser</span>
                </label>
                <span className="text-xs text-slate-500">Demo auth only</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>{isSubmitting ? 'Signing in...' : 'Sign In to Dashboard'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
