import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { Profile, ApiResponse, SessionResponse, AssessmentResponse, ConnectionResponse } from '../../types';

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

  // Book session form
  const [showBookForm, setShowBookForm] = useState(false);
  const [bookConnectionId, setBookConnectionId] = useState('');
  const [bookDate, setBookDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookStartTime, setBookStartTime] = useState('09:00');
  const [bookEndTime, setBookEndTime] = useState('10:00');
  const [bookType, setBookType] = useState<'IN_PERSON' | 'VIRTUAL'>('IN_PERSON');
  const [bookNotes, setBookNotes] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (user?.token) {
      fetchAll(user.token);
    }
  }, [user]);

  const fetchAll = async (token: string) => {
    try {
      const [profileRes, countRes, todayRes, upcomingRes, assessRes, connRes] = await Promise.allSettled([
        api.get('/profiles/me', token),
        api.get('/connections/count', token),
        api.get('/sessions/today', token),
        api.get('/sessions/upcoming-list', token),
        api.get('/assessments', token),
        api.get('/connections?status=ACCEPTED', token),
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value.success) {
        setProfile(profileRes.value.data);
      }
      if (countRes.status === 'fulfilled' && countRes.value.success) {
        setActiveClients(countRes.value.data);
      }
      if (todayRes.status === 'fulfilled' && todayRes.value.success) {
        setTodaySessions(Array.isArray(todayRes.value.data) ? todayRes.value.data : []);
      }
      if (upcomingRes.status === 'fulfilled' && upcomingRes.value.success) {
        setUpcomingSessions(Array.isArray(upcomingRes.value.data) ? upcomingRes.value.data : []);
      }
      if (assessRes.status === 'fulfilled' && assessRes.value.success) {
        const all: AssessmentResponse[] = assessRes.value.data;
        setPendingReviews(all.filter(a => a.status === 'SUBMITTED'));
      }
      if (connRes.status === 'fulfilled' && connRes.value.success) {
        setConnections(connRes.value.data);
        if (connRes.value.data.length > 0 && !bookConnectionId) {
          setBookConnectionId(connRes.value.data[0].id);
        }
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
        fetchAll(user.token);
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
      fetchAll(user.token);
    } catch (err: any) {
      alert(err.message || 'Failed to complete');
    }
  };

  const cancelSession = async (sessionId: string) => {
    if (!user?.token) return;
    const reason = prompt('Reason for cancellation (optional):') || '';
    try {
      await api.put(`/sessions/${sessionId}/cancel`, { reason }, user.token);
      fetchAll(user.token);
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
    } catch (err: any) {
      alert(err.message || 'Failed to request reschedule');
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
