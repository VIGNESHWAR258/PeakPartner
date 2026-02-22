import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { LoginRequest, ApiResponse, AuthResponse } from '../../types';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, login } = useAuth();
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
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
    setLoading(true);

    try {
      const response: ApiResponse<AuthResponse> = await api.post('/auth/login', formData);

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
        setError(response.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-8" style={{ background: 'radial-gradient(circle, #10b981, transparent)' }} />
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="card p-8" style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)' }}>
          {/* Logo / Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 mb-4 shadow-lg shadow-blue-500/20">
              <span className="text-3xl">💪</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>
              PeakPartner
            </h1>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>
              Sign in to your account
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
              <label htmlFor="password" className="block text-sm font-semibold mb-1.5" style={{ color: '#334155' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-5 p-3 rounded-xl" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <p className="text-xs font-bold mb-1" style={{ color: '#1d4ed8' }}>Demo Accounts</p>
            <div className="text-xs space-y-0.5" style={{ color: '#2563eb' }}>
              <p><span className="font-semibold">Trainer:</span> mike@trainer.com / Trainer123!</p>
              <p><span className="font-semibold">Client:</span> sarah@client.com / Client123!</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: '#64748b' }}>
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold" style={{ color: '#2563eb' }}>
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
