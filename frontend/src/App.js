import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import './App.css';

import LoginPage          from './pages/LoginPage';
import RegisterPage       from './pages/RegisterPage';
import FeedPage           from './pages/FeedPage';
import StudyMaterialsPage from './pages/StudyMaterialsPage';
import MessagesPage       from './pages/MessagesPage';
import ProfilePage        from './pages/ProfilePage';
import SavedPage          from './pages/SavedPage';
import NotificationsPage  from './pages/NotificationsPage';
import PostDetailPage     from './pages/PostDetailPage';
import DeveloperPage      from './pages/DeveloperPage';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="full-page-loader">Loading UniHub...</div>;
  return user ? children : <Navigate to="/login" replace />;
};
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="full-page-loader">Loading UniHub...</div>;
  return !user ? children : <Navigate to="/feed" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/"                element={<Navigate to="/study-materials" replace />} />
    <Route path="/login"           element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register"        element={<PublicRoute><RegisterPage /></PublicRoute>} />
    <Route path="/feed"            element={<PrivateRoute><FeedPage /></PrivateRoute>} />
    <Route path="/study-materials" element={<PrivateRoute><StudyMaterialsPage /></PrivateRoute>} />
    <Route path="/messages"        element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
    <Route path="/saved"           element={<PrivateRoute><SavedPage /></PrivateRoute>} />
    <Route path="/notifications"   element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
    <Route path="/profile/:username" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
    <Route path="/post/:id"        element={<PrivateRoute><PostDetailPage /></PrivateRoute>} />
    <Route path="/developer"       element={<PrivateRoute><DeveloperPage /></PrivateRoute>} />
    <Route path="*"                element={<Navigate to="/study-materials" replace />} />
  </Routes>
);

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { background: '#fff', color: '#1A1A1A', border: '1px solid #E8E4DC', borderRadius: '10px', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' },
              success: { iconTheme: { primary: '#2D6A4F', secondary: '#fff' } },
            }}
          />
          <AppRoutes />
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
export default App;
