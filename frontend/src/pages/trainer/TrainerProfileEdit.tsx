import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { Profile, ApiResponse } from '../../types';

const SPECIALIZATION_OPTIONS = [
  'Strength Training', 'Weight Loss', 'Muscle Building', 'Athletic Performance',
  'Yoga', 'Pilates', 'CrossFit', 'HIIT', 'Bodybuilding', 'Functional Training',
  'Flexibility', 'Rehabilitation', 'Sports Conditioning', 'Nutrition Coaching',
];

export default function TrainerProfileEdit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState<number | ''>('');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCert, setNewCert] = useState('');

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
        setExperienceYears(p.experienceYears ?? '');
        setSpecializations(p.specializations || []);
        setCertifications(p.certifications || []);
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleSpecialization = (spec: string) => {
    setSpecializations(prev =>
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  const addCertification = () => {
    const trimmed = newCert.trim();
    if (trimmed && !certifications.includes(trimmed)) {
      setCertifications(prev => [...prev, trimmed]);
      setNewCert('');
    }
  };

  const removeCertification = (cert: string) => {
    setCertifications(prev => prev.filter(c => c !== cert));
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
        experienceYears: experienceYears === '' ? null : experienceYears,
        specializations: specializations.length > 0 ? specializations : null,
        certifications: certifications.length > 0 ? certifications : null,
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
      {/* Header */}
      <header className="gradient-bg text-white sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/trainer/dashboard')}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Edit Profile</h1>
              <p className="text-xs text-white/70 font-medium">Update your trainer profile</p>
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
              onClick={() => navigate('/trainer/dashboard')}
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
          {/* Basic Info */}
          <div className="card p-5 space-y-4">
            <h2 className="section-title">Basic Information</h2>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#334155' }}>Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="input"
                placeholder="Coach Mike Johnson"
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
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#334155' }}>
                Bio Statement
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={4}
                className="input resize-none"
                style={{ minHeight: '100px' }}
                placeholder="Tell clients about your experience, coaching style, and what makes you unique..."
              />
              <p className="mt-1.5 text-xs" style={{ color: '#94a3b8' }}>{bio.length}/500 characters</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#334155' }}>Years of Experience</label>
              <input
                type="number"
                min={0}
                max={50}
                value={experienceYears}
                onChange={e => setExperienceYears(e.target.value ? parseInt(e.target.value) : '')}
                className="input"
                style={{ width: '8rem' }}
                placeholder="0"
              />
            </div>
          </div>

          {/* Specializations */}
          <div className="card p-5">
            <h2 className="section-title mb-1">Specializations</h2>
            <p className="text-sm mb-3" style={{ color: '#64748b' }}>Select your areas of expertise</p>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATION_OPTIONS.map(spec => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => toggleSpecialization(spec)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                  style={specializations.includes(spec) ? {
                    background: '#2563eb',
                    color: '#ffffff',
                    border: '1.5px solid #2563eb',
                  } : {
                    background: '#f8fafc',
                    color: '#475569',
                    border: '1.5px solid #e2e8f0',
                  }}
                >
                  {specializations.includes(spec) && '✓ '}
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="card p-5">
            <h2 className="section-title mb-1">Certifications</h2>
            <p className="text-sm mb-3" style={{ color: '#64748b' }}>Add your professional certifications</p>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newCert}
                onChange={e => setNewCert(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCertification(); }}}
                className="input flex-1"
                placeholder="e.g. NASM-CPT, CSCS, ACE..."
              />
              <button
                type="button"
                onClick={addCertification}
                className="btn-primary px-4 py-2.5 text-sm"
              >
                Add
              </button>
            </div>

            {certifications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {certifications.map(cert => (
                  <span
                    key={cert}
                    className="tag tag-green"
                  >
                    🎓 {cert}
                    <button
                      type="button"
                      onClick={() => removeCertification(cert)}
                      className="ml-1 opacity-60 hover:opacity-100"
                      style={{ color: '#047857' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {certifications.length === 0 && (
              <p className="text-sm italic" style={{ color: '#94a3b8' }}>No certifications added yet</p>
            )}
          </div>

        </form>
      </main>
    </div>
  );
}
