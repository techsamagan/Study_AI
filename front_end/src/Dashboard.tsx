import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { DocumentSummarizationView } from './components/DocumentSummarizationView';
import { FlashcardCreationView } from './components/FlashcardCreationView';
import { StudyModeView } from './components/StudyModeView';
import { SettingsView } from './components/SettingsView';
import { AdminView } from './components/AdminView';
import { AllDocumentsView } from './components/AllDocumentsView';
import './index.css';

interface DashboardProps {
  onLogout?: () => void;
}

const PAGES = ['dashboard', 'summarize', 'flashcards', 'study', 'settings', 'admin', 'all-documents'];

// The current page lives in the URL hash (e.g. #/study) so that refresh,
// back/forward and bookmarks keep working without a router dependency.
const pageFromHash = () => {
  const page = window.location.hash.replace(/^#\/?/, '');
  return PAGES.includes(page) ? page : 'dashboard';
};

export default function Dashboard({ onLogout }: DashboardProps) {
  const [currentPage, setCurrentPage] = useState(pageFromHash);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => setCurrentPage(pageFromHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((page: string) => {
    window.location.hash = `/${page}`;
    setSidebarOpen(false);
  }, []);

  const renderView = () => {
    switch (currentPage) {
      case 'summarize':
        return <DocumentSummarizationView />;
      case 'flashcards':
        return <FlashcardCreationView />;
      case 'study':
        return <StudyModeView />;
      case 'settings':
        return <SettingsView onLogout={onLogout} />;
      case 'admin':
        return <AdminView />;
      case 'all-documents':
        return <AllDocumentsView />;
      default:
        return <DashboardView onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="app-mobile-bar">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          className="app-mobile-bar__button"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="gradient-text">LearnAI</span>
      </header>

      {sidebarOpen && (
        <div className="app-backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      <Sidebar
        currentPage={currentPage}
        onNavigate={navigate}
        onLogoClick={() => navigate('dashboard')}
        open={sidebarOpen}
      />

      <motion.main
        key={currentPage}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="app-main"
      >
        <div className="max-w-7xl mx-auto">
          {renderView()}
        </div>
      </motion.main>
    </div>
  );
}
