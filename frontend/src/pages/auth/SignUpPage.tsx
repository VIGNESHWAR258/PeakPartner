import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { SignUpRequest, ApiResponse, AuthResponse } from '../../types';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, login } = useAuth();
  const [formData, setFormData] = useState<SignUpRequest>({
    fullName: '',
    email: '',
    password: '',
    role: 'CLIENT',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (isAuthenticated && user) {
    return <Navigate to={user.role === 'TRAINER' ? '/trainer/dashboard' : '/client/dashboard'} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response: ApiResponse<AuthResponse> = await api.post('/auth/signup', formData);

      if (response.success) {
        login(
          response.data.accessToken,
          response.data.userId,
          response.data.email,
          response.data.role
        );

        if (response.data.role === 'TRAINER') {
          navigate('/trainer/dashboard');
        } else {
          navigate('/client/dashboard');
        }
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-8" style={{ background: 'radial-gradient(circle, #10b981, transparent)' }} />
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="card p-8" style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)' }}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 mb-4 shadow-lg shadow-blue-500/20">
              <span className="text-3xl">💪</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>
              Join PeakPartner
            </h1>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>
              Create your account to get started
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm flex items-start gap-2" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#334155' }}>
                I am a
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'CLIENT' })}
                  className="flex-1 py-3.5 rounded-xl font-semibold transition-all flex flex-col items-center gap-1"
                  style={formData.role === 'CLIENT' ? {
                    border: '2px solid #3b82f6',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    boxShadow: '0 0 0 3px rgba(59,130,246,0.1)',
                  } : {
                    border: '2px solid #e2e8f0',
                    background: '#f8fafc',
                    color: '#64748b',
                  }}
                >
                  <span className="text-xl">🏋️</span>
                  <span className="text-sm">Client</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'TRAINER' })}
                  className="flex-1 py-3.5 rounded-xl font-semibold transition-all flex flex-col items-center gap-1"
                  style={formData.role === 'TRAINER' ? {
                    border: '2px solid #3b82f6',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    boxShadow: '0 0 0 3px rgba(59,130,246,0.1)',
                  } : {
                    border: '2px solid #e2e8f0',
                    background: '#f8fafc',
                    color: '#64748b',
                  }}
                >
                  <span className="text-xl">🏅</span>
                  <span className="text-sm">Trainer</span>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold mb-1.5" style={{ color: '#334155' }}>
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                autoComplete="name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="input"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-1.5" style={{ color: '#334155' }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold mb-1.5" style={{ color: '#334155' }}>
                Phone <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-1.5" style={{ color: '#334155' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
                placeholder="••••••••"
              />
              <p className="mt-1.5 text-xs" style={{ color: '#94a3b8' }}>At least 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: '#64748b' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-semibold" style={{ color: '#2563eb' }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
