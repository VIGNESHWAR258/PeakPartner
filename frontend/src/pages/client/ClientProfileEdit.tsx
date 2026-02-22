import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { Profile, ApiResponse } from '../../types';

const FITNESS_GOAL_OPTIONS = [
  'Lose Weight', 'Build Muscle', 'Improve Endurance', 'Get Stronger',
  'Increase Flexibility', 'Better Nutrition', 'Sport Performance',
  'Stress Relief', 'General Fitness', 'Injury Recovery',
  'Marathon Training', 'Body Recomposition',
];

export default function ClientProfileEdit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [fitnessGoals, setFitnessGoals] = useState<string[]>([]);

  useEffect(() => {
    if (user?.token) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res: ApiResponse<Profile> = await api.get('/profiles/me', user!.token);
      if (res.success) {
        const p = res.data;
        setFullName(p.fullName || '');
        setPhone(p.phone || '');
        setBio(p.bio || '');
        setFitnessGoals(p.fitnessGoals || []);
      }
    } catch {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleGoal = (goal: string) => {
    setFitnessGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await api.put('/profiles/me', {
        fullName,
        phone: phone || null,
        bio: bio || null,
        fitnessGoals: fitnessGoals.length > 0 ? fitnessGoals : null,
      }, user!.token);

      if (res.success) {
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center page-bg">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-bg">
      <header className="gradient-bg text-white sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/client/dashboard')}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Edit Profile</h1>
              <p className="text-xs text-white/70 font-medium">Update your fitness profile</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors text-sm font-semibold backdrop-blur flex items-center gap-1.5"
            >
              {saving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Saving...' : '💾 Save'}
            </button>
            <button
              onClick={() => navigate('/client/dashboard')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm font-medium backdrop-blur"
            >
              ✕ Close
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {success && (
          <div className="mb-4 p-3 rounded-xl text-sm flex items-center gap-2" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857' }}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card p-5 space-y-4">
            <h2 className="section-title">Personal Information</h2>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#334155' }}>Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="input"
                placeholder="Sarah Williams"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#334155' }}>Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="input"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#334155' }}>About Me</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                className="input resize-none"
                style={{ minHeight: '80px' }}
                placeholder="Tell trainers about yourself, your fitness background, and what you're looking for..."
              />
            </div>
          </div>

          {/* Fitness Goals */}
          <div className="card p-5">
            <h2 className="section-title mb-1">Fitness Goals</h2>
            <p className="text-sm mb-3" style={{ color: '#64748b' }}>Select what you want to achieve</p>
            <div className="flex flex-wrap gap-2">
              {FITNESS_GOAL_OPTIONS.map(goal => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleGoal(goal)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                  style={fitnessGoals.includes(goal) ? {
                    background: '#2563eb',
                    color: '#ffffff',
                    border: '1.5px solid #2563eb',
                  } : {
                    background: '#f8fafc',
                    color: '#475569',
                    border: '1.5px solid #e2e8f0',
                  }}
                >
                  {fitnessGoals.includes(goal) && '✓ '}
                  {goal}
                </button>
              ))}
            </div>
          </div>

        </form>
      </main>
    </div>
  );
}
