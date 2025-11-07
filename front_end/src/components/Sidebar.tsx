import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Home, FileText, Brain, GraduationCap, UserCircle, Sparkles, Shield } from 'lucide-react';
import { apiClient, getStoredUser, type User } from '../services/api';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogoClick?: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'summarize', label: 'Summarize', icon: FileText },
  { id: 'flashcards', label: 'Flashcards', icon: Brain },
  { id: 'study', label: 'Study Mode', icon: GraduationCap },
  { id: 'admin', label: 'Admin', icon: Shield, adminOnly: true },
];

export function Sidebar({ currentPage, onNavigate, onLogoClick }: SidebarProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      // Try to get fresh user data from API
      const userData = await apiClient.getProfile();
      setUser(userData);
    } catch (err) {
      // Fallback to stored user if API fails
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      }
    }
  };

  const isAdmin = user?.is_staff || user?.is_superuser;

  return (
    <div className="h-screen w-64 bg-white border-r border-border flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-border">
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg gradient-blue-purple flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h2 className="gradient-text">LearnAI</h2>
        </button>
      </div>
      
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            // Hide admin menu item if user is not admin
            if (item.adminOnly && !isAdmin) {
              return null;
            }
            
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-accent rounded-lg"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className="relative z-10">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </nav>
      
      <div className="p-4 border-t border-border">
        <motion.button
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
            currentPage === 'settings'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
        >
          {currentPage === 'settings' && (
            <motion.div
              layoutId="activeSettingsTab"
              className="absolute inset-0 bg-accent rounded-lg"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <UserCircle className={`w-5 h-5 relative z-10 ${currentPage === 'settings' ? 'stroke-[2.5]' : ''}`} />
          <span className="relative z-10 text-sm">
            {user ? `${user.first_name} ${user.last_name}`.trim() || user.username : 'Profile'}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
