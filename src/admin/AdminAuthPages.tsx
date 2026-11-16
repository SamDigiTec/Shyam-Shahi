import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, KeyRound, Lock, Mail, ShieldCheck, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../lib/api';
import { SeoHead } from '../components/SeoHead';

export function AdminLoginPage() {
  const { user, login, needsFirstAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError((err as Error).message || 'Invalid credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06152B] text-[#F5F8FF] flex items-center justify-center px-4 py-12">
      <SeoHead title="Admin Sign In | Shyam Shahi CMS" description="Secure CMS sign in" noIndex />

      <div className="w-full max-w-md space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#A9BBD3] hover:text-[#00B8FF]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Public Portfolio
        </Link>

        <div className="rounded-3xl border border-[#24466C] bg-[#0B1F3A] p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#2878FF] flex items-center justify-center text-white">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#F5F8FF]">Admin CMS Sign In</h1>
              <p className="text-xs text-[#A9BBD3]">Shyam Shahi Studio Control Panel</p>
            </div>
          </div>

          {needsFirstAdmin && (
            <div className="mb-5 rounded-xl border border-[#00B8FF]/40 bg-[#0D2747] p-4 text-xs text-[#F5F8FF] space-y-2">
              <p className="font-semibold text-[#00B8FF]">First-Time Setup Required</p>
              <p className="text-[#A9BBD3]">
                No administrator account exists yet. Create your initial Super Admin account first.
              </p>
              <Link
                to="/admin/signup"
                className="inline-flex items-center gap-1.5 text-[#00B8FF] font-semibold hover:underline"
              >
                Create Super Admin Account →
              </Link>
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-semibold text-[#A9BBD3] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A9BBD3] absolute left-3.5 top-3.5" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@shyamshahi.studio"
                  className="w-full rounded-xl border border-[#24466C] bg-[#06152B] pl-10 pr-4 py-3 text-sm text-[#F5F8FF] focus:outline-none focus:border-[#2878FF]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="admin-password" className="text-xs font-semibold text-[#A9BBD3]">
                  Password
                </label>
                <Link to="/admin/forgot-password" className="text-xs text-[#00B8FF] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#A9BBD3] absolute left-3.5 top-3.5" />
                <input
                  id="admin-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#24466C] bg-[#06152B] pl-10 pr-4 py-3 text-sm text-[#F5F8FF] focus:outline-none focus:border-[#2878FF]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#2878FF] hover:bg-[#1E66E5] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {submitting ? 'Signing In...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#24466C]/70 text-center text-xs text-[#A9BBD3]">
            {needsFirstAdmin ? 'Need to initialize your studio?' : 'Have an admin invitation token?'}{' '}
            <Link to="/admin/signup" className="text-[#00B8FF] font-semibold hover:underline">
              {needsFirstAdmin ? 'Setup Super Admin' : 'Accept Invite & Sign Up'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminSignupPage() {
  const { user, signup, needsFirstAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [inviteToken, setInviteToken] = useState(searchParams.get('token') || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signup({
        full_name: fullName,
        email,
        password,
        invite_token: needsFirstAdmin ? undefined : inviteToken,
      });
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError((err as Error).message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06152B] text-[#F5F8FF] flex items-center justify-center px-4 py-12">
      <SeoHead title="Admin Setup & Sign Up | Shyam Shahi CMS" description="Authorized admin setup" noIndex />

      <div className="w-full max-w-md space-y-6">
        <Link
          to="/admin/login"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#A9BBD3] hover:text-[#00B8FF]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>

        <div className="rounded-3xl border border-[#24466C] bg-[#0B1F3A] p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#2878FF] flex items-center justify-center text-white">
              {needsFirstAdmin ? <ShieldCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#F5F8FF]">
                {needsFirstAdmin ? 'Initialize Super Admin' : 'Invited Admin Sign Up'}
              </h1>
              <p className="text-xs text-[#A9BBD3]">
                {needsFirstAdmin
                  ? 'First-time secure administrator creation'
                  : 'Requires a valid invitation token from a Super Admin'}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="signup-name" className="block text-xs font-semibold text-[#A9BBD3] mb-1.5">
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Shyam Shahi"
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-4 py-3 text-sm text-[#F5F8FF] focus:outline-none focus:border-[#2878FF]"
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-xs font-semibold text-[#A9BBD3] mb-1.5">
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="shyam@shyamshahi.studio"
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-4 py-3 text-sm text-[#F5F8FF] focus:outline-none focus:border-[#2878FF]"
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-xs font-semibold text-[#A9BBD3] mb-1.5">
                Password (min 8 characters)
              </label>
              <input
                id="signup-password"
                type="password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Strong passphrase"
                className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-4 py-3 text-sm text-[#F5F8FF] focus:outline-none focus:border-[#2878FF]"
              />
            </div>

            {!needsFirstAdmin && (
              <div>
                <label htmlFor="signup-token" className="block text-xs font-semibold text-[#A9BBD3] mb-1.5">
                  Invitation Token *
                </label>
                <input
                  id="signup-token"
                  type="text"
                  required
                  value={inviteToken}
                  onChange={(e) => setInviteToken(e.target.value)}
                  placeholder="Paste invitation token"
                  className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-4 py-3 text-sm font-mono text-[#F5F8FF] focus:outline-none focus:border-[#2878FF]"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#2878FF] hover:bg-[#1E66E5] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {submitting
                ? 'Creating Account...'
                : needsFirstAdmin
                  ? 'Create Super Admin Account'
                  : 'Complete Admin Registration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AdminForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const res = await apiRequest<{ message: string; devResetToken?: string }>(
        '/api/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({ email }),
        }
      );
      setMessage(
        res.devResetToken
          ? `${res.message} Dev reset token: ${res.devResetToken}`
          : res.message
      );
      if (res.devResetToken) setToken(res.devResetToken);
      setStep('reset');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      navigate('/admin/login');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06152B] text-[#F5F8FF] flex items-center justify-center px-4 py-12">
      <SeoHead title="Reset Password | Shyam Shahi CMS" description="Admin password recovery" noIndex />

      <div className="w-full max-w-md space-y-6">
        <Link
          to="/admin/login"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#A9BBD3] hover:text-[#00B8FF]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>

        <div className="rounded-3xl border border-[#24466C] bg-[#0B1F3A] p-8 shadow-2xl space-y-5">
          <h1 className="text-xl font-bold text-[#F5F8FF]">Password Recovery</h1>

          {message && (
            <div className="rounded-xl border border-[#00B8FF]/40 bg-[#0D2747] p-3.5 text-xs text-[#F5F8FF] break-all">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-200">
              {error}
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A9BBD3] mb-1.5">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-4 py-3 text-sm text-[#F5F8FF] focus:outline-none focus:border-[#2878FF]"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-[#2878FF] hover:bg-[#1E66E5] text-white text-sm font-semibold"
              >
                {submitting ? 'Generating Token...' : 'Request Reset Token'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A9BBD3] mb-1.5">Reset Token</label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-4 py-3 text-sm font-mono text-[#F5F8FF] focus:outline-none focus:border-[#2878FF]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#A9BBD3] mb-1.5">
                  New Password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-4 py-3 text-sm text-[#F5F8FF] focus:outline-none focus:border-[#2878FF]"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-[#2878FF] hover:bg-[#1E66E5] text-white text-sm font-semibold"
              >
                {submitting ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
