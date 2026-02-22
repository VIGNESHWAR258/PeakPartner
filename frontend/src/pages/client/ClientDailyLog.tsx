import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { ConnectionResponse, ExerciseLogResponse, MealLogResponse, MealCompliance } from '../../types';

export default function ClientDailyLog() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [connections, setConnections] = useState<ConnectionResponse[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('');
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogResponse[]>([]);
  const [mealLogs, setMealLogs] = useState<MealLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'exercise' | 'meal'>('exercise');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

  // Exercise log form
  const [showExForm, setShowExForm] = useState(false);
  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState<number>(0);
  const [exReps, setExReps] = useState<number>(0);
  const [exWeight, setExWeight] = useState<number>(0);
  const [exDuration, setExDuration] = useState<number>(0);
  const [exIsPr, setExIsPr] = useState(false);
  const [exNotes, setExNotes] = useState('');

  // Meal log form
  const [showMealForm, setShowMealForm] = useState(false);
  const [mlName, setMlName] = useState('');
  const [mlCompliance, setMlCompliance] = useState<MealCompliance>('ON_PLAN');
  const [mlPhotoFile, setMlPhotoFile] = useState<File | null>(null);
  const [mlPhotoPreview, setMlPhotoPreview] = useState<string>('');
  const [mlPhotoUploading, setMlPhotoUploading] = useState(false);
  const [mlItems, setMlItems] = useState('');
  const [mlCalories, setMlCalories] = useState<number>(0);
  const [mlProtein, setMlProtein] = useState<number>(0);
  const [mlCarbs, setMlCarbs] = useState<number>(0);
  const [mlFat, setMlFat] = useState<number>(0);
  const [mlNotes, setMlNotes] = useState('');
  const [mlSaving, setMlSaving] = useState(false);

  useEffect(() => {
    if (user?.token) fetchConnections();
  }, [user]);

  useEffect(() => {
    if (user?.token && selectedConnectionId) fetchLogs();
  }, [user, selectedConnectionId, logDate]);

  // Auto-sync: poll every 30 seconds
  useEffect(() => {
    if (!user?.token || !selectedConnectionId) return;
    const interval = setInterval(() => fetchLogs(), 30000);
    return () => clearInterval(interval);
  }, [user, selectedConnectionId, logDate]);

  const fetchConnections = async () => {
    if (!user?.token) return;
    try {
      const res = await api.get('/connections?status=ACCEPTED', user.token);
      if (res.success && res.data.length > 0) {
        setConnections(res.data);
        setSelectedConnectionId(res.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    if (!user?.token || !selectedConnectionId) return;
    try {
      const [exRes, mlRes] = await Promise.all([
        api.get(`/plans/exercise-logs?connectionId=${selectedConnectionId}&date=${logDate}`, user.token),
        api.get(`/plans/meal-logs?connectionId=${selectedConnectionId}&date=${logDate}`, user.token),
      ]);
      if (exRes.success) setExerciseLogs(exRes.data);
      if (mlRes.success) setMealLogs(mlRes.data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const createExerciseLog = async () => {
    if (!user?.token || !selectedConnectionId) return;
    try {
      await api.post('/plans/exercise-logs', {
        connectionId: selectedConnectionId,
        exerciseName: exName,
        logDate,
        setsCompleted: exSets || null,
        repsCompleted: exReps || null,
        weightUsed: exWeight || null,
        durationSeconds: exDuration || null,
        isPr: exIsPr,
        notes: exNotes || null,
      }, user.token);
      setShowExForm(false);
      resetExForm();
      fetchLogs();
    } catch (error) {
      console.error('Failed to log exercise:', error);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('Photo size must be under 5MB. Please choose a smaller image.');
      e.target.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      e.target.value = '';
      return;
    }
    setMlPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setMlPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setMlPhotoFile(null);
    setMlPhotoPreview('');
  };

  const createMealLog = async () => {
    if (!user?.token || !selectedConnectionId) return;
    if (!mlName.trim()) {
      alert('Please enter a meal name');
      return;
    }
    setMlSaving(true);
    try {
      let photoUrl: string | null = null;
      if (mlPhotoFile) {
        setMlPhotoUploading(true);
        try {
          const uploadRes = await api.uploadFile('/uploads/photo', mlPhotoFile, 'file', undefined, user.token);
          if (uploadRes.success) {
            photoUrl = uploadRes.data.url;
          }
        } catch (uploadErr: any) {
          alert('Failed to upload photo: ' + (uploadErr.message || 'Unknown error'));
          setMlPhotoUploading(false);
          setMlSaving(false);
          return;
        }
        setMlPhotoUploading(false);
      }
      await api.post('/plans/meal-logs', {
        connectionId: selectedConnectionId,
        logDate,
        mealName: mlName,
        compliance: mlCompliance,
        photoUrl,
        itemsConsumed: mlItems || null,
        estimatedCalories: mlCalories || null,
        proteinGrams: mlProtein || null,
        carbsGrams: mlCarbs || null,
        fatGrams: mlFat || null,
        notes: mlNotes || null,
      }, user.token);
      setShowMealForm(false);
      resetMealForm();
      fetchLogs();
    } catch (error: any) {
      alert('Failed to log meal: ' + (error.message || 'Unknown error'));
      console.error('Failed to log meal:', error);
    } finally {
      setMlPhotoUploading(false);
      setMlSaving(false);
    }
  };

  const resetExForm = () => {
    setExName(''); setExSets(0); setExReps(0); setExWeight(0);
    setExDuration(0); setExIsPr(false); setExNotes('');
  };

  const resetMealForm = () => {
    setMlName(''); setMlCompliance('ON_PLAN'); setMlPhotoFile(null);
    setMlPhotoPreview(''); setMlItems(''); setMlCalories(0); setMlProtein(0);
    setMlCarbs(0); setMlFat(0); setMlNotes('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center page-bg">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="page-bg">
        <header className="gradient-bg text-white sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
            <button onClick={() => navigate('/client/dashboard')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">← Back</button>
            <h1 className="text-lg font-bold mt-2">Daily Log</h1>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="card p-10 text-center">
            <p className="text-3xl mb-3">📝</p>
            <p className="text-sm font-semibold text-slate-600">No active trainer connections</p>
            <p className="text-xs text-slate-400 mt-1">Connect with a trainer first to start logging</p>
            <button onClick={() => navigate('/client/trainers')} className="btn-primary text-sm px-4 py-2 mt-4">Find a Trainer</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-bg">
      <header className="gradient-bg text-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/client/dashboard')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">← Back</button>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Daily Log</h1>
              <p className="text-xs text-white/70 font-medium">Track your exercises & meals</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-4">
        {/* Trainer selector + Date */}
        <div className="card p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500">Trainer</label>
              <select
                value={selectedConnectionId}
                onChange={e => setSelectedConnectionId(e.target.value)}
                className="input"
              >
                {connections.map(c => (
                  <option key={c.id} value={c.id}>{c.trainer.fullName} ({c.program.replace(/_/g, ' ')})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Date</label>
              <input
                type="date"
                value={logDate}
                onChange={e => setLogDate(e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('exercise')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'exercise' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-blue-50'}`}
          >💪 Exercise ({exerciseLogs.length})</button>
          <button
            onClick={() => setActiveTab('meal')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'meal' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-blue-50'}`}
          >🍽️ Meals ({mealLogs.length})</button>
        </div>

        {/* EXERCISE TAB */}
        {activeTab === 'exercise' && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="section-title">Exercise Log</h2>
              <button onClick={() => setShowExForm(true)} className="btn-primary text-sm px-4 py-2">+ Log Exercise</button>
            </div>

            {showExForm && (
              <div className="card p-5 space-y-3">
                <h3 className="font-semibold text-slate-800">Log Exercise</h3>
                <input value={exName} onChange={e => setExName(e.target.value)} placeholder="Exercise Name" className="input" />
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Sets</label>
                    <input type="number" value={exSets || ''} onChange={e => setExSets(Number(e.target.value))} className="input text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Reps</label>
                    <input type="number" value={exReps || ''} onChange={e => setExReps(Number(e.target.value))} className="input text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Weight (kg)</label>
                    <input type="number" value={exWeight || ''} onChange={e => setExWeight(Number(e.target.value))} className="input text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Duration (s)</label>
                    <input type="number" value={exDuration || ''} onChange={e => setExDuration(Number(e.target.value))} className="input text-sm" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isPr" checked={exIsPr} onChange={e => setExIsPr(e.target.checked)} className="w-4 h-4" />
                  <label htmlFor="isPr" className="text-sm font-medium text-slate-700">🏆 Personal Record!</label>
                </div>
                <textarea value={exNotes} onChange={e => setExNotes(e.target.value)} placeholder="Notes (optional)" className="input" rows={2} />
                <div className="flex gap-2">
                  <button onClick={createExerciseLog} className="btn-primary text-sm px-4 py-2">Save</button>
                  <button onClick={() => { setShowExForm(false); resetExForm(); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                </div>
              </div>
            )}

            {exerciseLogs.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-2xl mb-2">💪</p>
                <p className="text-sm font-semibold text-slate-600">No exercises logged today</p>
              </div>
            ) : (
              <div className="space-y-2">
                {exerciseLogs.map(log => (
                  <div key={log.id} className="card p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-sm text-slate-800">
                          {log.exerciseName}
                          {log.isPr && <span className="ml-2 text-yellow-500">🏆 PR!</span>}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {log.setsCompleted && `${log.setsCompleted} sets`}
                          {log.repsCompleted && ` × ${log.repsCompleted} reps`}
                          {log.weightUsed && ` @ ${log.weightUsed}${log.weightUnit || 'kg'}`}
                          {log.durationSeconds && ` • ${Math.floor(log.durationSeconds / 60)}m${log.durationSeconds % 60}s`}
                        </p>
                      </div>
                    </div>
                    {log.notes && <p className="text-xs text-slate-500 mt-1 italic">"{log.notes}"</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* MEAL TAB */}
        {activeTab === 'meal' && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="section-title">Meal Log</h2>
              <button onClick={() => setShowMealForm(true)} className="btn-primary text-sm px-4 py-2">+ Log Meal</button>
            </div>

            {showMealForm && (
              <div className="card p-5 space-y-3">
                <h3 className="font-semibold text-slate-800">Log Meal</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input value={mlName} onChange={e => setMlName(e.target.value)} placeholder="Meal Name (e.g. Lunch)" className="input" />
                  <select value={mlCompliance} onChange={e => setMlCompliance(e.target.value as MealCompliance)} className="input">
                    <option value="ON_PLAN">On Plan ✅</option>
                    <option value="PARTIAL">Partial ⚠️</option>
                    <option value="OFF_PLAN">Off Plan ❌</option>
                    <option value="SKIPPED">Skipped ⏭️</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Meal Photo (optional, max 5MB)</label>
                  {mlPhotoPreview ? (
                    <div className="relative">
                      <img src={mlPhotoPreview} alt="Meal preview" className="w-full max-h-48 object-cover rounded-lg" />
                      <button
                        onClick={removePhoto}
                        className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold hover:bg-red-600 transition-colors shadow-md"
                      >×</button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                      <span className="text-2xl mb-1">📷</span>
                      <span className="text-xs text-slate-500 font-medium">Tap to upload photo</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">JPEG, PNG up to 5MB</span>
                      <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                    </label>
                  )}
                </div>
                <textarea value={mlItems} onChange={e => setMlItems(e.target.value)} placeholder="Items consumed (e.g. Rice, chicken breast, salad)" className="input" rows={2} />
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Calories</label>
                    <input type="number" value={mlCalories || ''} onChange={e => setMlCalories(Number(e.target.value))} className="input text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Protein (g)</label>
                    <input type="number" value={mlProtein || ''} onChange={e => setMlProtein(Number(e.target.value))} className="input text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Carbs (g)</label>
                    <input type="number" value={mlCarbs || ''} onChange={e => setMlCarbs(Number(e.target.value))} className="input text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Fat (g)</label>
                    <input type="number" value={mlFat || ''} onChange={e => setMlFat(Number(e.target.value))} className="input text-sm" />
                  </div>
                </div>
                <textarea value={mlNotes} onChange={e => setMlNotes(e.target.value)} placeholder="Notes (optional)" className="input" rows={2} />
                <div className="flex gap-2">
                  <button onClick={createMealLog} disabled={mlSaving} className="btn-primary text-sm px-4 py-2 disabled:opacity-50 flex items-center gap-2">
                    {mlSaving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {mlPhotoUploading ? 'Uploading photo...' : mlSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => { setShowMealForm(false); resetMealForm(); }} disabled={mlSaving} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                </div>
              </div>
            )}

            {mealLogs.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-2xl mb-2">🍽️</p>
                <p className="text-sm font-semibold text-slate-600">No meals logged today</p>
              </div>
            ) : (
              <div className="space-y-2">
                {mealLogs.map(log => (
                  <div key={log.id} className="card p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{log.mealName}</p>
                        <span className={`tag mt-1 ${log.compliance === 'ON_PLAN' ? 'tag-green' : log.compliance === 'PARTIAL' ? 'tag-orange' : 'tag-blue'}`}>
                          {log.compliance?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div>
                        {log.trainerVerified ? (
                          <span className="tag tag-green text-xs">✓ Verified</span>
                        ) : (
                          <span className="tag tag-orange text-xs">Pending Review</span>
                        )}
                      </div>
                    </div>
                    {log.photoUrl && (
                      <img src={log.photoUrl.startsWith('/uploads') ? `http://localhost:8080/api${log.photoUrl}` : log.photoUrl} alt="Meal" className="mt-3 w-full max-h-48 object-cover rounded-lg" />
                    )}
                    {log.itemsConsumed && <p className="text-xs text-slate-600 mt-2">{log.itemsConsumed}</p>}
                    {log.estimatedCalories && (
                      <p className="text-xs text-slate-500 mt-1">~{log.estimatedCalories} cal • P:{log.proteinGrams}g C:{log.carbsGrams}g F:{log.fatGrams}g</p>
                    )}
                    {log.notes && <p className="text-xs text-slate-500 mt-1 italic">"{log.notes}"</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
