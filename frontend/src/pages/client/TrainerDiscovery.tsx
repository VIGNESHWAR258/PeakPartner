import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { Profile, ApiResponse, ProgramType } from '../../types';

const PROGRAM_OPTIONS: { value: ProgramType; label: string }[] = [
  { value: 'GENERAL_FITNESS', label: 'General Fitness' },
  { value: 'FAT_LOSS', label: 'Fat Loss' },
  { value: 'MUSCLE_GAIN', label: 'Muscle Gain' },
  { value: 'STRENGTH_TRAINING', label: 'Strength Training' },
  { value: 'FLEXIBILITY', label: 'Flexibility' },
  { value: 'CUSTOM', label: 'Custom Program' },
];

export default function TrainerDiscovery() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trainers, setTrainers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  // Connection request modal
  const [selectedTrainer, setSelectedTrainer] = useState<Profile | null>(null);
  const [program, setProgram] = useState<ProgramType>('GENERAL_FITNESS');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState('');
  const [requestError, setRequestError] = useState('');

  // Track sent requests to update UI
  const [sentRequestTrainerIds, setSentRequestTrainerIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.token) {
      fetchTrainers();
      fetchMyConnections();
    }
  }, [user]);

  const fetchTrainers = async () => {
    try {
      const url = filter ? `/profiles/trainers?specialization=${encodeURIComponent(filter)}` : '/profiles/trainers';
      const res: ApiResponse<Profile[]> = await api.get(url, user!.token);
      if (res.success) {
        setTrainers(res.data);
      }
    } catch {
      setError('Failed to load trainers');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyConnections = async () => {
    try {
      const res = await api.get('/connections', user!.token);
      if (res.success && res.data) {
        const ids = new Set<string>(
          res.data
            .filter((c: any) => c.status === 'PENDING' || c.status === 'ACCEPTED')
            .map((c: any) => c.trainer.id)
        );
        setSentRequestTrainerIds(ids);
      }
    } catch {
      // silently fail - non-critical
    }
  };

  useEffect(() => {
    if (user?.token) {
      setLoading(true);
      fetchTrainers();
    }
  }, [filter]);

  const openRequestModal = (trainer: Profile) => {
    setSelectedTrainer(trainer);
    setProgram('GENERAL_FITNESS');
    setNotes('');
    setRequestError('');
    setRequestSuccess('');
  };

  const closeModal = () => {
    setSelectedTrainer(null);
  };

  const sendRequest = async () => {
    if (!selectedTrainer) return;
    setSending(true);
    setRequestError('');

    try {
      const res = await api.post('/connections', {
        trainerId: selectedTrainer.id,
        program,
        notes: notes || null,
      }, user!.token);

      if (res.success) {
        setRequestSuccess(`Request sent to ${selectedTrainer.fullName}!`);
        setSentRequestTrainerIds(prev => new Set(prev).add(selectedTrainer.id));
        setTimeout(() => {
          closeModal();
          setRequestSuccess('');
        }, 2000);
      }
    } catch (err: any) {
      setRequestError(err.message || 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  const allSpecializations = Array.from(
    new Set(trainers.flatMap(t => t.specializations || []))
  ).sort();

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-3">
          <button
            onClick={() => navigate('/client/dashboard')}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Find a Trainer</h1>
            <p className="text-xs text-white/70 font-medium">{trainers.length} trainers available</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {/* Filter chips */}
        {allSpecializations.length > 0 && (
          <div className="mb-5">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('')}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                style={!filter ? {
                  background: '#2563eb', color: '#fff', border: '1.5px solid #2563eb'
                } : {
                  background: '#fff', color: '#475569', border: '1.5px solid #e2e8f0'
                }}
              >
                All
              </button>
              {allSpecializations.map(spec => (
                <button
                  key={spec}
                  onClick={() => setFilter(spec === filter ? '' : spec)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                  style={filter === spec ? {
                    background: '#2563eb', color: '#fff', border: '1.5px solid #2563eb'
                  } : {
                    background: '#fff', color: '#475569', border: '1.5px solid #e2e8f0'
                  }}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trainer cards */}
        {trainers.length === 0 ? (
          <div className="text-center py-12" style={{ color: '#64748b' }}>
            <svg className="w-16 h-16 mx-auto mb-4" style={{ color: '#cbd5e1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="font-semibold" style={{ color: '#334155' }}>No trainers found</p>
            <p className="text-sm mt-1">Try a different filter</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {trainers.map(trainer => {
              const alreadySent = sentRequestTrainerIds.has(trainer.id);
              return (
                <div key={trainer.id} className="card p-5 hover:shadow-md transition-shadow">
                  {/* Trainer header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
                      {trainer.fullName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate" style={{ color: '#0f172a' }}>{trainer.fullName}</h3>
                      {trainer.experienceYears != null && (
                        <p className="text-sm text-subtle">{trainer.experienceYears} years experience</p>
                      )}
                      {trainer.avgRating != null && trainer.avgRating > 0 && (
                        <div className="flex items-center gap-1 text-sm">
                          <span style={{ color: '#f59e0b' }}>★</span>
                          <span style={{ color: '#334155' }}>{trainer.avgRating.toFixed(1)}</span>
                          {trainer.totalReviews != null && (
                            <span className="text-muted">({trainer.totalReviews})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {trainer.bio && (
                    <p className="text-sm text-subtle mb-3 line-clamp-2">{trainer.bio}</p>
                  )}

                  {/* Specializations */}
                  {trainer.specializations && trainer.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {trainer.specializations.slice(0, 4).map(spec => (
                        <span key={spec} className="tag tag-blue">{spec}</span>
                      ))}
                      {trainer.specializations.length > 4 && (
                        <span className="tag" style={{ background: '#f1f5f9', color: '#64748b' }}>
                          +{trainer.specializations.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Certifications */}
                  {trainer.certifications && trainer.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {trainer.certifications.map(cert => (
                        <span key={cert} className="tag tag-green">🎓 {cert}</span>
                      ))}
                    </div>
                  )}

                  {/* Action */}
                  {alreadySent ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-not-allowed"
                      style={{ background: '#f1f5f9', color: '#94a3b8' }}
                    >
                      ✓ Request Sent
                    </button>
                  ) : (
                    <button
                      onClick={() => openRequestModal(trainer)}
                      className="w-full py-2.5 rounded-xl btn-primary text-sm font-semibold"
                    >
                      Connect with Trainer
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Connection Request Modal */}
      {selectedTrainer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-5" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <div className="flex items-center justify-between">
                <h3 className="section-title">Send Connection Request</h3>
                <button onClick={closeModal} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
                  <svg className="w-5 h-5" style={{ color: '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Trainer info */}
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#f8fafc' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
                  {selectedTrainer.fullName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold" style={{ color: '#0f172a' }}>{selectedTrainer.fullName}</p>
                  {selectedTrainer.specializations && (
                    <p className="text-xs text-subtle">{selectedTrainer.specializations.join(' · ')}</p>
                  )}
                </div>
              </div>

              {requestSuccess && (
                <div className="p-3 rounded-xl text-sm flex items-center gap-2" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857' }}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {requestSuccess}
                </div>
              )}

              {requestError && (
                <div className="p-3 rounded-xl text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                  {requestError}
                </div>
              )}

              {!requestSuccess && (
                <>
                  {/* Program type */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#334155' }}>Program Type</label>
                    <select
                      value={program}
                      onChange={e => setProgram(e.target.value as ProgramType)}
                      className="input"
                    >
                      {PROGRAM_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#334155' }}>
                      Message to Trainer <span className="text-muted">(optional)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={3}
                      className="input resize-none"
                      style={{ minHeight: '80px' }}
                      placeholder="Introduce yourself, share your goals, or ask questions..."
                    />
                  </div>
                </>
              )}
            </div>

            {!requestSuccess && (
              <div className="p-5 flex gap-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                  style={{ border: '1.5px solid #e2e8f0', color: '#475569', background: '#fff' }}
                >
                  Cancel
                </button>
                <button
                  onClick={sendRequest}
                  disabled={sending}
                  className="flex-1 btn-primary text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sending && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {sending ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
