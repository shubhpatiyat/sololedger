import { createTheme, ThemeColors } from './common';

const theme3Colors: ThemeColors = {
  primary: {
    main: '#10b981',
    light: '#6ee7b7',
    dark: '#047857',
    text: '#f0fdf4',
    chatInput: '#1f2937',
    innerBackground: '#111827',
    outerBackground: '#030712',
    sidebarBackground: '#111827',
  },
  secondary: {
    main: '#059669',
  },
  error: {
    main: '#ef4444',
  },
  success: {
    main: '#22c55e',
  },
  warning: {
    main: '#f59e0b',
  },
  profileAvatar: {
    background: '#10b981',
    text: '#f0fdf4',
  },
  selectedChat: {
    background: '#1f2937',
    text: '#f0fdf4',
    borderRight: '#10b981',
  },
  libraryCard: {
    background: '#1f2937',
  },
  input: {
    border: '#10b981',
    text: '#f0fdf4',
  },
};

export default createTheme(theme3Colors);