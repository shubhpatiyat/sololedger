import { createTheme, ThemeColors } from './common';

const theme4Colors: ThemeColors = {
  primary: {
    main: '#6b7280',
    light: '#d1d5db',
    dark: '#374151',
    text: '#f9fafb',
    chatInput: '#4b5563',
    innerBackground: '#111113',
    outerBackground: '#11182773',
    sidebarBackground: '#111113',
  },
  secondary: {
    main: '#4b5563',
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
    background: '#4b5563',
    text: '#f9fafb',
  },
  selectedChat: {
    background: '#374151',
    text: '#f9fafb',
    borderRight: '#6b7280',
  },
  libraryCard: {
    background: '#111113',
  },
  input: {
    border: '#6b7280',
    text: '#f9fafb',
  },
};

export default createTheme(theme4Colors);