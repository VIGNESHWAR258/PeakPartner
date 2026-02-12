import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { Profile, ApiResponse } from '../../types';

export default function TrainerDashboard() {
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

    if (role !== 'TRAINER') {
      navigate('/client/dashboard');
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
            <p className="text-sm opacity-90">Trainer Dashboard</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Active Clients
            </h3>
            <p className="text-3xl font-bold text-primary-600">0</p>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Sessions This Week
            </h3>
            <p className="text-3xl font-bold text-accent-500">0</p>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Average Rating
            </h3>
            <p className="text-3xl font-bold text-yellow-500">
              {profile?.avgRating?.toFixed(1) || '0.0'} ⭐
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 text-center rounded-lg bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
              <div className="text-2xl mb-2">📅</div>
              <div className="text-sm font-semibold">Set Availability</div>
            </button>
            <button className="p-4 text-center rounded-lg bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
              <div className="text-2xl mb-2">💪</div>
              <div className="text-sm font-semibold">Create Workout</div>
            </button>
            <button className="p-4 text-center rounded-lg bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
              <div className="text-2xl mb-2">🥗</div>
              <div className="text-sm font-semibold">Create Diet Plan</div>
            </button>
            <button className="p-4 text-center rounded-lg bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
              <div className="text-2xl mb-2">👥</div>
              <div className="text-sm font-semibold">View Clients</div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg">No recent activity</p>
            <p className="text-sm mt-2">
              Your client interactions will appear here
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
