import { createTheme, ThemeColors } from './common';

const theme1Colors: ThemeColors = {
  primary: {
    main: '#1A72B8',
    light: '#69A9D8',
    dark: '#0F4F82',
    text: '#EFF5FB',
    chatInput: '#0F1D2B',
    innerBackground: '#0F1D2B',
    outerBackground: '#09131D',
    sidebarBackground: '#0B1724',
  },
  secondary: {
    main: '#123E63',
  },
  error: {
    main: '#EF5350',
  },
  success: {
    main: '#66BB6A',
  },
  warning: {
    main: '#FFB74D',
  },
  profileAvatar: {
    background: '#1A72B8',
    text: '#EFF5FB',
  },
  selectedChat: {
    background: '#13263A',
    text: '#ffffff',
    borderRight: '#69A9D8',
  },
  libraryCard: {
    background: '#122131',
  },
  input: {
    border: '#1A72B8',
    text: '#EFF5FB',
  },
};

export default createTheme(theme1Colors);
