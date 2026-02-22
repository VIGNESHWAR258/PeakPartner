import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
import TrainerDashboard from './pages/trainer/TrainerDashboard';
import TrainerProfileEdit from './pages/trainer/TrainerProfileEdit';
import TrainerConnections from './pages/trainer/TrainerConnections';
import TrainerClientManage from './pages/trainer/TrainerClientManage';
import ClientDashboard from './pages/client/ClientDashboard';
import ClientProfileEdit from './pages/client/ClientProfileEdit';
import TrainerDiscovery from './pages/client/TrainerDiscovery';
import ClientConnections from './pages/client/ClientConnections';
import ClientPlans from './pages/client/ClientPlans';
import ClientDailyLog from './pages/client/ClientDailyLog';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            {/* Trainer routes */}
            <Route
              path="/trainer/dashboard"
              element={
                <ProtectedRoute requiredRole="TRAINER">
                  <TrainerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trainer/profile"
              element={
                <ProtectedRoute requiredRole="TRAINER">
                  <TrainerProfileEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trainer/connections"
              element={
                <ProtectedRoute requiredRole="TRAINER">
                  <TrainerConnections />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trainer/client/:connectionId"
              element={
                <ProtectedRoute requiredRole="TRAINER">
                  <TrainerClientManage />
                </ProtectedRoute>
              }
            />
            {/* Client routes */}
            <Route
              path="/client/dashboard"
              element={
                <ProtectedRoute requiredRole="CLIENT">
                  <ClientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/profile"
              element={
                <ProtectedRoute requiredRole="CLIENT">
                  <ClientProfileEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/trainers"
              element={
                <ProtectedRoute requiredRole="CLIENT">
                  <TrainerDiscovery />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/connections"
              element={
                <ProtectedRoute requiredRole="CLIENT">
                  <ClientConnections />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/plans"
              element={
                <ProtectedRoute requiredRole="CLIENT">
                  <ClientPlans />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/log"
              element={
                <ProtectedRoute requiredRole="CLIENT">
                  <ClientDailyLog />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

