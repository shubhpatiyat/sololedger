import { useTheme } from '@/contexts/ThemeContext';

export const useCustomTheme = () => {
  const { currentTheme } = useTheme();
  return currentTheme;
};