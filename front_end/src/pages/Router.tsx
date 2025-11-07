import { useState, useEffect } from 'react';
import LandingPage from './App';
import Dashboard from '../App.tsx';
import { isAuthenticated, clearAuthTokens } from '../services/api';

export default function Router() {
  const [authStatus, setAuthStatus] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user is authenticated
    setAuthStatus(isAuthenticated());
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setAuthStatus(true);
  };

  const handleLogout = () => {
    clearAuthTokens();
    setAuthStatus(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show dashboard, otherwise show landing page
  if (authStatus) {
    return <Dashboard onLogout={handleLogout} />;
  }

  return <LandingPage onLogin={handleLogin} />;
}

