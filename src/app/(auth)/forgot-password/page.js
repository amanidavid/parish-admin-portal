'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { APP_AUTH_FORGOT_PASSWORD_ROUTE } from '@/constants/api';

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

const METHODS = [
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
];

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [method, setMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+255');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = method === 'email'
      ? { email: email.trim() }
      : { country_code: countryCode.trim(), phone: phone.trim() };

    try {
      const res = await fetch(APP_AUTH_FORGOT_PASSWORD_ROUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data?.success) {
        setError(data?.message || 'Failed to send reset code. Please try again.');
        return;
      }

      const challengeId = data?.data?.challenge_id || data?.challenge_id;
      if (!challengeId) {
        setError('Unexpected response from server. Please try again.');
        return;
      }

      // Store challenge_id securely in sessionStorage (cleared when tab closes)
      sessionStorage.setItem('zaba_reset_challenge_id', challengeId);
      router.push('/reset-password');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [method, email, countryCode, phone, router]);

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <div className="mb-5">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">ZABA</h1>
          <p className="text-xs text-gray-400 uppercase tracking-widest mt-0.5">Administrator Portal</p>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Reset your password</h2>
        <p className="text-gray-500 mt-1 text-sm">
          Choose how you want to receive your reset code.
        </p>
      </div>

      {/* Method toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
        {METHODS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => { setMethod(m.key); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${method === m.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {m.label}
          </button>
        ))}
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

        {method === 'email' ? (
          <div>
            <label className="label" htmlFor="email">Email address</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </span>
              <input
                id="email"
                type="email"
                className="input pl-10"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="countryCode">Country Code</label>
              <input
                id="countryCode"
                type="text"
                className="input"
                placeholder="+255"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                className="input"
                placeholder="712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                required
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold text-white transition-all ${loading ? 'opacity-90 cursor-not-allowed' : 'hover:opacity-90'}`}
          style={{ background: 'linear-gradient(135deg, #ea580c, #c2410c)' }}
          disabled={loading}
        >
          {loading ? <><Spinner /> Sending...</> : 'Send reset code'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-500">
        <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700 transition-colors">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
