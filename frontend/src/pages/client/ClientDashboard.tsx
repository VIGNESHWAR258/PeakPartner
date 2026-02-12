import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { Profile, ApiResponse } from '../../types';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
      navigate('/login');
      return;
    }

    if (role !== 'CLIENT') {
      navigate('/trainer/dashboard');
      return;
    }

    fetchProfile(token);
  }, [navigate]);

  const fetchProfile = async (token: string) => {
    try {
      const response: ApiResponse<Profile> = await api.get('/profiles/me', token);
      if (response.success) {
        setProfile(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="gradient-bg text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {profile?.fullName}</h1>
            <p className="text-sm opacity-90">Client Dashboard</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Today's Overview */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Today's Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Today's Workout
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                No workout scheduled
              </div>
            </div>
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Calories Target
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                0 / 2000 kcal
              </div>
            </div>
            <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Next Session
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                No sessions booked
              </div>
            </div>
          </div>
        </div>

        {/* Fitness Goals */}
        {profile?.fitnessGoals && profile.fitnessGoals.length > 0 && (
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Your Fitness Goals
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.fitnessGoals.map((goal, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold"
                >
                  {goal}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 text-center rounded-lg bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
              <div className="text-2xl mb-2">🏋️</div>
              <div className="text-sm font-semibold">Log Workout</div>
            </button>
            <button className="p-4 text-center rounded-lg bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
              <div className="text-2xl mb-2">🍽️</div>
              <div className="text-sm font-semibold">Log Meal</div>
            </button>
            <button className="p-4 text-center rounded-lg bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
              <div className="text-2xl mb-2">📸</div>
              <div className="text-sm font-semibold">Progress Photo</div>
            </button>
            <button className="p-4 text-center rounded-lg bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
              <div className="text-2xl mb-2">🔍</div>
              <div className="text-sm font-semibold">Find Trainer</div>
            </button>
          </div>
        </div>

        {/* Personal Records */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Personal Records 🏆
          </h2>
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg">No personal records yet</p>
            <p className="text-sm mt-2">
              Start logging your workouts to track your progress!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
