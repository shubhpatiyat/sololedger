import React, { createContext, useContext, useEffect, useState } from 'react';
import { themes } from '@/themes';

type Theme = 'light' | 'dark' | 'blue' | 'green' | 'gray' | 'orange';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currentTheme: typeof themes.dark;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Load theme from localStorage on initialization
    const savedTheme = localStorage.getItem('chatscape-theme') as Theme;
    return savedTheme || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const currentTheme = themes[theme];
    
    // Set CSS variables for current theme
    root.style.setProperty('--primary-main', currentTheme.primary.main);
    root.style.setProperty('--primary-light', currentTheme.primary.light);
    root.style.setProperty('--primary-dark', currentTheme.primary.dark);
    root.style.setProperty('--primary-text', currentTheme.primary.text);
    root.style.setProperty('--chat-input', currentTheme.primary.chatInput);
    root.style.setProperty('--inner-background', currentTheme.primary.innerBackground);
    root.style.setProperty('--outer-background', currentTheme.primary.outerBackground);
    root.style.setProperty('--sidebar-background', currentTheme.primary.sidebarBackground);
    root.style.setProperty('--secondary-main', currentTheme.secondary.main);
    root.style.setProperty('--error-main', currentTheme.error.main);
    root.style.setProperty('--success-main', currentTheme.success.main);
    root.style.setProperty('--warning-main', currentTheme.warning.main);
    root.style.setProperty('--profile-avatar-bg', currentTheme.profileAvatar.background);
    root.style.setProperty('--profile-avatar-text', currentTheme.profileAvatar.text);
    root.style.setProperty('--selected-chat-bg', currentTheme.selectedChat.background);
    root.style.setProperty('--selected-chat-text', currentTheme.selectedChat.text);
    root.style.setProperty('--selected-chat-border', currentTheme.selectedChat.borderRight);
    root.style.setProperty('--library-card-bg', currentTheme.libraryCard.background);
    root.style.setProperty('--input-border', currentTheme.input.border);
    root.style.setProperty('--input-text', currentTheme.input.text);
    
    // Add theme class
    root.classList.remove('light', 'dark', 'theme-blue', 'theme-green', 'theme-gray');
    if (theme === 'light') {
      root.classList.add('light');
    } else if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.add('dark', `theme-${theme}`);
    }
  }, [theme]);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chatscape-theme', theme);
  }, [theme]);

  const value = {
    theme,
    setTheme,
    currentTheme: themes[theme],
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};