import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { ApiResponse, ConnectionResponse, AssessmentResponse, WorkoutPlanResponse, DietPlanResponse, MealLogResponse, ExerciseLogResponse, SessionResponse, QuestionType, AssessmentQuestion, AssessmentAnswer, PlanExercise } from '../../types';

export default function TrainerClientManage() {
  const { connectionId } = useParams<{ connectionId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [connection, setConnection] = useState<ConnectionResponse | null>(null);
  const [assessments, setAssessments] = useState<AssessmentResponse[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlanResponse[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlanResponse[]>([]);
  const [mealLogs, setMealLogs] = useState<MealLogResponse[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogResponse[]>([]);
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'assessment' | 'workout' | 'diet' | 'logs'>(() => {
    const tab = searchParams.get('tab');
    if (tab === 'assessment' || tab === 'workout' || tab === 'diet' || tab === 'logs' || tab === 'overview') return tab;
    return 'overview';
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // Assessment form
  const [assessTitle, setAssessTitle] = useState('');
  const [assessQuestions, setAssessQuestions] = useState<Array<{ type: QuestionType; question: string; options: string[] }>>(
    [{ type: 'TEXT', question: '', options: [] }]
  );
  const [showAssessForm, setShowAssessForm] = useState(false);

  // Workout plan form
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [wpTitle, setWpTitle] = useState('');
  const [wpDescription, setWpDescription] = useState('');
  const [wpDuration, setWpDuration] = useState('WEEKLY');
  const [wpStartDate, setWpStartDate] = useState('');
  const [wpEndDate, setWpEndDate] = useState('');
  const [wpDays, setWpDays] = useState<Array<{ dayNumber: number; dayName: string; focusArea: string; exercises: Array<{ exerciseName: string; sets: number; reps: string; weightSuggestion: string; restSeconds: number; notes: string; instructions: string }> }>>([]);

  // Diet plan form
  const [showDietForm, setShowDietForm] = useState(false);
  const [dpTitle, setDpTitle] = useState('');
  const [dpDescription, setDpDescription] = useState('');
  const [dpStartDate, setDpStartDate] = useState('');
  const [dpEndDate, setDpEndDate] = useState('');
  const [dpCalories, setDpCalories] = useState<number>(0);
  const [dpProtein, setDpProtein] = useState<number>(0);
  const [dpCarbs, setDpCarbs] = useState<number>(0);
  const [dpFat, setDpFat] = useState<number>(0);
  const [dpMeals, setDpMeals] = useState<Array<{ mealName: string; mealTime: string; items: Array<{ foodName: string; quantity: string; calories: number; proteinGrams: number; carbsGrams: number; fatGrams: number; alternatives: string; instructions: string }> }>>([]);

  // Trainer exercise logging
  const [exerciseLogDate, setExerciseLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSessionForLog, setSelectedSessionForLog] = useState<string>('');
  const [trainerExInputs, setTrainerExInputs] = useState<Record<string, { sets: number; reps: number; weight: number; duration: number; notes: string }>>({});
  const [logLoading, setLogLoading] = useState(false);

  // Daily view for plan vs actual
  const [dailyViewDate, setDailyViewDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyExLogs, setDailyExLogs] = useState<ExerciseLogResponse[]>([]);
  const [dailyMealLogs, setDailyMealLogs] = useState<MealLogResponse[]>([]);
  const [dailyLoading, setDailyLoading] = useState(false);

  useEffect(() => {
    if (user?.token && connectionId) {
      fetchData();
    }
  }, [user, connectionId]);

  // Auto-sync: poll every 30 seconds
  useEffect(() => {
    if (!user?.token || !connectionId) return;
    const interval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(interval);
  }, [user, connectionId]);

  const fetchData = async () => {
    if (!user?.token) return;
    try {
      const [connRes, wpRes, dpRes, mlRes, exRes, sessRes] = await Promise.all([
        api.get('/connections?status=ACCEPTED', user.token),
        api.get(`/plans/workout?connectionId=${connectionId}`, user.token),
        api.get(`/plans/diet?connectionId=${connectionId}`, user.token),
        api.get(`/plans/meal-logs?connectionId=${connectionId}`, user.token),
        api.get(`/plans/exercise-logs?connectionId=${connectionId}`, user.token),
        api.get('/sessions', user.token),
      ]);

      if (connRes.success) {
        const conn = connRes.data.find((c: ConnectionResponse) => c.id === connectionId);
        setConnection(conn || null);
      }
      if (wpRes.success) setWorkoutPlans(wpRes.data);
      if (dpRes.success) setDietPlans(dpRes.data);
      if (mlRes.success) setMealLogs(mlRes.data);
      if (exRes.success) setExerciseLogs(exRes.data);
      if (sessRes.success) {
        // Filter IN_PERSON sessions for this connection
        const connSessions = (sessRes.data as SessionResponse[]).filter(
          s => s.connectionId === connectionId && s.sessionType === 'IN_PERSON' && s.status !== 'CANCELLED'
        );
        setSessions(connSessions);
      }

      // Fetch assessments
      try {
        const assessRes: ApiResponse<AssessmentResponse[]> = await api.get('/assessments', user.token);
        if (assessRes.success) {
          setAssessments(assessRes.data.filter((a: AssessmentResponse) => a.connectionId === connectionId));
        }
      } catch {}
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyView = async () => {
    if (!user?.token || !connectionId) return;
    setDailyLoading(true);
    try {
      const [exRes, mlRes] = await Promise.all([
        api.get(`/plans/exercise-logs?connectionId=${connectionId}&date=${dailyViewDate}`, user.token),
        api.get(`/plans/meal-logs?connectionId=${connectionId}&date=${dailyViewDate}`, user.token),
      ]);
      if (exRes.success) setDailyExLogs(exRes.data);
      if (mlRes.success) setDailyMealLogs(mlRes.data);
    } catch (error) {
      console.error('Failed to fetch daily view:', error);
    } finally {
      setDailyLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token && connectionId && activeTab === 'logs') {
      fetchDailyView();
    }
  }, [user, connectionId, dailyViewDate, activeTab]);

  const createAssessment = async () => {
    if (!user?.token || !connectionId) return;
    if (!assessTitle.trim()) { showToast('error', 'Please enter a title'); return; }
    const validQuestions = assessQuestions.filter(q => q.question.trim());
    if (validQuestions.length === 0) { showToast('error', 'Add at least one question'); return; }
    for (const q of validQuestions) {
      if (q.type !== 'TEXT' && q.options.filter(o => o.trim()).length < 2) {
        showToast('error', `Choice question "${q.question}" needs at least 2 options`); return;
      }
    }
    try {
      const structured: AssessmentQuestion[] = validQuestions.map(q => ({
        type: q.type,
        question: q.question,
        ...(q.type !== 'TEXT' ? { options: q.options.filter(o => o.trim()) } : {}),
      }));
      await api.post('/assessments', {
        connectionId,
        title: assessTitle,
        questions: JSON.stringify(structured),
      }, user.token);
      setShowAssessForm(false);
      setAssessTitle('');
      setAssessQuestions([{ type: 'TEXT', question: '', options: [] }]);
      showToast('success', 'Assessment created successfully');
      fetchData();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to create assessment');
    }
  };

  const reviewAssessment = async (assessId: string, notes: string) => {
    if (!user?.token) return;
    try {
      await api.put(`/assessments/${assessId}/review`, { notes }, user.token);
      showToast('success', 'Assessment reviewed');
      fetchData();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to review assessment');
    }
  };

  const createWorkoutPlan = async () => {
    if (!user?.token || !connectionId || !connection) return;
    if (!wpTitle.trim()) { showToast('error', 'Please enter a plan title'); return; }
    if (!wpStartDate || !wpEndDate) { showToast('error', 'Please select start and end dates'); return; }
    if (wpDays.length === 0) { showToast('error', 'Add at least one day'); return; }
    for (const day of wpDays) {
      if (day.exercises.length === 0) {
        showToast('error', `${day.dayName || 'Day'} needs at least one exercise`); return;
      }
      for (const ex of day.exercises) {
        if (!ex.exerciseName.trim()) {
          showToast('error', `All exercises must have a name`); return;
        }
      }
    }
    try {
      await api.post('/plans/workout', {
        connectionId,
        title: wpTitle,
        description: wpDescription,
        program: connection.program,
        duration: wpDuration,
        startDate: wpStartDate,
        endDate: wpEndDate,
        days: wpDays,
      }, user.token);
      setShowWorkoutForm(false);
      resetWorkoutForm();
      showToast('success', 'Workout plan created');
      fetchData();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to create workout plan');
    }
  };

  const createDietPlan = async () => {
    if (!user?.token || !connectionId) return;
    if (!dpTitle.trim()) { showToast('error', 'Please enter a plan title'); return; }
    if (!dpStartDate || !dpEndDate) { showToast('error', 'Please select start and end dates'); return; }
    try {
      await api.post('/plans/diet', {
        connectionId,
        title: dpTitle,
        description: dpDescription,
        startDate: dpStartDate,
        endDate: dpEndDate,
        dailyCalorieTarget: dpCalories || null,
        proteinGrams: dpProtein || null,
        carbsGrams: dpCarbs || null,
        fatGrams: dpFat || null,
        meals: dpMeals,
      }, user.token);
      setShowDietForm(false);
      resetDietForm();
      showToast('success', 'Diet plan created');
      fetchData();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to create diet plan');
    }
  };

  const activateWorkoutPlan = async (planId: string) => {
    if (!user?.token) return;
    try {
      await api.put(`/plans/workout/${planId}/activate`, {}, user.token);
      showToast('success', 'Workout plan activated');
      fetchData();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to activate plan');
    }
  };

  const activateDietPlan = async (planId: string) => {
    if (!user?.token) return;
    try {
      await api.put(`/plans/diet/${planId}/activate`, {}, user.token);
      showToast('success', 'Diet plan activated');
      fetchData();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to activate plan');
    }
  };

  const cancelWorkoutPlan = async (planId: string) => {
    if (!user?.token) return;
    if (!confirm('Cancel this workout plan? You can create a new one after.')) return;
    try {
      await api.put(`/plans/workout/${planId}/cancel`, {}, user.token);
      showToast('success', 'Workout plan cancelled');
      fetchData();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to cancel plan');
    }
  };

  const cancelDietPlan = async (planId: string) => {
    if (!user?.token) return;
    if (!confirm('Cancel this diet plan? You can create a new one after.')) return;
    try {
      await api.put(`/plans/diet/${planId}/cancel`, {}, user.token);
      showToast('success', 'Diet plan cancelled');
      fetchData();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to cancel plan');
    }
  };

  const verifyMealLog = async (logId: string) => {
    if (!user?.token) return;
    try {
      await api.put(`/plans/meal-logs/${logId}/verify`, {}, user.token);
      showToast('success', 'Meal log verified');
      fetchData();
      fetchDailyView();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to verify');
    }
  };

  const resetWorkoutForm = () => {
    setWpTitle(''); setWpDescription(''); setWpDuration('WEEKLY');
    setWpStartDate(''); setWpEndDate('');
    setWpDays([]);
  };

  const resetDietForm = () => {
    setDpTitle(''); setDpDescription(''); setDpStartDate(''); setDpEndDate('');
    setDpCalories(0); setDpProtein(0); setDpCarbs(0); setDpFat(0);
    setDpMeals([]);
  };

  const addDay = () => {
    setWpDays([...wpDays, { dayNumber: wpDays.length + 1, dayName: `Day ${wpDays.length + 1}`, focusArea: '', exercises: [] }]);
  };

  const addExercise = (dayIndex: number) => {
    const updated = [...wpDays];
    updated[dayIndex].exercises.push({ exerciseName: '', sets: 3, reps: '10', weightSuggestion: '', restSeconds: 60, notes: '', instructions: '' });
    setWpDays(updated);
  };

  const addMeal = () => {
    setDpMeals([...dpMeals, { mealName: '', mealTime: '', items: [] }]);
  };

  const addMealItem = (mealIndex: number) => {
    const updated = [...dpMeals];
    updated[mealIndex].items.push({ foodName: '', quantity: '', calories: 0, proteinGrams: 0, carbsGrams: 0, fatGrams: 0, alternatives: '', instructions: '' });
    setDpMeals(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center page-bg">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'assessment', label: 'Assessments' },
    { key: 'workout', label: 'Workout Plans' },
    { key: 'diet', label: 'Diet Plans' },
    { key: 'logs', label: 'Client Logs' },
  ] as const;

  return (
    <div className="page-bg">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg text-sm font-semibold text-white transition-all animate-[fadeIn_0.2s] ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}
      <header className="gradient-bg text-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/trainer/connections')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              ← Back
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                {connection?.client?.fullName || 'Client'}
              </h1>
              <p className="text-xs text-white/70 font-medium">
                {connection?.program?.replace(/_/g, ' ')} • Connected
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-blue-50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-4">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="card p-4 text-center">
                <p className="stat-value">{assessments.length}</p>
                <p className="stat-label">Assessments</p>
              </div>
              <div className="card p-4 text-center">
                <p className="stat-value">{workoutPlans.length}</p>
                <p className="stat-label">Workout Plans</p>
              </div>
              <div className="card p-4 text-center">
                <p className="stat-value">{dietPlans.length}</p>
                <p className="stat-label">Diet Plans</p>
              </div>
              <div className="card p-4 text-center">
                <p className="stat-value">{mealLogs.filter(l => !l.trainerVerified).length}</p>
                <p className="stat-label">Pending Reviews</p>
              </div>
            </div>
            <div className="card p-5">
              <h3 className="section-title mb-3">Client Info</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold text-slate-700">Name:</span> <span className="text-slate-600">{connection?.client?.fullName}</span></p>
                <p><span className="font-semibold text-slate-700">Email:</span> <span className="text-slate-600">{connection?.client?.email}</span></p>
                <p><span className="font-semibold text-slate-700">Program:</span> <span className="tag tag-blue">{connection?.program?.replace(/_/g, ' ')}</span></p>
                {connection?.client?.fitnessGoals && connection.client.fitnessGoals.length > 0 && (
                  <div>
                    <span className="font-semibold text-slate-700">Goals:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {connection.client.fitnessGoals.map((g, i) => (
                        <span key={i} className="tag tag-green">{g}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ASSESSMENTS TAB */}
        {activeTab === 'assessment' && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="section-title">Assessments</h2>
              <button onClick={() => setShowAssessForm(true)} className="btn-primary text-sm px-4 py-2">
                + Create Assessment
              </button>
            </div>

            {showAssessForm && (
              <div className="card p-5 space-y-4">
                <h3 className="font-semibold text-slate-800">New Assessment</h3>
                <input
                  value={assessTitle}
                  onChange={e => setAssessTitle(e.target.value)}
                  placeholder="Assessment Title"
                  className="input"
                />
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700">Questions</label>
                  {assessQuestions.map((q, i) => (
                    <div key={i} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-500">Question {i + 1}</span>
                        {assessQuestions.length > 1 && (
                          <button onClick={() => setAssessQuestions(assessQuestions.filter((_, j) => j !== i))} className="text-red-500 text-xs">Remove</button>
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        <select
                          value={q.type}
                          onChange={e => {
                            const newType = e.target.value as QuestionType;
                            setAssessQuestions(prev => prev.map((item, idx) =>
                              idx === i ? { ...item, type: newType, options: newType !== 'TEXT' && item.options.length === 0 ? ['', ''] : item.options } : item
                            ));
                          }}
                          className="input text-sm"
                          style={{ width: '10rem', flexShrink: 0 }}
                        >
                          <option value="TEXT">Text Answer</option>
                          <option value="SINGLE_CHOICE">Single Choice</option>
                          <option value="MULTI_CHOICE">Multiple Choice</option>
                        </select>
                        <input
                          value={q.question}
                          onChange={e => {
                            const val = e.target.value;
                            setAssessQuestions(prev => prev.map((item, idx) =>
                              idx === i ? { ...item, question: val } : item
                            ));
                          }}
                          placeholder="Enter question"
                          className="input"
                          style={{ flex: 1, minWidth: 0 }}
                        />
                      </div>
                      {(q.type === 'SINGLE_CHOICE' || q.type === 'MULTI_CHOICE') && (
                        <div className="space-y-1 ml-2">
                          <label className="text-xs text-slate-500">Options</label>
                          {q.options.map((opt, oi) => (
                            <div key={oi} className="flex gap-1 items-center">
                              <span className="text-xs text-slate-400 w-4">{oi + 1}.</span>
                              <input
                                value={opt}
                                onChange={e => {
                                  const val = e.target.value;
                                  setAssessQuestions(prev => prev.map((item, idx) =>
                                    idx === i ? { ...item, options: item.options.map((o, j) => j === oi ? val : o) } : item
                                  ));
                                }}
                                placeholder={`Option ${oi + 1}`}
                                className="input text-sm flex-1"
                              />
                              <button onClick={() => {
                                setAssessQuestions(prev => prev.map((item, idx) =>
                                  idx === i ? { ...item, options: item.options.filter((_, j) => j !== oi) } : item
                                ));
                              }} className="text-red-400 text-xs">✕</button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              setAssessQuestions(prev => prev.map((item, idx) =>
                                idx === i ? { ...item, options: [...item.options, ''] } : item
                              ));
                            }}
                            className="text-xs text-blue-600 font-semibold"
                          >+ Add Option</button>
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setAssessQuestions([...assessQuestions, { type: 'TEXT', question: '', options: [] }])}
                    className="text-sm text-blue-600 font-semibold"
                  >+ Add Question</button>
                </div>
                <div className="flex gap-2">
                  <button onClick={createAssessment} className="btn-primary text-sm px-4 py-2">Create</button>
                  <button onClick={() => setShowAssessForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                </div>
              </div>
            )}

            {assessments.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-2xl mb-2">📋</p>
                <p className="text-sm font-semibold text-slate-600">No assessments yet</p>
                <p className="text-xs text-slate-400 mt-1">Create an assessment for your client to fill out</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assessments.map(a => {
                  let questions: AssessmentQuestion[] = [];
                  let answers: AssessmentAnswer[] = [];
                  try { questions = JSON.parse(a.questions || '[]'); } catch {}
                  try { answers = JSON.parse(a.answers || '[]'); } catch {}

                  return (
                    <div key={a.id} className="card p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-slate-800">{a.title}</h3>
                          <span className={`tag ${a.status === 'PENDING' ? 'tag-orange' : a.status === 'SUBMITTED' ? 'tag-blue' : 'tag-green'} mt-1`}>
                            {a.status}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="space-y-3">
                        {questions.map((q, i) => {
                          const qObj = typeof q === 'string' ? { type: 'TEXT' as QuestionType, question: q } : q;
                          const ans = answers[i];
                          const ansVal = ans ? (typeof ans === 'string' ? ans : ans.value) : null;
                          return (
                            <div key={i} className="text-sm">
                              <p className="font-medium text-slate-700">
                                Q{i + 1}: {qObj.question}
                                <span className="ml-2 text-xs text-slate-400">
                                  ({qObj.type === 'TEXT' ? 'Text' : qObj.type === 'SINGLE_CHOICE' ? 'Single Choice' : 'Multiple Choice'})
                                </span>
                              </p>
                              {ansVal && (
                                <p className="text-slate-600 mt-1 pl-4 border-l-2 border-blue-200">
                                  {Array.isArray(ansVal) ? ansVal.join(', ') : ansVal}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {a.status === 'SUBMITTED' && (
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <button
                            onClick={() => {
                              const notes = prompt('Enter review notes (optional):') || '';
                              reviewAssessment(a.id, notes);
                            }}
                            className="btn-primary text-sm px-4 py-2"
                          >Mark as Reviewed</button>
                        </div>
                      )}
                      {a.trainerNotes && (
                        <div className="mt-3 p-3 rounded-lg bg-green-50 border border-green-200">
                          <p className="text-xs font-semibold text-green-700">Trainer Notes</p>
                          <p className="text-sm text-green-800 mt-1">{a.trainerNotes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* WORKOUT PLANS TAB */}
        {activeTab === 'workout' && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="section-title">Workout Plans</h2>
              <button onClick={() => setShowWorkoutForm(true)} className="btn-primary text-sm px-4 py-2">
                + Create Plan
              </button>
            </div>

            {showWorkoutForm && (
              <div className="card p-5 space-y-4">
                <h3 className="font-semibold text-slate-800">New Workout Plan</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input value={wpTitle} onChange={e => setWpTitle(e.target.value)} placeholder="Plan Title" className="input" />
                  <select value={wpDuration} onChange={e => setWpDuration(e.target.value)} className="input">
                    <option value="WEEKLY">1 Week</option>
                    <option value="MONTHLY">1 Month</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                  <input type="date" value={wpStartDate} onChange={e => setWpStartDate(e.target.value)} className="input" />
                  <input type="date" value={wpEndDate} onChange={e => setWpEndDate(e.target.value)} className="input" />
                </div>
                <textarea value={wpDescription} onChange={e => setWpDescription(e.target.value)} placeholder="Description (optional)" className="input" rows={2} />

                {/* Days */}
                <div className="space-y-3">
                  {wpDays.map((day, di) => (
                    <div key={di} className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-sm text-slate-700">Day {day.dayNumber}</h4>
                        <button onClick={() => setWpDays(wpDays.filter((_, i) => i !== di))} className="text-red-500 text-xs">Remove</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={day.dayName}
                          onChange={e => { const u = [...wpDays]; u[di].dayName = e.target.value; setWpDays(u); }}
                          placeholder="Day Name (e.g. Monday)"
                          className="input text-sm"
                        />
                        <input
                          value={day.focusArea}
                          onChange={e => { const u = [...wpDays]; u[di].focusArea = e.target.value; setWpDays(u); }}
                          placeholder="Focus (e.g. Chest & Triceps)"
                          className="input text-sm"
                        />
                      </div>
                      {/* Exercises */}
                      {day.exercises.map((ex, ei) => (
                        <div key={ei} className="space-y-1.5">
                          <div className="grid grid-cols-6 gap-2 items-center">
                          <input
                            value={ex.exerciseName}
                            onChange={e => { const u = [...wpDays]; u[di].exercises[ei].exerciseName = e.target.value; setWpDays(u); }}
                            placeholder="Exercise"
                            className="input text-xs col-span-2"
                          />
                          <input
                            type="number"
                            value={ex.sets}
                            onChange={e => { const u = [...wpDays]; u[di].exercises[ei].sets = Number(e.target.value); setWpDays(u); }}
                            placeholder="Sets"
                            className="input text-xs"
                          />
                          <input
                            value={ex.reps}
                            onChange={e => { const u = [...wpDays]; u[di].exercises[ei].reps = e.target.value; setWpDays(u); }}
                            placeholder="Reps"
                            className="input text-xs"
                          />
                          <input
                            value={ex.weightSuggestion}
                            onChange={e => { const u = [...wpDays]; u[di].exercises[ei].weightSuggestion = e.target.value; setWpDays(u); }}
                            placeholder="Weight"
                            className="input text-xs"
                          />
                          <button onClick={() => { const u = [...wpDays]; u[di].exercises.splice(ei, 1); setWpDays(u); }} className="text-red-500 text-xs">✕</button>
                          </div>
                          <input
                            value={ex.instructions || ''}
                            onChange={e => { const u = [...wpDays]; u[di].exercises[ei].instructions = e.target.value; setWpDays(u); }}
                            placeholder="Instructions (e.g. Keep back straight, 2 sec pause at bottom)"
                            className="input text-xs"
                          />
                        </div>
                      ))}
                      <button onClick={() => addExercise(di)} className="text-xs text-blue-600 font-semibold">+ Add Exercise</button>
                    </div>
                  ))}
                  <button onClick={addDay} className="text-sm text-blue-600 font-semibold">+ Add Day</button>
                </div>

                <div className="flex gap-2">
                  <button onClick={createWorkoutPlan} className="btn-primary text-sm px-4 py-2">Create Plan</button>
                  <button onClick={() => { setShowWorkoutForm(false); resetWorkoutForm(); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                </div>
              </div>
            )}

            {workoutPlans.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-2xl mb-2">💪</p>
                <p className="text-sm font-semibold text-slate-600">No workout plans</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workoutPlans.map(plan => (
                  <div key={plan.id} className="card p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-800">{plan.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{plan.startDate} → {plan.endDate} • {plan.duration}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`tag ${plan.status === 'ACTIVE' ? 'tag-green' : plan.status === 'DRAFT' ? 'tag-orange' : plan.status === 'ARCHIVED' ? 'tag-blue' : 'tag-blue'}`}>
                          {plan.status === 'ARCHIVED' ? 'CANCELLED' : plan.status}
                        </span>
                        {plan.status === 'DRAFT' && (
                          <button onClick={() => activateWorkoutPlan(plan.id)} className="text-xs text-blue-600 font-semibold hover:underline">
                            Activate
                          </button>
                        )}
                        {(plan.status === 'DRAFT' || plan.status === 'ACTIVE') && (
                          <button onClick={() => cancelWorkoutPlan(plan.id)} className="text-xs text-red-500 font-semibold hover:underline">
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                    {plan.description && <p className="text-sm text-slate-600 mb-3">{plan.description}</p>}
                    {plan.days && plan.days.length > 0 && (
                      <div className="space-y-2">
                        {plan.days.map(day => (
                          <div key={day.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                            <p className="text-sm font-semibold text-slate-700">{day.dayName || `Day ${day.dayNumber}`} {day.focusArea && `— ${day.focusArea}`}</p>
                            {day.exercises && day.exercises.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {day.exercises.map((ex, i) => (
                                  <div key={i}>
                                    <p className="text-xs text-slate-600">
                                      • {ex.exerciseName} — {ex.sets}×{ex.reps} {ex.weightSuggestion && `@ ${ex.weightSuggestion}`}
                                    </p>
                                    {ex.instructions && <p className="text-xs ml-3 italic" style={{ color: '#6366f1' }}>📝 {ex.instructions}</p>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* DIET PLANS TAB */}
        {activeTab === 'diet' && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="section-title">Diet Plans</h2>
              <button onClick={() => setShowDietForm(true)} className="btn-primary text-sm px-4 py-2">
                + Create Plan
              </button>
            </div>

            {showDietForm && (
              <div className="card p-5 space-y-4">
                <h3 className="font-semibold text-slate-800">New Diet Plan</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input value={dpTitle} onChange={e => setDpTitle(e.target.value)} placeholder="Plan Title" className="input" />
                  <div className="flex gap-2">
                    <input type="date" value={dpStartDate} onChange={e => setDpStartDate(e.target.value)} className="input" />
                    <input type="date" value={dpEndDate} onChange={e => setDpEndDate(e.target.value)} className="input" />
                  </div>
                </div>
                <textarea value={dpDescription} onChange={e => setDpDescription(e.target.value)} placeholder="Description (optional)" className="input" rows={2} />
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Calories</label>
                    <input type="number" value={dpCalories || ''} onChange={e => setDpCalories(Number(e.target.value))} className="input text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Protein (g)</label>
                    <input type="number" value={dpProtein || ''} onChange={e => setDpProtein(Number(e.target.value))} className="input text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Carbs (g)</label>
                    <input type="number" value={dpCarbs || ''} onChange={e => setDpCarbs(Number(e.target.value))} className="input text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Fat (g)</label>
                    <input type="number" value={dpFat || ''} onChange={e => setDpFat(Number(e.target.value))} className="input text-sm" />
                  </div>
                </div>

                {/* Meals */}
                <div className="space-y-3">
                  {dpMeals.map((meal, mi) => (
                    <div key={mi} className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-sm text-slate-700">Meal {mi + 1}</h4>
                        <button onClick={() => setDpMeals(dpMeals.filter((_, i) => i !== mi))} className="text-red-500 text-xs">Remove</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={meal.mealName}
                          onChange={e => { const u = [...dpMeals]; u[mi].mealName = e.target.value; setDpMeals(u); }}
                          placeholder="Meal Name (e.g. Breakfast)"
                          className="input text-sm"
                        />
                        <input
                          value={meal.mealTime}
                          onChange={e => { const u = [...dpMeals]; u[mi].mealTime = e.target.value; setDpMeals(u); }}
                          placeholder="Time (e.g. 08:00)"
                          className="input text-sm"
                          type="time"
                        />
                      </div>
                      {meal.items.map((item, ii) => (
                        <div key={ii} className="space-y-1.5">
                          <div className="grid grid-cols-7 gap-1.5 items-center">
                          <input value={item.foodName} onChange={e => { const u = [...dpMeals]; u[mi].items[ii].foodName = e.target.value; setDpMeals(u); }} placeholder="Food" className="input text-xs col-span-2" />
                          <input value={item.quantity} onChange={e => { const u = [...dpMeals]; u[mi].items[ii].quantity = e.target.value; setDpMeals(u); }} placeholder="Qty" className="input text-xs" />
                          <input type="number" value={item.calories || ''} onChange={e => { const u = [...dpMeals]; u[mi].items[ii].calories = Number(e.target.value); setDpMeals(u); }} placeholder="Cal" className="input text-xs" />
                          <input type="number" value={item.proteinGrams || ''} onChange={e => { const u = [...dpMeals]; u[mi].items[ii].proteinGrams = Number(e.target.value); setDpMeals(u); }} placeholder="P(g)" className="input text-xs" />
                          <input type="number" value={item.carbsGrams || ''} onChange={e => { const u = [...dpMeals]; u[mi].items[ii].carbsGrams = Number(e.target.value); setDpMeals(u); }} placeholder="C(g)" className="input text-xs" />
                          <button onClick={() => { const u = [...dpMeals]; u[mi].items.splice(ii, 1); setDpMeals(u); }} className="text-red-500 text-xs">✕</button>
                          </div>
                          <input value={item.instructions || ''} onChange={e => { const u = [...dpMeals]; u[mi].items[ii].instructions = e.target.value; setDpMeals(u); }} placeholder="Instructions (e.g. Steam, not fry; add olive oil)" className="input text-xs" />
                        </div>
                      ))}
                      <button onClick={() => addMealItem(mi)} className="text-xs text-blue-600 font-semibold">+ Add Item</button>
                    </div>
                  ))}
                  <button onClick={addMeal} className="text-sm text-blue-600 font-semibold">+ Add Meal</button>
                </div>

                <div className="flex gap-2">
                  <button onClick={createDietPlan} className="btn-primary text-sm px-4 py-2">Create Plan</button>
                  <button onClick={() => { setShowDietForm(false); resetDietForm(); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                </div>
              </div>
            )}

            {dietPlans.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-2xl mb-2">🥗</p>
                <p className="text-sm font-semibold text-slate-600">No diet plans</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dietPlans.map(plan => (
                  <div key={plan.id} className="card p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-800">{plan.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{plan.startDate} → {plan.endDate}</p>
                        {plan.dailyCalorieTarget && (
                          <p className="text-xs text-slate-500">{plan.dailyCalorieTarget} cal/day • P:{plan.proteinGrams}g C:{plan.carbsGrams}g F:{plan.fatGrams}g</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`tag ${plan.status === 'ACTIVE' ? 'tag-green' : plan.status === 'DRAFT' ? 'tag-orange' : plan.status === 'ARCHIVED' ? 'tag-blue' : 'tag-blue'}`}>
                          {plan.status === 'ARCHIVED' ? 'CANCELLED' : plan.status}
                        </span>
                        {plan.status === 'DRAFT' && (
                          <button onClick={() => activateDietPlan(plan.id)} className="text-xs text-blue-600 font-semibold hover:underline">
                            Activate
                          </button>
                        )}
                        {(plan.status === 'DRAFT' || plan.status === 'ACTIVE') && (
                          <button onClick={() => cancelDietPlan(plan.id)} className="text-xs text-red-500 font-semibold hover:underline">
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                    {plan.meals && plan.meals.length > 0 && (
                      <div className="space-y-2">
                        {plan.meals.map(meal => (
                          <div key={meal.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                            <p className="text-sm font-semibold text-slate-700">{meal.mealName} {meal.mealTime && `(${meal.mealTime})`}</p>
                            {meal.items && meal.items.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {meal.items.map((item, i) => (
                                  <div key={i}>
                                    <p className="text-xs text-slate-600">
                                      • {item.foodName} {item.quantity && `— ${item.quantity}`} {item.calories && `(${item.calories} cal)`}
                                    </p>
                                    {item.instructions && <p className="text-xs ml-3 italic" style={{ color: '#6366f1' }}>📝 {item.instructions}</p>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* LOGS TAB */}
        {activeTab === 'logs' && (
          <>
            {/* ===== CLIENT DAILY VIEW: Plan vs Actual ===== */}
            <div className="card p-4 mb-4">
              <div className="flex items-center justify-between">
                <h2 className="section-title mb-0">📊 Client Daily View</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => {
                    const d = new Date(dailyViewDate);
                    d.setDate(d.getDate() - 1);
                    setDailyViewDate(d.toISOString().split('T')[0]);
                  }} className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm">←</button>
                  <input type="date" value={dailyViewDate} onChange={e => setDailyViewDate(e.target.value)} className="input text-sm w-40" />
                  <button onClick={() => {
                    const d = new Date(dailyViewDate);
                    d.setDate(d.getDate() + 1);
                    setDailyViewDate(d.toISOString().split('T')[0]);
                  }} className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm">→</button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(dailyViewDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                {dailyViewDate === new Date().toISOString().split('T')[0] && <span className="ml-2 tag tag-blue">Today</span>}
              </p>
            </div>

            {dailyLoading ? (
              <div className="card p-8 text-center">
                <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : (
              <>
                {/* Exercise: Plan vs Actual */}
                <h2 className="section-title">💪 Exercise — Plan vs Actual</h2>
                {(() => {
                  const activePlan = workoutPlans.find(p => p.status === 'ACTIVE');
                  let planDay: typeof activePlan extends { days: (infer D)[] } | undefined ? D | null : null = null;
                  if (activePlan && activePlan.days.length > 0) {
                    const start = new Date(activePlan.startDate);
                    const current = new Date(dailyViewDate);
                    start.setHours(0,0,0,0); current.setHours(0,0,0,0);
                    const diffDays = Math.floor((current.getTime() - start.getTime()) / (1000*60*60*24));
                    if (diffDays >= 0) {
                      const dayIndex = diffDays % activePlan.days.length;
                      planDay = activePlan.days.find(d => d.dayNumber === dayIndex + 1) || activePlan.days[dayIndex] || null;
                    }
                  }

                  const plannedExercises = planDay?.exercises || [];
                  const completedCount = plannedExercises.filter(e =>
                    dailyExLogs.some(l => l.exerciseName.toLowerCase() === e.exerciseName.toLowerCase())
                  ).length;
                  const extraLogs = dailyExLogs.filter(l =>
                    !plannedExercises.some(e => e.exerciseName.toLowerCase() === l.exerciseName.toLowerCase())
                  );

                  return (
                    <div className="card p-4">
                      {plannedExercises.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-slate-600">
                              {activePlan?.title} — {planDay?.dayName || planDay?.focusArea || `Day ${planDay?.dayNumber}`}
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{
                                  width: `${(completedCount / plannedExercises.length) * 100}%`,
                                  background: completedCount === plannedExercises.length ? '#22c55e' : '#3b82f6',
                                }} />
                              </div>
                              <span className={`text-xs font-bold ${completedCount === plannedExercises.length ? 'text-green-600' : 'text-blue-600'}`}>
                                {completedCount}/{plannedExercises.length}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {plannedExercises.map((exercise, i) => {
                              const log = dailyExLogs.find(l => l.exerciseName.toLowerCase() === exercise.exerciseName.toLowerCase());
                              const done = !!log;
                              const setsMatch = log && exercise.sets ? log.setsCompleted === exercise.sets : true;
                              const repsMatch = log && exercise.reps ? log.repsCompleted === parseInt(exercise.reps) : true;

                              return (
                                <div key={i} className={`p-3 rounded-xl border ${done ? (setsMatch && repsMatch ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200') : 'bg-red-50 border-red-200'}`}>
                                  <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                                      style={{ background: done ? (setsMatch && repsMatch ? '#dcfce7' : '#fef9c3') : '#fee2e2', color: done ? (setsMatch && repsMatch ? '#047857' : '#a16207') : '#dc2626' }}>
                                      {done ? (setsMatch && repsMatch ? '✓' : '~') : '✗'}
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-slate-800">{exercise.exerciseName} {log?.isPr && '🏆'}</p>
                                      <div className="flex gap-4 mt-0.5">
                                        <p className="text-xs text-slate-500">
                                          <span className="font-semibold">Plan:</span> {exercise.sets}×{exercise.reps}{exercise.weightSuggestion ? ` @ ${exercise.weightSuggestion}` : ''}
                                        </p>
                                        {done ? (
                                          <p className="text-xs" style={{ color: setsMatch && repsMatch ? '#047857' : '#a16207' }}>
                                            <span className="font-semibold">Actual:</span>{' '}
                                            {log.setsCompleted && `${log.setsCompleted} sets`}
                                            {log.repsCompleted && ` × ${log.repsCompleted} reps`}
                                            {log.weightUsed && ` @ ${log.weightUsed}${log.weightUnit || 'kg'}`}
                                            {log.durationSeconds && ` • ${Math.floor(log.durationSeconds / 60)}m${log.durationSeconds % 60}s`}
                                          </p>
                                        ) : (
                                          <p className="text-xs text-red-500 font-semibold">Not logged</p>
                                        )}
                                      </div>
                                      {log?.notes && <p className="text-xs text-slate-500 mt-1 italic">"{log.notes}"</p>}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500 text-center py-2">
                          {activePlan ? 'Rest day — no exercises scheduled' : 'No active workout plan'}
                        </p>
                      )}

                      {extraLogs.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-200">
                          <p className="text-xs font-semibold text-slate-500 mb-2">Additional Exercises (not in plan)</p>
                          {extraLogs.map(log => (
                            <div key={log.id} className="p-2 rounded-lg bg-blue-50 border border-blue-200 mb-1.5">
                              <p className="text-sm font-semibold text-slate-800">{log.exerciseName} {log.isPr && '🏆'}</p>
                              <p className="text-xs text-slate-600">
                                {log.setsCompleted && `${log.setsCompleted} sets`}
                                {log.repsCompleted && ` × ${log.repsCompleted} reps`}
                                {log.weightUsed && ` @ ${log.weightUsed}${log.weightUnit || 'kg'}`}
                              </p>
                              {log.notes && <p className="text-xs text-slate-500 italic">"{log.notes}"</p>}
                            </div>
                          ))}
                        </div>
                      )}

                      {plannedExercises.length > 0 && dailyExLogs.length === 0 && (
                        <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-center">
                          <p className="text-sm font-semibold text-red-600">⚠️ No exercises logged</p>
                          <p className="text-xs text-red-500 mt-0.5">Client hasn't logged any exercises for this day</p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Meal: Plan vs Actual */}
                <h2 className="section-title mt-5">🍽️ Meals — Plan vs Actual</h2>
                {(() => {
                  const activeDiet = dietPlans.find(p => p.status === 'ACTIVE');
                  const plannedMeals = activeDiet?.meals || [];
                  const loggedCount = plannedMeals.filter(m =>
                    dailyMealLogs.some(l => l.mealName.toLowerCase() === m.mealName.toLowerCase())
                  ).length;
                  const onPlanCount = dailyMealLogs.filter(l => l.compliance === 'ON_PLAN').length;
                  const extraMealLogs = dailyMealLogs.filter(l =>
                    !plannedMeals.some(m => m.mealName.toLowerCase() === l.mealName.toLowerCase())
                  );

                  return (
                    <div className="card p-4">
                      {plannedMeals.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-slate-600">
                              {activeDiet?.title}{activeDiet?.dailyCalorieTarget ? ` • ${activeDiet.dailyCalorieTarget} kcal target` : ''}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className={`tag ${onPlanCount === dailyMealLogs.length && dailyMealLogs.length > 0 ? 'tag-green' : dailyMealLogs.length > 0 ? 'tag-orange' : 'tag-blue'}`}>
                                {loggedCount}/{plannedMeals.length} logged
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {plannedMeals.map((meal, i) => {
                              const log = dailyMealLogs.find(l => l.mealName.toLowerCase() === meal.mealName.toLowerCase());
                              const done = !!log;

                              return (
                                <div key={i} className={`p-4 rounded-xl border ${done ? (log.compliance === 'ON_PLAN' ? 'bg-green-50 border-green-200' : log.compliance === 'PARTIAL' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200') : 'bg-slate-50 border-slate-200'}`}>
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="text-lg">{done ? (log.compliance === 'ON_PLAN' ? '✅' : log.compliance === 'PARTIAL' ? '⚠️' : '❌') : '⬜'}</span>
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-slate-800">
                                        {meal.mealName}
                                        {meal.mealTime && <span className="ml-2 tag tag-blue">{meal.mealTime}</span>}
                                      </p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {meal.items.map((item, j) => (
                                          <span key={j} className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#f1f5f9', color: '#475569' }}>
                                            {item.foodName}{item.quantity ? ` (${item.quantity})` : ''}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {done ? (
                                    <div className="mt-2">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className={`tag ${log.compliance === 'ON_PLAN' ? 'tag-green' : log.compliance === 'PARTIAL' ? 'tag-orange' : 'tag-blue'}`}>
                                          {log.compliance?.replace(/_/g, ' ')}
                                        </span>
                                        {log.trainerVerified ? (
                                          <span className="tag tag-green text-xs">✓ Verified</span>
                                        ) : (
                                          <button onClick={() => verifyMealLog(log.id)} className="btn-primary text-xs px-3 py-1">
                                            Verify
                                          </button>
                                        )}
                                      </div>
                                      {log.photoUrl && (
                                        <img src={log.photoUrl.startsWith('/uploads') ? `http://localhost:8080/api${log.photoUrl}` : log.photoUrl} alt="Meal" className="w-full max-h-48 object-cover rounded-lg mb-2" />
                                      )}
                                      {log.itemsConsumed && <p className="text-xs text-slate-600">Items: {log.itemsConsumed}</p>}
                                      {log.estimatedCalories && (
                                        <p className="text-xs text-slate-500 mt-0.5">~{log.estimatedCalories} cal • P:{log.proteinGrams}g C:{log.carbsGrams}g F:{log.fatGrams}g</p>
                                      )}
                                      {log.notes && <p className="text-xs text-slate-500 mt-1 italic">"{log.notes}"</p>}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-400 mt-1">Not logged yet</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500 text-center py-2">No active diet plan</p>
                      )}

                      {extraMealLogs.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-200">
                          <p className="text-xs font-semibold text-slate-500 mb-2">Additional Meals (not in plan)</p>
                          {extraMealLogs.map(log => (
                            <div key={log.id} className="p-3 rounded-lg bg-blue-50 border border-blue-200 mb-2">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-slate-800">{log.mealName}</p>
                                {log.trainerVerified ? (
                                  <span className="tag tag-green text-xs">✓ Verified</span>
                                ) : (
                                  <button onClick={() => verifyMealLog(log.id)} className="btn-primary text-xs px-3 py-1">Verify</button>
                                )}
                              </div>
                              <span className={`tag mt-1 ${log.compliance === 'ON_PLAN' ? 'tag-green' : log.compliance === 'PARTIAL' ? 'tag-orange' : 'tag-blue'}`}>
                                {log.compliance?.replace(/_/g, ' ')}
                              </span>
                              {log.photoUrl && <img src={log.photoUrl.startsWith('/uploads') ? `http://localhost:8080/api${log.photoUrl}` : log.photoUrl} alt="Meal" className="mt-2 w-full max-h-40 object-cover rounded-lg" />}
                              {log.itemsConsumed && <p className="text-xs text-slate-600 mt-1">{log.itemsConsumed}</p>}
                            </div>
                          ))}
                        </div>
                      )}

                      {plannedMeals.length > 0 && dailyMealLogs.length === 0 && (
                        <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-center">
                          <p className="text-sm font-semibold text-red-600">⚠️ No meals logged</p>
                          <p className="text-xs text-red-500 mt-0.5">Client hasn't logged any meals for this day</p>
                        </div>
                      )}

                      {/* Daily Macro Summary */}
                      {dailyMealLogs.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-200">
                          <p className="text-xs font-semibold text-slate-500 mb-2">Daily Macro Summary</p>
                          <div className="grid grid-cols-4 gap-2">
                            <div className="p-2 rounded-lg bg-blue-50 text-center">
                              <p className="text-lg font-bold text-blue-700">{dailyMealLogs.reduce((s, l) => s + (l.estimatedCalories || 0), 0)}</p>
                              <p className="text-xs text-blue-600">Calories</p>
                            </div>
                            <div className="p-2 rounded-lg bg-green-50 text-center">
                              <p className="text-lg font-bold text-green-700">{dailyMealLogs.reduce((s, l) => s + (l.proteinGrams || 0), 0)}g</p>
                              <p className="text-xs text-green-600">Protein</p>
                            </div>
                            <div className="p-2 rounded-lg bg-yellow-50 text-center">
                              <p className="text-lg font-bold text-yellow-700">{dailyMealLogs.reduce((s, l) => s + (l.carbsGrams || 0), 0)}g</p>
                              <p className="text-xs text-yellow-600">Carbs</p>
                            </div>
                            <div className="p-2 rounded-lg bg-purple-50 text-center">
                              <p className="text-lg font-bold text-purple-700">{dailyMealLogs.reduce((s, l) => s + (l.fatGrams || 0), 0)}g</p>
                              <p className="text-xs text-purple-600">Fat</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Trainer Exercise Logging for IN_PERSON sessions */}
                <h2 className="section-title mt-6">📝 Exercise Logging (In-Person Sessions)</h2>
                {sessions.length === 0 ? (
                  <div className="card p-6 text-center">
                    <p className="text-sm text-slate-500">No in-person sessions found for this client</p>
                  </div>
                ) : (
                  <div className="card p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Session</label>
                        <select value={selectedSessionForLog} onChange={e => setSelectedSessionForLog(e.target.value)} className="input">
                          <option value="">Select a session</option>
                          {sessions.map(s => (
                            <option key={s.id} value={s.id}>{s.sessionDate} ({s.startTime}-{s.endTime}) - {s.status}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Log Date</label>
                        <input type="date" value={exerciseLogDate} onChange={e => setExerciseLogDate(e.target.value)} className="input" />
                      </div>
                    </div>

                    {selectedSessionForLog && (() => {
                      const session = sessions.find(s => s.id === selectedSessionForLog);
                      if (!session) return null;
                      const plan = workoutPlans.find(p => p.status === 'ACTIVE' &&
                        session.sessionDate >= p.startDate && session.sessionDate <= p.endDate);
                      if (!plan) return (
                        <p className="text-sm text-slate-500 text-center py-4">No active workout plan covers this session date</p>
                      );
                      const start = new Date(plan.startDate);
                      const current = new Date(session.sessionDate);
                      const diffDays = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                      const totalDays = plan.days.length;
                      const dayIndex = totalDays > 0 ? (diffDays % totalDays) : 0;
                      const planDay = plan.days[dayIndex];
                      if (!planDay || !planDay.exercises.length) return (
                        <p className="text-sm text-slate-500 text-center py-4">No exercises for this day in the plan</p>
                      );
                      return (
                        <div className="space-y-2 mt-3">
                          <p className="text-xs font-semibold text-slate-500">{plan.title} — {planDay.dayName || planDay.focusArea || `Day ${planDay.dayNumber}`}</p>
                          {planDay.exercises.map((exercise: PlanExercise) => {
                            const key = exercise.id || exercise.exerciseName;
                            const input = trainerExInputs[key] || { sets: exercise.sets || 0, reps: parseInt(exercise.reps || '0') || 0, weight: 0, duration: 0, notes: '' };
                            const alreadyLogged = exerciseLogs.some(l =>
                              l.exerciseName.toLowerCase() === exercise.exerciseName.toLowerCase() &&
                              l.logDate === exerciseLogDate
                            );
                            return (
                              <div key={key} className={`p-3 rounded-lg bg-slate-50 border border-slate-200 ${alreadyLogged ? 'opacity-50' : ''}`}>
                                <p className="text-sm font-semibold text-slate-700">
                                  {exercise.exerciseName}
                                  {alreadyLogged && <span className="ml-2 text-green-600 text-xs">✓ Logged</span>}
                                </p>
                                <p className="text-xs text-slate-500">Plan: {exercise.sets}×{exercise.reps} {exercise.weightSuggestion && `@ ${exercise.weightSuggestion}`}</p>
                                {!alreadyLogged && (
                                  <>
                                    <div className="grid grid-cols-4 gap-2 mt-2">
                                      <div><label className="text-xs text-slate-500">Sets</label>
                                        <input type="number" value={input.sets || ''} onChange={e => setTrainerExInputs(prev => ({ ...prev, [key]: { ...(prev[key] || input), sets: Number(e.target.value) } }))} className="input text-sm" /></div>
                                      <div><label className="text-xs text-slate-500">Reps</label>
                                        <input type="number" value={input.reps || ''} onChange={e => setTrainerExInputs(prev => ({ ...prev, [key]: { ...(prev[key] || input), reps: Number(e.target.value) } }))} className="input text-sm" /></div>
                                      <div><label className="text-xs text-slate-500">Weight</label>
                                        <input type="number" value={input.weight || ''} onChange={e => setTrainerExInputs(prev => ({ ...prev, [key]: { ...(prev[key] || input), weight: Number(e.target.value) } }))} className="input text-sm" /></div>
                                      <div><label className="text-xs text-slate-500">Duration</label>
                                        <input type="number" value={input.duration || ''} onChange={e => setTrainerExInputs(prev => ({ ...prev, [key]: { ...(prev[key] || input), duration: Number(e.target.value) } }))} className="input text-sm" /></div>
                                    </div>
                                    <textarea value={input.notes} onChange={e => setTrainerExInputs(prev => ({ ...prev, [key]: { ...(prev[key] || input), notes: e.target.value } }))} placeholder="Notes" className="input text-sm mt-1" rows={1} />
                                    <button disabled={logLoading} onClick={async () => {
                                      if (!user?.token || !connectionId) return;
                                      setLogLoading(true);
                                      try {
                                        await api.post('/plans/exercise-logs', {
                                          connectionId, planExerciseId: exercise.id || null,
                                          exerciseName: exercise.exerciseName, logDate: exerciseLogDate,
                                          setsCompleted: input.sets || null, repsCompleted: input.reps || null,
                                          weightUsed: input.weight || null, durationSeconds: input.duration || null,
                                          isPr: false, notes: input.notes || null,
                                        }, user.token);
                                        showToast('success', `${exercise.exerciseName} logged`);
                                        fetchData(); fetchDailyView();
                                      } catch (error: any) {
                                        showToast('error', error.message || 'Failed');
                                      } finally { setLogLoading(false); }
                                    }} className="btn-primary text-xs px-3 py-1.5 mt-1">
                                      {logLoading ? 'Saving...' : 'Log'}
                                    </button>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
