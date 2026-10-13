import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import Dashboard from './Dashboard';
import { isAuthenticated, clearAuthTokens, AUTH_EXPIRED_EVENT } from './services/api';

export default function Router() {
  const [authStatus, setAuthStatus] = useState<boolean>(isAuthenticated);

  useEffect(() => {
    // The API client fires this when the session can no longer be refreshed
    const handleExpired = () => setAuthStatus(false);
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, []);

  const handleLogin = () => {
    setAuthStatus(true);
  };

  const handleLogout = () => {
    clearAuthTokens();
    window.location.hash = '';
    setAuthStatus(false);
  };

  // If authenticated, show dashboard, otherwise show landing page
  if (authStatus) {
    return <Dashboard onLogout={handleLogout} />;
  }

  return <LandingPage onLogin={handleLogin} />;
}
