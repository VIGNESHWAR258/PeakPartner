import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { ConnectionResponse, ApiResponse } from '../../types';

export default function ClientConnections() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [connections, setConnections] = useState<ConnectionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.token) fetchConnections();
  }, [user]);

  const fetchConnections = async () => {
    try {
      const res: ApiResponse<ConnectionResponse[]> = await api.get('/connections', user!.token);
      if (res.success) {
        setConnections(res.data || []);
      }
    } catch {
      setError('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const programLabel = (p: string) => {
    const labels: Record<string, string> = {
      FAT_LOSS: 'Fat Loss',
      MUSCLE_GAIN: 'Muscle Gain',
      STRENGTH_TRAINING: 'Strength Training',
      GENERAL_FITNESS: 'General Fitness',
      FLEXIBILITY: 'Flexibility',
      CUSTOM: 'Custom Program',
    };
    return labels[p] || p;
  };

  const pending = connections.filter(c => c.status === 'PENDING');
  const accepted = connections.filter(c => c.status === 'ACCEPTED');
  const others = connections.filter(c => c.status !== 'PENDING' && c.status !== 'ACCEPTED');

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
            <h1 className="text-lg font-bold tracking-tight">My Trainers</h1>
            <p className="text-xs text-white/70 font-medium">Your connections and requests</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4" style={{ color: '#cbd5e1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="font-semibold" style={{ color: '#334155' }}>No connections yet</p>
            <p className="text-sm mt-1 text-subtle">Find a trainer to get started!</p>
            <button
              onClick={() => navigate('/client/trainers')}
              className="mt-4 btn-primary px-6 py-2 text-sm"
            >
              Browse Trainers
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Connected Trainers */}
            {accepted.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#94a3b8' }}>Connected ({accepted.length})</h2>
                <div className="space-y-3">
                  {accepted.map(conn => (
                    <div key={conn.id} className="card p-4" style={{ borderLeft: '4px solid #059669' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
                          {conn.trainer.fullName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold" style={{ color: '#0f172a' }}>{conn.trainer.fullName}</h3>
                          {conn.trainer.specializations && (
                            <p className="text-xs text-subtle">{conn.trainer.specializations.join(' · ')}</p>
                          )}
                          <div className="mt-1 flex gap-2 text-xs">
                            <span className="tag tag-blue">{programLabel(conn.program)}</span>
                            <span className="tag tag-green">✓ Connected</span>
                          </div>
                          {/* Contact options */}
                          <div className="flex gap-2 mt-2">
                            {conn.trainer.phone && (
                              <a href={`tel:${conn.trainer.phone}`}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                                style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                                📞 Call
                              </a>
                            )}
                            {conn.trainer.phone && (
                              <a href={`https://wa.me/${conn.trainer.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                                style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                                💬 WhatsApp
                              </a>
                            )}
                            {conn.trainer.email && (
                              <a href={`mailto:${conn.trainer.email}`}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                                style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                                ✉️ Email
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Pending */}
            {pending.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#94a3b8' }}>Pending ({pending.length})</h2>
                <div className="space-y-3">
                  {pending.map(conn => (
                    <div key={conn.id} className="card p-4" style={{ borderLeft: '4px solid #f59e0b' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
                          {conn.trainer.fullName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold" style={{ color: '#0f172a' }}>{conn.trainer.fullName}</h3>
                          <div className="mt-1 flex gap-2 text-xs">
                            <span className="tag tag-blue">{programLabel(conn.program)}</span>
                            <span className="tag tag-orange">⏳ Awaiting Response</span>
                          </div>
                          {conn.notes && (
                            <p className="mt-1 text-xs italic text-subtle">"{conn.notes}"</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Declined / Other */}
            {others.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#94a3b8' }}>Past ({others.length})</h2>
                <div className="space-y-3">
                  {others.map(conn => (
                    <div key={conn.id} className="card p-4 opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: '#94a3b8' }}>
                          {conn.trainer.fullName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold" style={{ color: '#0f172a' }}>{conn.trainer.fullName}</h3>
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#f1f5f9', color: '#64748b' }}>
                            {conn.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
