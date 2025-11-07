import { useState } from 'react';
import { motion } from 'motion/react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { DocumentSummarizationView } from './components/DocumentSummarizationView';
import { FlashcardCreationView } from './components/FlashcardCreationView';
import { StudyModeView } from './components/StudyModeView';
import { SettingsView } from './components/SettingsView';
import { AdminView } from './components/AdminView';
import './index.css';

interface DashboardProps {
  onLogout?: () => void;
}

export default function App({ onLogout }: DashboardProps) {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleLogoClick = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const renderView = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardView />;
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
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} onLogoClick={handleLogoClick} />
      
      <motion.main
        key={currentPage}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="ml-64 p-8"
      >
        <div className="max-w-7xl mx-auto">
          {renderView()}
        </div>
      </motion.main>
    </div>
  );
}
