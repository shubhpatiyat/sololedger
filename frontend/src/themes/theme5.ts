import { createTheme, ThemeColors } from './common';

const theme5Colors: ThemeColors = {
  primary: {
    main: '#f97316',
    light: '#fed7aa',
    dark: '#c2410c',
    text: '#fef7f0',
    chatInput: '#292524',
    innerBackground: '#1c1917',
    outerBackground: '#0c0a09',
    sidebarBackground: '#1c1917',
  },
  secondary: {
    main: '#ea580c',
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
    background: '#f97316',
    text: '#fef7f0',
  },
  selectedChat: {
    background: '#292524',
    text: '#fef7f0',
    borderRight: '#f97316',
  },
  libraryCard: {
    background: '#292524',
  },
  input: {
    border: '#f97316',
    text: '#fef7f0',
  },
};

export default createTheme(theme5Colors);