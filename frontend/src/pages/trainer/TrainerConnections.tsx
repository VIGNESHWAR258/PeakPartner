import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { ConnectionResponse, ApiResponse } from '../../types';

export default function TrainerConnections() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [connections, setConnections] = useState<ConnectionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'PENDING' | 'ACCEPTED' | 'ALL'>(() => {
    const t = searchParams.get('tab');
    if (t === 'ACCEPTED' || t === 'ALL') return t;
    return 'PENDING';
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.token) fetchConnections();
  }, [user, tab]);

  const fetchConnections = async () => {
    try {
      const statusParam = tab === 'ALL' ? '' : `?status=${tab}`;
      const res: ApiResponse<ConnectionResponse[]> = await api.get(`/connections${statusParam}`, user!.token);
      if (res.success) {
        setConnections(res.data || []);
      }
    } catch {
      setError('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    setActionLoading(id);
    try {
      await api.put(`/connections/${id}/accept`, {}, user!.token);
      fetchConnections();
    } catch (err: any) {
      setError(err.message || 'Failed to accept request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (id: string) => {
    setActionLoading(id);
    try {
      await api.put(`/connections/${id}/decline`, {}, user!.token);
      fetchConnections();
    } catch (err: any) {
      setError(err.message || 'Failed to decline request');
    } finally {
      setActionLoading(null);
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

  const statusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; border: string }> = {
      PENDING: { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
      ACCEPTED: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
      DECLINED: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
      CANCELLED: { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
    };
    const s = styles[status] || styles.CANCELLED;
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
        {status}
      </span>
    );
  };

  return (
    <div className="page-bg">
      <header className="gradient-bg text-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-3">
          <button
            onClick={() => navigate('/trainer/dashboard')}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Client Requests</h1>
            <p className="text-xs text-white/70 font-medium">Manage your connection requests</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Tab bar */}
        <div className="flex gap-1 p-1 mb-5 rounded-xl" style={{ background: '#f1f5f9' }}>
          {(['PENDING', 'ACCEPTED', 'ALL'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setLoading(true); }}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
              style={tab === t ? {
                background: '#fff', color: '#0f172a', boxShadow: '0 1px 3px rgb(0 0 0 / 0.08)'
              } : {
                color: '#64748b'
              }}
            >
              {t === 'PENDING' ? '⏳ Pending' : t === 'ACCEPTED' ? '✓ Connected' : '📋 All'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
            {error}
            <button onClick={() => setError('')} className="ml-2 underline">dismiss</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4" style={{ color: '#cbd5e1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="font-semibold" style={{ color: '#334155' }}>No {tab.toLowerCase()} requests</p>
            <p className="text-sm mt-1 text-subtle">Requests from clients will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map(conn => (
              <div key={conn.id} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' }}>
                    {conn.client.fullName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold" style={{ color: '#0f172a' }}>{conn.client.fullName}</h3>
                      {statusBadge(conn.status)}
                    </div>
                    <p className="text-sm text-subtle">{conn.client.email}</p>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="tag tag-blue">{programLabel(conn.program)}</span>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {new Date(conn.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {conn.notes && (
                      <div className="mt-2 p-2 rounded-lg text-sm italic" style={{ background: '#f8fafc', color: '#475569' }}>
                        "{conn.notes}"
                      </div>
                    )}

                    {/* Fitness Goals */}
                    {conn.client.fitnessGoals && conn.client.fitnessGoals.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {conn.client.fitnessGoals.map(g => (
                          <span key={g} className="tag tag-orange" style={{ fontSize: '0.7rem' }}>{g}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {conn.status === 'PENDING' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAccept(conn.id)}
                        disabled={actionLoading === conn.id}
                        className="px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
                        style={{ background: '#059669', color: '#fff' }}
                      >
                        {actionLoading === conn.id ? '...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleDecline(conn.id)}
                        disabled={actionLoading === conn.id}
                        className="px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
                        style={{ background: '#fef2f2', color: '#dc2626' }}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  {conn.status === 'ACCEPTED' && (
                    <button
                      onClick={() => navigate(`/trainer/client/${conn.id}`)}
                      className="btn-primary text-sm px-4 py-2 flex-shrink-0"
                    >
                      Manage
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
