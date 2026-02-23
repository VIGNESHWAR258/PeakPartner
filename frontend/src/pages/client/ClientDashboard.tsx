import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { Profile, AssessmentResponse, WorkoutPlanResponse, DietPlanResponse, SessionResponse, ConnectionResponse, RescheduleResponse } from '../../types';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Dashboard data
  const [pendingAssessments, setPendingAssessments] = useState<AssessmentResponse[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<WorkoutPlanResponse | null>(null);
  const [activeDiet, setActiveDiet] = useState<DietPlanResponse | null>(null);
  const [upcomingSession, setUpcomingSession] = useState<SessionResponse | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<SessionResponse[]>([]);
  const [todaySessions, setTodaySessions] = useState<SessionResponse[]>([]);
  const [pendingReschedules, setPendingReschedules] = useState<RescheduleResponse[]>([]);
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

  // Auto-sync: poll every 30 seconds
  useEffect(() => {
    if (!user?.token) return;
    const interval = setInterval(() => fetchAll(user.token), 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchAll = async (token: string) => {
    try {
      const [profileRes, assessRes, workoutRes, dietRes, upcomingRes, todayRes, connRes, upcomingListRes, rescheduleRes] = await Promise.allSettled([
        api.get('/profiles/me', token),
        api.get('/assessments', token),
        api.get('/plans/workout?role=client', token),
        api.get('/plans/diet?role=client', token),
        api.get('/sessions/upcoming', token),
        api.get('/sessions/today', token),
        api.get('/connections?status=ACCEPTED', token),
        api.get('/sessions/upcoming-list', token),
        api.get('/sessions/reschedule/pending', token),
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value.success) {
        setProfile(profileRes.value.data);
      }
      if (assessRes.status === 'fulfilled' && assessRes.value.success) {
        const all: AssessmentResponse[] = assessRes.value.data;
        setPendingAssessments(all.filter(a => a.status === 'PENDING'));
      }
      if (workoutRes.status === 'fulfilled' && workoutRes.value.success) {
        const plans: WorkoutPlanResponse[] = workoutRes.value.data;
        const active = plans.find(p => p.status === 'ACTIVE');
        if (active) setActiveWorkout(active);
      }
      if (dietRes.status === 'fulfilled' && dietRes.value.success) {
        const plans: DietPlanResponse[] = dietRes.value.data;
        const active = plans.find(p => p.status === 'ACTIVE');
        if (active) setActiveDiet(active);
      }
      if (upcomingRes.status === 'fulfilled' && upcomingRes.value.success) {
        setUpcomingSession(upcomingRes.value.data);
      }
      if (todayRes.status === 'fulfilled' && todayRes.value.success) {
        if (Array.isArray(todayRes.value.data)) {
          setTodaySessions(todayRes.value.data);
        }
      }
      if (connRes.status === 'fulfilled' && connRes.value.success) {
        setConnections(connRes.value.data);
        if (connRes.value.data.length > 0 && !bookConnectionId) {
          setBookConnectionId(connRes.value.data[0].id);
        }
      }
      if (upcomingListRes.status === 'fulfilled' && upcomingListRes.value.success) {
        setUpcomingSessions(Array.isArray(upcomingListRes.value.data) ? upcomingListRes.value.data : []);
      }
      if (rescheduleRes.status === 'fulfilled' && rescheduleRes.value.success) {
        setPendingReschedules(Array.isArray(rescheduleRes.value.data) ? rescheduleRes.value.data : []);
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
      fetchAll(user.token);
    } catch (err: any) {
      alert(err.message || 'Failed to request reschedule');
    }
  };

  const acceptReschedule = async (rescheduleId: string) => {
    if (!user?.token) return;
    try {
      await api.put(`/sessions/reschedule/${rescheduleId}/accept`, {}, user.token);
      fetchAll(user.token);
    } catch (err: any) {
      alert(err.message || 'Failed to accept reschedule');
    }
  };

  const declineReschedule = async (rescheduleId: string) => {
    if (!user?.token) return;
    try {
      await api.put(`/sessions/reschedule/${rescheduleId}/decline`, {}, user.token);
      fetchAll(user.token);
    } catch (err: any) {
      alert(err.message || 'Failed to decline reschedule');
    }
  };

  // Calculate today's workout day
  const getTodayWorkoutDay = () => {
    if (!activeWorkout) return null;
    const start = new Date(activeWorkout.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return null;
    const totalDays = activeWorkout.days.length;
    if (totalDays === 0) return null;
    const dayIndex = diffDays % totalDays;
    return activeWorkout.days.find(d => d.dayNumber === dayIndex + 1) || null;
  };

  const todayDay = getTodayWorkoutDay();

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
              {profile?.fullName?.charAt(0) || 'C'}
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Welcome back, {profile?.fullName?.split(' ')[0]}</h1>
              <p className="text-xs text-white/70 font-medium">Client Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/client/profile')}
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

        {/* Pending Assessments Alert */}
        {pendingAssessments.length > 0 && (
          <div className="p-4 rounded-xl" style={{ background: '#fff7ed', border: '1.5px solid #fed7aa' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#9a3412' }}>
                    {pendingAssessments.length} Pending Assessment{pendingAssessments.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#c2410c' }}>
                    {pendingAssessments.map(a => `"${a.title}" from ${a.trainer?.fullName || 'Trainer'}`).join(' • ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/client/plans?tab=assessment')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ background: '#ea580c', color: '#fff' }}
              >
                Fill Now
              </button>
            </div>
          </div>
        )}

        {/* Today's Overview */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Today's Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Today's Workout */}
            <div className="p-4 rounded-xl cursor-pointer hover:shadow-md transition-shadow" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
              onClick={() => navigate('/client/plans')}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">🏋️</span>
                <span className="text-xs font-medium" style={{ color: '#64748b' }}>Today's Workout</span>
              </div>
              {todayDay ? (
                <div>
                  <div className="text-sm font-semibold" style={{ color: '#1e293b' }}>
                    {todayDay.dayName || `Day ${todayDay.dayNumber}`}
                    {todayDay.focusArea && <span className="font-normal text-blue-600"> — {todayDay.focusArea}</span>}
                  </div>
                  <div className="text-xs mt-1" style={{ color: '#64748b' }}>
                    {todayDay.exercises.length} exercise{todayDay.exercises.length !== 1 ? 's' : ''}
                  </div>
                </div>
              ) : (
                <div className="text-sm font-semibold" style={{ color: '#1e293b' }}>
                  {activeWorkout ? 'Rest day' : 'No workout scheduled'}
                </div>
              )}
            </div>

            {/* Diet / Calories */}
            <div className="p-4 rounded-xl cursor-pointer hover:shadow-md transition-shadow" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}
              onClick={() => navigate('/client/plans')}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">🔥</span>
                <span className="text-xs font-medium" style={{ color: '#64748b' }}>Diet Plan</span>
              </div>
              {activeDiet ? (
                <div>
                  <div className="text-sm font-semibold" style={{ color: '#1e293b' }}>
                    {activeDiet.dailyCalorieTarget ? `${activeDiet.dailyCalorieTarget} kcal target` : activeDiet.title}
                  </div>
                  <div className="text-xs mt-1" style={{ color: '#64748b' }}>
                    {activeDiet.meals.length} meal{activeDiet.meals.length !== 1 ? 's' : ''} planned
                  </div>
                </div>
              ) : (
                <div className="text-sm font-semibold" style={{ color: '#1e293b' }}>No diet plan active</div>
              )}
            </div>

            {/* Next Session */}
            <div className="p-4 rounded-xl cursor-pointer hover:shadow-md transition-shadow" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
              onClick={() => setShowBookForm(!showBookForm)}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">📅</span>
                <span className="text-xs font-medium" style={{ color: '#64748b' }}>Next Session</span>
              </div>
              {upcomingSession ? (
                <div>
                  <div className="text-sm font-semibold" style={{ color: '#1e293b' }}>
                    {new Date(upcomingSession.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-xs mt-1" style={{ color: '#64748b' }}>
                    {upcomingSession.startTime} — {upcomingSession.sessionType === 'IN_PERSON' ? '🏢 In Person' : '💻 Virtual'}
                  </div>
                </div>
              ) : (
                <div className="text-sm font-semibold" style={{ color: '#1e293b' }}>No sessions booked</div>
              )}
            </div>
          </div>
        </div>

        {/* Today's Workout Details */}
        {todayDay && (
          <div className="card p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="section-title">
                Today's Exercises — {todayDay.dayName || `Day ${todayDay.dayNumber}`}
                {todayDay.focusArea && <span className="text-blue-500 font-normal ml-2">({todayDay.focusArea})</span>}
              </h2>
              <button onClick={() => navigate('/client/log')} className="btn-primary text-xs px-3 py-1.5">
                Log Workout
              </button>
            </div>
            <div className="space-y-2">
              {todayDay.exercises.map((ex, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: '#eff6ff', color: '#2563eb' }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>{ex.exerciseName}</p>
                    <p className="text-xs" style={{ color: '#64748b' }}>
                      {[
                        ex.sets && `${ex.sets} sets`,
                        ex.reps && `${ex.reps} reps`,
                        ex.weightSuggestion && ex.weightSuggestion,
                        ex.restSeconds && `${ex.restSeconds}s rest`,
                      ].filter(Boolean).join(' • ') || 'No details'}
                    </p>
                    {ex.instructions && (
                      <p className="text-xs mt-1 italic" style={{ color: '#6366f1' }}>📝 {ex.instructions}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {todayDay.notes && (
              <p className="text-xs mt-3 p-2 rounded-lg" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                💡 {todayDay.notes}
              </p>
            )}
          </div>
        )}

        {/* Today's Diet */}
        {activeDiet && activeDiet.meals.length > 0 && (
          <div className="card p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="section-title">Today's Meals</h2>
              <button onClick={() => navigate('/client/log')} className="btn-primary text-xs px-3 py-1.5">
                Log Meal
              </button>
            </div>
            <div className="space-y-3">
              {activeDiet.meals.map((meal, i) => (
                <div key={i} className="p-3 rounded-lg" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">🍽️</span>
                    <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>{meal.mealName}</p>
                    {meal.mealTime && <span className="text-xs tag tag-blue">{meal.mealTime}</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {meal.items.map((item, j) => (
                      <div key={j} className="text-xs">
                        <span className="px-2 py-0.5 rounded-full" style={{ background: '#ecfdf5', color: '#047857' }}>
                          {item.foodName}{item.quantity ? ` (${item.quantity})` : ''}
                        </span>
                        {item.instructions && (
                          <p className="text-xs mt-0.5 ml-2 italic" style={{ color: '#6366f1' }}>📝 {item.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                        {s.startTime} – {s.endTime}
                      </p>
                      <p className="text-xs" style={{ color: '#9a3412' }}>
                        with {s.trainerName} • {s.sessionType === 'IN_PERSON' ? 'In Person' : 'Virtual'}
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
                  {s.status === 'CANCELLED' && s.cancelReason && (
                    <p className="text-xs text-red-500 italic">Cancelled: {s.cancelReason}</p>
                  )}
                </div>
              ))}
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
                          {s.startTime} – {s.endTime} with {s.trainerName}
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
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#334155' }}>Trainer</label>
                <select
                  value={bookConnectionId}
                  onChange={e => setBookConnectionId(e.target.value)}
                  className="input"
                >
                  {connections.map(c => (
                    <option key={c.id} value={c.id}>{c.trainer.fullName}</option>
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
                <input type="text" value={bookNotes} onChange={e => setBookNotes(e.target.value)} className="input" placeholder="Any notes for the session..." />
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

        {showBookForm && connections.length === 0 && (
          <div className="card p-5 text-center">
            <p className="text-sm" style={{ color: '#64748b' }}>Connect with a trainer first to book sessions.</p>
            <button onClick={() => navigate('/client/trainers')} className="btn-primary text-sm mt-3 px-4 py-2">Find Trainer</button>
          </div>
        )}

        {/* Fitness Goals */}
        {profile?.fitnessGoals && profile.fitnessGoals.length > 0 && (
          <div className="card p-5">
            <h2 className="section-title mb-3">Your Fitness Goals</h2>
            <div className="flex flex-wrap gap-2">
              {profile.fitnessGoals.map((goal, index) => (
                <span key={index} className="tag tag-green">
                  🎯 {goal}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Connect to Trainer */}
        {connections.length > 0 && (
          <div className="card p-5">
            <h2 className="section-title mb-3">Quick Connect</h2>
            <div className="space-y-2">
              {connections.filter(c => c.status === 'ACCEPTED').map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg">
                      {c.trainer.avatarUrl ? <img src={c.trainer.avatarUrl} className="w-10 h-10 rounded-full object-cover" alt="" /> : '👨‍🏫'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{c.trainer.fullName}</p>
                      <p className="text-xs text-slate-500">{c.program.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {c.trainer.phone && (
                      <a href={`tel:${c.trainer.phone}`}
                        className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors" title="Call">
                        📞
                      </a>
                    )}
                    {c.trainer.phone && (
                      <a href={`https://wa.me/${c.trainer.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors" title="WhatsApp">
                        💬
                      </a>
                    )}
                    {c.trainer.email && (
                      <a href={`mailto:${c.trainer.email}`}
                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="Email">
                        ✉️
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              onClick={() => navigate('/client/trainers')}
              className="p-4 text-center rounded-xl transition-all group"
              style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🔍</div>
              <div className="text-xs font-semibold" style={{ color: '#334155' }}>Find Trainer</div>
            </button>
            <button
              onClick={() => navigate('/client/connections')}
              className="p-4 text-center rounded-xl transition-all group"
              style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🤝</div>
              <div className="text-xs font-semibold" style={{ color: '#334155' }}>My Trainers</div>
            </button>
            <button
              onClick={() => navigate('/client/plans')}
              className="p-4 text-center rounded-xl transition-all group"
              style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📋</div>
              <div className="text-xs font-semibold" style={{ color: '#334155' }}>My Plans</div>
            </button>
            <button
              onClick={() => navigate('/client/log')}
              className="p-4 text-center rounded-xl transition-all group"
              style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📝</div>
              <div className="text-xs font-semibold" style={{ color: '#334155' }}>Daily Log</div>
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
          </div>
        </div>
      </main>
    </div>
  );
}
