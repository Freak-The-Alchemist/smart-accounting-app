import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { Login } from './pages/auth/Login';
import { useAuth } from './hooks/useAuth';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900">Welcome to Smart Accounting</h1>
                  <p className="mt-4 text-xl text-gray-600">Your financial management solution</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* Add more routes here */}
      </Routes>
    </Router>
  );
};

export default App; 