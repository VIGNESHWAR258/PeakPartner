import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, waitForBackend } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { Profile, SessionResponse, AssessmentResponse, ConnectionResponse, RescheduleResponse } from '../../types';

// Skeleton placeholder component for progressive loading
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />;
}

export default function TrainerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeClients, setActiveClients] = useState(0);

  // Dashboard data
  const [todaySessions, setTodaySessions] = useState<SessionResponse[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<SessionResponse[]>([]);
  const [pendingReviews, setPendingReviews] = useState<AssessmentResponse[]>([]);
  const [connections, setConnections] = useState<ConnectionResponse[]>([]);
  const [pendingReschedules, setPendingReschedules] = useState<RescheduleResponse[]>([]);

  // Book session form
  const [showBookForm, setShowBookForm] = useState(false);
  const [bookConnectionId, setBookConnectionId] = useState('');
  const [bookDate, setBookDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookStartTime, setBookStartTime] = useState('09:00');
  const [bookEndTime, setBookEndTime] = useState('10:00');
  const [bookType, setBookType] = useState<'IN_PERSON' | 'VIRTUAL'>('IN_PERSON');
  const [bookNotes, setBookNotes] = useState('');
  const [booking, setBooking] = useState(false);

  // Abort controller for cleanup on unmount
  const abortRef = useRef(false);
  useEffect(() => {
    abortRef.current = false;
    return () => { abortRef.current = true; };
  }, []);

  // --- Progressive data fetching: each section loads independently ---
  const fetchProfile = useCallback(async (token: string) => {
    try {
      const res = await api.get('/profiles/me', token);
      if (!abortRef.current && res.success) setProfile(res.data);
    } catch { /* silent */ }
  }, []);

  const fetchClientCount = useCallback(async (token: string) => {
    try {
      const res = await api.get('/connections/count', token);
      if (!abortRef.current && res.success) setActiveClients(res.data);
    } catch { /* silent */ }
  }, []);

  const fetchSessions = useCallback(async (token: string) => {
    try {
      const [todayRes, upcomingRes] = await Promise.allSettled([
        api.get('/sessions/today', token),
        api.get('/sessions/upcoming-list', token),
      ]);
      if (abortRef.current) return;
      if (todayRes.status === 'fulfilled' && todayRes.value.success) {
        setTodaySessions(Array.isArray(todayRes.value.data) ? todayRes.value.data : []);
      }
      if (upcomingRes.status === 'fulfilled' && upcomingRes.value.success) {
        setUpcomingSessions(Array.isArray(upcomingRes.value.data) ? upcomingRes.value.data : []);
      }
    } catch { /* silent */ }
  }, []);

  const fetchAssessments = useCallback(async (token: string) => {
    try {
      const res = await api.get('/assessments', token);
      if (!abortRef.current && res.success) {
        const all: AssessmentResponse[] = res.data;
        setPendingReviews(all.filter(a => a.status === 'SUBMITTED'));
      }
    } catch { /* silent */ }
  }, []);

  const fetchConnections = useCallback(async (token: string) => {
    try {
      const res = await api.get('/connections?status=ACCEPTED', token);
      if (!abortRef.current && res.success) {
        setConnections(res.data);
        if (res.data.length > 0) {
          setBookConnectionId(prev => prev || res.data[0].id);
        }
      }
    } catch { /* silent */ }
  }, []);

  const fetchReschedules = useCallback(async (token: string) => {
    try {
      const res = await api.get('/sessions/reschedule/pending', token);
      if (!abortRef.current && res.success) {
        setPendingReschedules(Array.isArray(res.data) ? res.data : []);
      }
    } catch { /* silent */ }
  }, []);

  const fetchAll = useCallback(async (token: string) => {
    // Fire all independently — each updates its section as it resolves
    await Promise.allSettled([
      fetchProfile(token),
      fetchClientCount(token),
      fetchSessions(token),
      fetchAssessments(token),
      fetchConnections(token),
      fetchReschedules(token),
    ]);
    if (!abortRef.current) setLoading(false);
  }, [fetchProfile, fetchClientCount, fetchSessions, fetchAssessments, fetchConnections, fetchReschedules]);

  // Initial load: wait for backend warm-up, then fetch
  useEffect(() => {
    if (!user?.token) return;
    let cancelled = false;
    (async () => {
      await waitForBackend();
      if (!cancelled) fetchAll(user.token);
    })();
    return () => { cancelled = true; };
  }, [user, fetchAll]);

  // Polling: 30s interval, pauses when tab is hidden
  useEffect(() => {
    if (!user?.token) return;
    let intervalId: ReturnType<typeof setInterval>;

    const startPolling = () => {
      intervalId = setInterval(() => fetchAll(user.token), 30000);
    };
    const stopPolling = () => clearInterval(intervalId);

    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchAll(user.token); // immediate refresh on tab focus
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user, fetchAll]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- Granular mutation re-fetches ---
  const bookSession = async () => {
    if (!user?.token || !bookConnectionId) return;
    setBooking(true);
    try {
      const res = await api.post('/sessions', {
        connectionId: bookConnectionId,
        sessionDate: bookDate,
        startTime: bookStartTime,
        endTime: bookEndTime,
        sessionType: bookType,
        notes: bookNotes || null,
      }, user.token);
      if (res.success) {
        setShowBookForm(false);
        setBookNotes('');
        fetchSessions(user.token); // only re-fetch sessions
      }
    } catch (err: any) {
      alert(err.message || 'Failed to book session');
    } finally {
      setBooking(false);
    }
  };

  const completeSession = async (sessionId: string) => {
    if (!user?.token) return;
    try {
      await api.put(`/sessions/${sessionId}/complete`, {}, user.token);
      fetchSessions(user.token);
    } catch (err: any) {
      alert(err.message || 'Failed to complete');
    }
  };

  const cancelSession = async (sessionId: string) => {
    if (!user?.token) return;
    const reason = prompt('Reason for cancellation (optional):') || '';
    try {
      await api.put(`/sessions/${sessionId}/cancel`, { reason }, user.token);
      fetchSessions(user.token);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel');
    }
  };

  const requestReschedule = async (sessionId: string) => {
    if (!user?.token) return;
    const proposedDate = prompt('Proposed new date (YYYY-MM-DD):');
    if (!proposedDate) return;
    const proposedStartTime = prompt('Proposed start time (HH:MM):');
    if (!proposedStartTime) return;
    const proposedEndTime = prompt('Proposed end time (HH:MM):');
    if (!proposedEndTime) return;
    const reason = prompt('Reason for reschedule (optional):') || '';
    try {
      await api.post('/sessions/reschedule', {
        sessionId,
        proposedDate,
        proposedStartTime,
        proposedEndTime,
        reason,
      }, user.token);
      alert('Reschedule request sent! Waiting for confirmation.');
      fetchReschedules(user.token);
      fetchSessions(user.token);
    } catch (err: any) {
      alert(err.message || 'Failed to request reschedule');
    }
  };

  const acceptReschedule = async (rescheduleId: string) => {
    if (!user?.token) return;
    try {
      await api.put(`/sessions/reschedule/${rescheduleId}/accept`, {}, user.token);
      fetchReschedules(user.token);
      fetchSessions(user.token);
    } catch (err: any) {
      alert(err.message || 'Failed to accept reschedule');
    }
  };

  const declineReschedule = async (rescheduleId: string) => {
    if (!user?.token) return;
    try {
      await api.put(`/sessions/reschedule/${rescheduleId}/decline`, {}, user.token);
      fetchReschedules(user.token);
    } catch (err: any) {
      alert(err.message || 'Failed to decline reschedule');
    }
  };

  // --- Progressive skeleton UI instead of full-page spinner ---
  if (loading) {
    return (
      <div className="page-bg">
        <header className="gradient-bg text-white sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-lg font-bold">T</div>
              <div>
                <Skeleton className="h-5 w-40 !bg-white/20" />
                <Skeleton className="h-3 w-24 mt-1 !bg-white/15" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-16 !bg-white/15 rounded-xl" />
              <Skeleton className="h-9 w-20 !bg-white/15 rounded-xl" />
            </div>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-4">
                <Skeleton className="w-9 h-9 mb-2.5" />
                <Skeleton className="h-7 w-10" />
                <Skeleton className="h-3 w-20 mt-1" />
              </div>
            ))}
          </div>
          <div className="card p-5 space-y-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="card p-5 space-y-3">
            <Skeleton className="h-5 w-28" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-bg">
      {/* Header */}
      <header className="gradient-bg text-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-lg font-bold">
              {profile?.fullName?.charAt(0) || 'T'}
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Welcome back, {profile?.fullName?.split(' ')[0]}</h1>
              <p className="text-xs text-white/70 font-medium">Trainer Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/trainer/profile')}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm font-medium backdrop-blur"
            >
              ✏️ Edit
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm font-medium backdrop-blur"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Pending Reviews Alert */}
        {pendingReviews.length > 0 && (
          <div className="p-4 rounded-xl" style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📝</span>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#1e40af' }}>
                    {pendingReviews.length} Assessment{pendingReviews.length > 1 ? 's' : ''} Awaiting Review
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#3b82f6' }}>
                    {pendingReviews.map(a => `"${a.title}" from ${a.client?.fullName || 'Client'}`).join(' • ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const first = pendingReviews[0];
                  if (first?.connectionId) {
                    navigate(`/trainer/client/${first.connectionId}?tab=assessment`);
                  } else {
                    navigate('/trainer/connections');
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ background: '#2563eb', color: '#fff' }}
              >
                Review
              </button>
            </div>
          </div>
        )}

        {/* Pending Reschedule Requests */}
        {pendingReschedules.length > 0 && (
          <div className="p-4 rounded-xl" style={{ background: '#fef3c7', border: '1.5px solid #fcd34d' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🔔</span>
              <p className="font-semibold text-sm" style={{ color: '#92400e' }}>
                {pendingReschedules.length} Reschedule Request{pendingReschedules.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="space-y-2">
              {pendingReschedules.map(rr => (
                <div key={rr.id} className="p-3 rounded-lg bg-white" style={{ border: '1px solid #fde68a' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>
                        {rr.requestedByName} wants to reschedule
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#92400e' }}>
                        New time: {new Date(rr.proposedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} {rr.proposedStartTime} – {rr.proposedEndTime}
                      </p>
                      {rr.reason && <p className="text-xs mt-0.5 italic" style={{ color: '#78716c' }}>Reason: {rr.reason}</p>}
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => acceptReschedule(rr.id)} className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors" style={{ background: '#dcfce7', color: '#166534' }}>
                        Accept
                      </button>
                      <button onClick={() => declineReschedule(rr.id)} className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors" style={{ background: '#fee2e2', color: '#991b1b' }}>
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile Summary */}
        {profile?.bio && (
          <div className="card p-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-md shadow-blue-500/20">
                {profile.fullName?.charAt(0)}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold" style={{ color: '#0f172a' }}>{profile.fullName}</h2>
                <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{profile.bio}</p>
                {profile.specializations && profile.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {profile.specializations.map((spec, i) => (
                      <span key={i} className="tag tag-blue">{spec}</span>
                    ))}
                  </div>
                )}
                {profile.certifications && profile.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {profile.certifications.map((cert, i) => (
                      <span key={i} className="tag tag-green">🎓 {cert}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ background: '#eff6ff' }}>
              <span className="text-lg">👥</span>
            </div>
            <p className="stat-value">{activeClients}</p>
            <p className="stat-label mt-0.5">Active Clients</p>
          </div>

          <div className="card p-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ background: '#ecfdf5' }}>
              <span className="text-lg">📅</span>
            </div>
            <p className="stat-value">{todaySessions.length}</p>
            <p className="stat-label mt-0.5">Today's Sessions</p>
          </div>

          <div className="card p-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ background: '#fefce8' }}>
              <span className="text-lg">⭐</span>
            </div>
            <p className="stat-value">{profile?.avgRating?.toFixed(1) || '—'}</p>
            <p className="stat-label mt-0.5">Rating</p>
          </div>
        </div>

        {/* Today's Sessions */}
        {todaySessions.length > 0 && (
          <div className="card p-5">
            <h2 className="section-title mb-3">Today's Sessions</h2>
            <div className="space-y-2">
              {todaySessions.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{s.sessionType === 'IN_PERSON' ? '🏢' : '💻'}</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>
                        {s.startTime} – {s.endTime} with {s.clientName}
                      </p>
                      <p className="text-xs" style={{ color: '#9a3412' }}>
                        {s.sessionType === 'IN_PERSON' ? 'In Person' : 'Virtual'}
                        {s.notes && ` • ${s.notes}`}
                      </p>
                    </div>
                  </div>
                  {s.status === 'BOOKED' && (
                    <div className="flex gap-1">
                      <button onClick={() => completeSession(s.id)} className="text-xs px-2 py-1 rounded-lg bg-green-50 hover:bg-green-100 transition-colors" style={{ color: '#047857' }}>
                        ✓ Done
                      </button>
                      <button onClick={() => requestReschedule(s.id)} className="text-xs px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors" style={{ color: '#2563eb' }}>
                        Reschedule
                      </button>
                      <button onClick={() => cancelSession(s.id)} className="text-xs px-2 py-1 rounded-lg hover:bg-red-50 transition-colors" style={{ color: '#dc2626' }}>
                        Cancel
                      </button>
                    </div>
                  )}
                  {s.status === 'CANCELLED' && s.cancelReason && (
                    <p className="text-xs text-red-500 italic">Cancelled: {s.cancelReason}</p>
                  )}
                  {s.status !== 'BOOKED' && (
                    <span className={`tag ${s.status === 'COMPLETED' ? 'tag-green' : 'tag-orange'}`}>{s.status}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Sessions */}
        {(() => {
          const futureOnly = upcomingSessions.filter(s => !todaySessions.some(ts => ts.id === s.id));
          if (futureOnly.length === 0) return null;
          return (
            <div className="card p-5">
              <h2 className="section-title mb-3">Upcoming Sessions</h2>
              <div className="space-y-2">
                {futureOnly.slice(0, 5).map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{s.sessionType === 'IN_PERSON' ? '🏢' : '💻'}</span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>
                          {new Date(s.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-xs" style={{ color: '#3b82f6' }}>
                          {s.startTime} – {s.endTime} with {s.clientName}
                        </p>
                      </div>
                    </div>
                    {s.status === 'BOOKED' && (
                      <div className="flex gap-1">
                        <button onClick={() => requestReschedule(s.id)} className="text-xs px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors" style={{ color: '#2563eb' }}>
                          Reschedule
                        </button>
                        <button onClick={() => cancelSession(s.id)} className="text-xs px-2 py-1 rounded-lg hover:bg-red-50 transition-colors" style={{ color: '#dc2626' }}>
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Book Session Form */}
        {showBookForm && connections.length > 0 && (
          <div className="card p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="section-title">Book a Session</h2>
              <button onClick={() => setShowBookForm(false)} className="text-sm text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#334155' }}>Client</label>
                <select value={bookConnectionId} onChange={e => setBookConnectionId(e.target.value)} className="input">
                  {connections.map(c => (
                    <option key={c.id} value={c.id}>{c.client.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#334155' }}>Session Type</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setBookType('IN_PERSON')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border ${bookType === 'IN_PERSON' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                    🏢 In Person
                  </button>
                  <button type="button" onClick={() => setBookType('VIRTUAL')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border ${bookType === 'VIRTUAL' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                    💻 Virtual
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#334155' }}>Date</label>
                <input type="date" value={bookDate} onChange={e => setBookDate(e.target.value)} className="input" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: '#334155' }}>Start</label>
                  <input type="time" value={bookStartTime} onChange={e => setBookStartTime(e.target.value)} className="input" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: '#334155' }}>End</label>
                  <input type="time" value={bookEndTime} onChange={e => setBookEndTime(e.target.value)} className="input" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#334155' }}>Notes (optional)</label>
                <input type="text" value={bookNotes} onChange={e => setBookNotes(e.target.value)} className="input" placeholder="Session notes..." />
              </div>
            </div>
            <button
              onClick={bookSession}
              disabled={booking || !bookConnectionId}
              className="btn-primary w-full mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {booking && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {booking ? 'Booking...' : 'Book Session'}
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => navigate('/trainer/connections')}
              className="p-4 text-center rounded-xl transition-all group"
              style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">👥</div>
              <div className="text-xs font-semibold" style={{ color: '#334155' }}>Client Requests</div>
            </button>
            <button
              onClick={() => setShowBookForm(true)}
              className="p-4 text-center rounded-xl transition-all group"
              style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📅</div>
              <div className="text-xs font-semibold" style={{ color: '#334155' }}>Book Session</div>
            </button>
            <button
              onClick={() => navigate('/trainer/connections?tab=ALL')}
              className="p-4 text-center rounded-xl transition-all group"
              style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">💪</div>
              <div className="text-xs font-semibold" style={{ color: '#334155' }}>Manage Clients</div>
            </button>
            <button
              className="p-4 text-center rounded-xl transition-all group"
              style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">⭐</div>
              <div className="text-xs font-semibold" style={{ color: '#334155' }}>Reviews</div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
