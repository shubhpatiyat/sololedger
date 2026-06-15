import { createTheme, ThemeColors } from './common';

const themeLightColors: ThemeColors = {
  primary: {
    main: '#1A72B8',
    light: '#D9ECFA',
    dark: '#0F4F82',
    text: '#1A1A2E',
    chatInput: '#ffffff',
    innerBackground: '#ffffff',
    outerBackground: '#F4F9FD',
    sidebarBackground: '#F8FBFE',
  },
  secondary: {
    main: '#5B6B7D',
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
    background: '#1A72B8',
    text: '#ffffff',
  },
  selectedChat: {
    background: '#E8F3FB',
    text: '#1A1A2E',
    borderRight: '#1A72B8',
  },
  libraryCard: {
    background: '#ffffff',
  },
  input: {
    border: '#1A72B8',
    text: '#1A1A2E',
  },
};

export default createTheme(themeLightColors);
