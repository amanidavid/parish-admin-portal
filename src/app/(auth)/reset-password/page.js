'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { APP_AUTH_RESET_PASSWORD_ROUTE } from '@/constants/api';

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function SuccessRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <div className="mb-5">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">ZABA</h1>
          <p className="text-xs text-gray-400 uppercase tracking-widest mt-0.5">Administrator Portal</p>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Password reset</h2>
      </div>

      <div className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3 mb-6">
        <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <p className="text-sm text-green-700">Your password has been reset successfully.</p>
      </div>

      <Link
        href="/dashboard"
        className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold text-white transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #ea580c, #c2410c)' }}
      >
        Sign In
      </Link>
    </div>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [challengeId, setChallengeId] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('zaba_reset_challenge_id');
    if (!stored) {
      setError('Reset session expired. Please start over.');
      return;
    }
    setChallengeId(stored);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(APP_AUTH_RESET_PASSWORD_ROUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge_id: challengeId,
          code: code.trim(),
          password,
          password_confirmation: confirmPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data?.success) {
        setError(data?.message || 'Failed to reset password. Please try again.');
        return;
      }

      sessionStorage.removeItem('zaba_reset_challenge_id');
      setSuccess(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [challengeId, code, password, confirmPassword]);

  if (success) {
    return <SuccessRedirect />;
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <div className="mb-5">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">ZABA</h1>
          <p className="text-xs text-gray-400 uppercase tracking-widest mt-0.5">Administrator Portal</p>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Enter reset code</h2>
        <p className="text-gray-500 mt-1 text-sm">
          Enter the code you received and your new password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div>
          <label className="label" htmlFor="code">Reset Code</label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            className="input tracking-[0.5em] text-center font-mono"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="password">New Password</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <input
              id="password"
              type="password"
              className="input pl-10"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            className="input"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        <button
          type="submit"
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold text-white transition-all ${loading ? 'opacity-90 cursor-not-allowed' : 'hover:opacity-90'}`}
          style={{ background: 'linear-gradient(135deg, #ea580c, #c2410c)' }}
          disabled={loading || !challengeId}
        >
          {loading ? <><Spinner /> Resetting...</> : 'Reset Password'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-500">
        <Link href="/forgot-password" className="font-medium text-primary-600 hover:text-primary-700 transition-colors">
          Resend code
        </Link>
        <span className="mx-2 text-gray-300">|</span>
        <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700 transition-colors">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
