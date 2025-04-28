import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import LeadGeneration from './pages/LeadGeneration';
import CampaignList from './components/CampaignList';
import CampaignDetails from './pages/CampaignDetails';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/reset" element={<ResetPassword />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Chat />} />
        <Route path="settings" element={<Settings />} />
        <Route path="lead-generation" element={<LeadGeneration />} />
        <Route path="lead-generation/campaigns" element={<CampaignList />} />
        <Route path="lead-generation/campaigns/:id" element={<CampaignDetails />} />
      </Route>
    </Routes>
  );
}

export default App;