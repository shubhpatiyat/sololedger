import { createTheme, ThemeColors } from './common';

const theme2Colors: ThemeColors = {
  primary: {
    main: '#3b82f6',
    light: '#93c5fd',
    dark: '#1d4ed8',
    text: '#f1f5f9',
    chatInput: '#334155',
    innerBackground: '#0f172a',
    outerBackground: '#020617',
    sidebarBackground: '#0f172a',
  },
  secondary: {
    main: '#1e40af',
  },
  error: {
    main: '#ef4444',
  },
  success: {
    main: '#10b981',
  },
  warning: {
    main: '#f59e0b',
  },
  profileAvatar: {
    background: '#3b82f6',
    text: '#f1f5f9',
  },
  selectedChat: {
    background: '#1e293b',
    text: '#f1f5f9',
    borderRight: '#3b82f6',
  },
  libraryCard: {
    background: '#1e293b',
  },
  input: {
    border: '#3b82f6',
    text: '#f1f5f9',
  },
};

export default createTheme(theme2Colors);