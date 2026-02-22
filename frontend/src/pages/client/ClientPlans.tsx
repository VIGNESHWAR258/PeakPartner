import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { WorkoutPlanResponse, DietPlanResponse, AssessmentResponse, AssessmentQuestion, AssessmentAnswer } from '../../types';

export default function ClientPlans() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlanResponse[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlanResponse[]>([]);
  const [assessments, setAssessments] = useState<AssessmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'workout' | 'diet' | 'assessment'>(() => {
    const tab = searchParams.get('tab');
    if (tab === 'assessment' || tab === 'diet' || tab === 'workout') return tab;
    return 'workout';
  });

  // Assessment fill form
  const [fillAssessId, setFillAssessId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (user?.token) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user?.token) return;
    try {
      const [wpRes, dpRes, aRes] = await Promise.all([
        api.get('/plans/workout?role=client', user.token),
        api.get('/plans/diet?role=client', user.token),
        api.get('/assessments', user.token),
      ]);
      if (wpRes.success) setWorkoutPlans(wpRes.data);
      if (dpRes.success) setDietPlans(dpRes.data);
      if (aRes.success) setAssessments(aRes.data);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const startFillAssessment = (a: AssessmentResponse) => {
    let questions: AssessmentQuestion[] = [];
    try {
      const parsed = JSON.parse(a.questions || '[]');
      questions = parsed.map((q: any) => typeof q === 'string' ? { type: 'TEXT', question: q } : q);
    } catch {}
    setFillAssessId(a.id);
    setAnswers(questions.map(q => ({ value: q.type === 'MULTI_CHOICE' ? [] : '' })));
  };

  const submitAssessment = async () => {
    if (!user?.token || !fillAssessId) return;
    try {
      await api.put(`/assessments/${fillAssessId}/submit`, {
        answers: JSON.stringify(answers),
      }, user.token);
      setFillAssessId(null);
      setAnswers([]);
      showToast('success', 'Assessment submitted successfully');
      fetchData();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to submit assessment');
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
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg text-sm font-semibold text-white transition-all ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}
      <header className="gradient-bg text-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/client/dashboard')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              ← Back
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight">My Plans</h1>
              <p className="text-xs text-white/70 font-medium">Workout & Diet Plans</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex gap-1">
          {[
            { key: 'workout' as const, label: '💪 Workout' },
            { key: 'diet' as const, label: '🥗 Diet' },
            { key: 'assessment' as const, label: '📋 Assessments' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab.key
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
        {/* WORKOUT PLANS */}
        {activeTab === 'workout' && (
          <>
            {workoutPlans.filter(p => p.status === 'ACTIVE').length > 0 && (
              <>
                <h2 className="section-title">Active Plans</h2>
                {workoutPlans.filter(p => p.status === 'ACTIVE').map(plan => (
                  <div key={plan.id} className="card p-5 border-l-4 border-l-green-500">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-800">{plan.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">by {plan.trainerName} • {plan.startDate} → {plan.endDate}</p>
                        <p className="text-xs text-slate-500">{plan.program?.replace(/_/g, ' ')} • {plan.duration}</p>
                      </div>
                      <span className="tag tag-green">ACTIVE</span>
                    </div>
                    {plan.description && <p className="text-sm text-slate-600 mb-3">{plan.description}</p>}
                    {plan.days && plan.days.length > 0 && (
                      <div className="space-y-2">
                        {plan.days.map(day => (
                          <div key={day.id} className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                            <p className="text-sm font-semibold text-blue-800">{day.dayName || `Day ${day.dayNumber}`} {day.focusArea && `— ${day.focusArea}`}</p>
                            {day.exercises && day.exercises.length > 0 && (
                              <div className="mt-2 space-y-1.5">
                                {day.exercises.map((ex, i) => (
                                  <div key={i} className="flex items-center justify-between text-xs">
                                    <span className="text-slate-700 font-medium">{ex.exerciseName}</span>
                                    <span className="text-slate-500">{ex.sets}×{ex.reps} {ex.weightSuggestion && `@ ${ex.weightSuggestion}`}</span>
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
              </>
            )}

            {workoutPlans.filter(p => p.status !== 'ACTIVE').length > 0 && (
              <>
                <h2 className="section-title mt-4">Other Plans</h2>
                {workoutPlans.filter(p => p.status !== 'ACTIVE').map(plan => (
                  <div key={plan.id} className="card p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-sm text-slate-800">{plan.title}</h3>
                        <p className="text-xs text-slate-500">{plan.startDate} → {plan.endDate}</p>
                      </div>
                      <span className={`tag ${plan.status === 'DRAFT' ? 'tag-orange' : 'tag-blue'}`}>{plan.status}</span>
                    </div>
                  </div>
                ))}
              </>
            )}

            {workoutPlans.length === 0 && (
              <div className="card p-10 text-center">
                <p className="text-3xl mb-3">💪</p>
                <p className="text-sm font-semibold text-slate-600">No workout plans yet</p>
                <p className="text-xs text-slate-400 mt-1">Your trainer will create workout plans for you</p>
              </div>
            )}
          </>
        )}

        {/* DIET PLANS */}
        {activeTab === 'diet' && (
          <>
            {dietPlans.filter(p => p.status === 'ACTIVE').length > 0 && (
              <>
                <h2 className="section-title">Active Diet Plans</h2>
                {dietPlans.filter(p => p.status === 'ACTIVE').map(plan => (
                  <div key={plan.id} className="card p-5 border-l-4 border-l-green-500">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-800">{plan.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">by {plan.trainerName} • {plan.startDate} → {plan.endDate}</p>
                        {plan.dailyCalorieTarget && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            🔥 {plan.dailyCalorieTarget} cal/day • P:{plan.proteinGrams}g C:{plan.carbsGrams}g F:{plan.fatGrams}g
                          </p>
                        )}
                      </div>
                      <span className="tag tag-green">ACTIVE</span>
                    </div>
                    {plan.meals && plan.meals.length > 0 && (
                      <div className="space-y-2">
                        {plan.meals.map(meal => (
                          <div key={meal.id} className="p-3 rounded-lg bg-green-50 border border-green-100">
                            <div className="flex justify-between items-center">
                              <p className="text-sm font-semibold text-green-800">{meal.mealName}</p>
                              {meal.mealTime && <span className="text-xs text-green-600">⏰ {meal.mealTime}</span>}
                            </div>
                            {meal.items && meal.items.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {meal.items.map((item, i) => (
                                  <div key={i} className="flex items-center justify-between text-xs">
                                    <span className="text-slate-700">
                                      {item.foodName} {item.quantity && <span className="text-slate-400">({item.quantity})</span>}
                                    </span>
                                    <span className="text-slate-500">{item.calories && `${item.calories} cal`}</span>
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
              </>
            )}

            {dietPlans.filter(p => p.status !== 'ACTIVE').length > 0 && (
              <>
                <h2 className="section-title mt-4">Other Plans</h2>
                {dietPlans.filter(p => p.status !== 'ACTIVE').map(plan => (
                  <div key={plan.id} className="card p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-sm text-slate-800">{plan.title}</h3>
                        <p className="text-xs text-slate-500">{plan.startDate} → {plan.endDate}</p>
                      </div>
                      <span className={`tag ${plan.status === 'DRAFT' ? 'tag-orange' : 'tag-blue'}`}>{plan.status}</span>
                    </div>
                  </div>
                ))}
              </>
            )}

            {dietPlans.length === 0 && (
              <div className="card p-10 text-center">
                <p className="text-3xl mb-3">🥗</p>
                <p className="text-sm font-semibold text-slate-600">No diet plans yet</p>
                <p className="text-xs text-slate-400 mt-1">Your trainer will create diet plans for you</p>
              </div>
            )}
          </>
        )}

        {/* ASSESSMENTS */}
        {activeTab === 'assessment' && (
          <>
            <h2 className="section-title">My Assessments</h2>
            {assessments.length === 0 ? (
              <div className="card p-10 text-center">
                <p className="text-3xl mb-3">📋</p>
                <p className="text-sm font-semibold text-slate-600">No assessments yet</p>
                <p className="text-xs text-slate-400 mt-1">Your trainer will send you assessments to fill</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assessments.map(a => {
                  let questions: AssessmentQuestion[] = [];
                  try {
                    const parsed = JSON.parse(a.questions || '[]');
                    questions = parsed.map((q: any) => typeof q === 'string' ? { type: 'TEXT' as const, question: q } : q);
                  } catch {}
                  let existingAnswers: AssessmentAnswer[] = [];
                  try {
                    const parsed = JSON.parse(a.answers || '[]');
                    existingAnswers = parsed.map((ans: any) => typeof ans === 'string' ? { value: ans } : ans);
                  } catch {}

                  const isFilling = fillAssessId === a.id;

                  return (
                    <div key={a.id} className="card p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-slate-800">{a.title}</h3>
                          <p className="text-xs text-slate-500">by {a.trainer?.fullName || 'Trainer'} • {new Date(a.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`tag ${a.status === 'PENDING' ? 'tag-orange' : a.status === 'SUBMITTED' ? 'tag-blue' : 'tag-green'}`}>
                          {a.status}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {questions.map((q, i) => {
                          const existAns = existingAnswers[i];
                          const existVal = existAns ? existAns.value : null;
                          return (
                            <div key={i} className="text-sm">
                              <p className="font-medium text-slate-700">
                                Q{i + 1}: {q.question}
                                <span className="ml-2 text-xs text-slate-400">
                                  ({q.type === 'TEXT' ? 'Text' : q.type === 'SINGLE_CHOICE' ? 'Pick one' : 'Pick multiple'})
                                </span>
                              </p>
                              {/* View mode - show existing answers */}
                              {!isFilling && existVal && (
                                <p className="text-slate-600 mt-1 pl-4 border-l-2 border-blue-200">
                                  {Array.isArray(existVal) ? existVal.join(', ') : existVal}
                                </p>
                              )}
                              {/* Fill mode */}
                              {isFilling && q.type === 'TEXT' && (
                                <textarea
                                  value={(answers[i]?.value as string) || ''}
                                  onChange={e => {
                                    const updated = [...answers];
                                    updated[i] = { value: e.target.value };
                                    setAnswers(updated);
                                  }}
                                  placeholder="Your answer..."
                                  className="input mt-1"
                                  rows={2}
                                />
                              )}
                              {isFilling && q.type === 'SINGLE_CHOICE' && q.options && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {q.options.map(opt => (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => {
                                        const updated = [...answers];
                                        updated[i] = { value: opt };
                                        setAnswers(updated);
                                      }}
                                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                                        answers[i]?.value === opt
                                          ? 'bg-blue-600 text-white border-blue-600'
                                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                      }`}
                                    >{opt}</button>
                                  ))}
                                </div>
                              )}
                              {isFilling && q.type === 'MULTI_CHOICE' && q.options && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {q.options.map(opt => {
                                    const selected = Array.isArray(answers[i]?.value) && (answers[i].value as string[]).includes(opt);
                                    return (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => {
                                          const updated = [...answers];
                                          const current = Array.isArray(updated[i]?.value) ? [...(updated[i].value as string[])] : [];
                                          if (current.includes(opt)) {
                                            updated[i] = { value: current.filter(v => v !== opt) };
                                          } else {
                                            updated[i] = { value: [...current, opt] };
                                          }
                                          setAnswers(updated);
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                                          selected
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                        }`}
                                      >{selected && '\u2713 '}{opt}</button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {a.status === 'PENDING' && !isFilling && (
                        <button onClick={() => startFillAssessment(a)} className="btn-primary text-sm px-4 py-2 mt-4">
                          Fill Assessment
                        </button>
                      )}

                      {isFilling && (
                        <div className="flex gap-2 mt-4">
                          <button onClick={submitAssessment} className="btn-primary text-sm px-4 py-2">Submit</button>
                          <button onClick={() => { setFillAssessId(null); setAnswers([]); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                        </div>
                      )}

                      {a.trainerNotes && (
                        <div className="mt-3 p-3 rounded-lg bg-green-50 border border-green-200">
                          <p className="text-xs font-semibold text-green-700">Trainer Feedback</p>
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
      </main>
    </div>
  );
}
