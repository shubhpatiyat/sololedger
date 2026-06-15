/**
 * Centralized Color Configuration
 * 
 * This file contains all color definitions for the entire application.
 * Use semantic naming to make colors meaningful and maintainable.
 */

export const colors = {
    // Primary Brand Colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe', 
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
  
    // Secondary Colors
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
  
    // Success Colors
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
  
    // Error Colors
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
  
    // Warning Colors
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
  
    // Info Colors
    info: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
      950: '#082f49',
    },
  
    // Neutral Colors
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
    },
  
    // Purple/Indigo Colors (for gradients)
    purple: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
      950: '#3b0764',
    },
  
    indigo: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b',
    },
  } as const;
  
  // Semantic Color Mappings
  export const semanticColors = {
    // Background Colors
    background: {
      primary: colors.neutral[50],
      secondary: colors.neutral[100],
      tertiary: colors.neutral[200],
      dark: colors.neutral[900],
      light: colors.neutral[50],
    },
  
    // Text Colors
    text: {
      primary: colors.neutral[900],
      secondary: colors.neutral[600],
      tertiary: colors.neutral[500],
      inverse: colors.neutral[50],
      muted: colors.neutral[400],
    },
  
    // Border Colors
    border: {
      primary: colors.neutral[200],
      secondary: colors.neutral[300],
      focus: colors.primary[500],
      error: colors.error[300],
      success: colors.success[300],
    },
  
    // Status Colors
    status: {
      success: {
        background: colors.success[50],
        backgroundHover: colors.success[100],
        border: colors.success[200],
        text: colors.success[700],
        icon: colors.success[600],
      },
      error: {
        background: colors.error[50],
        backgroundHover: colors.error[100],
        border: colors.error[200],
        text: colors.error[700],
        icon: colors.error[600],
      },
      warning: {
        background: colors.warning[50],
        backgroundHover: colors.warning[100],
        border: colors.warning[200],
        text: colors.warning[700],
        icon: colors.warning[600],
      },
      info: {
        background: colors.info[50],
        backgroundHover: colors.info[100],
        border: colors.info[200],
        text: colors.info[700],
        icon: colors.info[600],
      },
    },
  
    // Button Colors
    button: {
      primary: {
        background: colors.primary[600],
        backgroundHover: colors.primary[700],
        text: colors.neutral[50],
        border: colors.primary[600],
      },
      secondary: {
        background: colors.neutral[100],
        backgroundHover: colors.neutral[200],
        text: colors.neutral[700],
        border: colors.neutral[300],
      },
      success: {
        background: colors.success[600],
        backgroundHover: colors.success[700],
        text: colors.neutral[50],
        border: colors.success[600],
      },
      error: {
        background: colors.error[600],
        backgroundHover: colors.error[700],
        text: colors.neutral[50],
        border: colors.error[600],
      },
    },
  
    // Gradient Colors
    gradients: {
      primary: `from-${colors.primary[600]} to-${colors.indigo[600]}`,
      secondary: `from-${colors.neutral[50]} via-${colors.neutral[100]} to-${colors.neutral[200]}`,
      success: `from-${colors.success[50]} to-${colors.success[100]}`,
      error: `from-${colors.error[50]} to-${colors.error[100]}`,
      background: `from-${colors.primary[50]} via-${colors.indigo[50]} to-${colors.purple[50]}`,
    },
  } as const;
  
  // Tailwind CSS Color Classes (for dynamic usage)
  export const tailwindColors = {
    // Primary
    'primary-50': 'bg-blue-50',
    'primary-100': 'bg-blue-100',
    'primary-500': 'bg-blue-500',
    'primary-600': 'bg-blue-600',
    'primary-700': 'bg-blue-700',
    'text-primary-600': 'text-blue-600',
    'text-primary-700': 'text-blue-700',
    'border-primary-200': 'border-blue-200',
    'border-primary-300': 'border-blue-300',
  
    // Success
    'success-50': 'bg-green-50',
    'success-100': 'bg-green-100',
    'success-500': 'bg-green-500',
    'success-600': 'bg-green-600',
    'success-700': 'bg-green-700',
    'text-success-600': 'text-green-600',
    'text-success-700': 'text-green-700',
    'border-success-200': 'border-green-200',
  
    // Error
    'error-50': 'bg-red-50',
    'error-100': 'bg-red-100',
    'error-500': 'bg-red-500',
    'error-600': 'bg-red-600',
    'error-700': 'bg-red-700',
    'text-error-600': 'text-red-600',
    'text-error-700': 'text-red-700',
    'border-error-200': 'border-red-200',
  
    // Neutral
    'neutral-50': 'bg-gray-50',
    'neutral-100': 'bg-gray-100',
    'neutral-200': 'bg-gray-200',
    'neutral-300': 'bg-gray-300',
    'neutral-500': 'bg-gray-500',
    'neutral-600': 'bg-gray-600',
    'neutral-700': 'bg-gray-700',
    'neutral-800': 'bg-gray-800',
    'neutral-900': 'bg-gray-900',
    'text-neutral-600': 'text-gray-600',
    'text-neutral-700': 'text-gray-700',
    'text-neutral-900': 'text-gray-900',
    'border-neutral-200': 'border-gray-200',
    'border-neutral-300': 'border-gray-300',
  
    // Purple/Indigo
    'purple-50': 'bg-purple-50',
    'purple-600': 'bg-purple-600',
    'indigo-50': 'bg-indigo-50',
    'indigo-600': 'bg-indigo-600',
    'text-purple-600': 'text-purple-600',
    'text-indigo-600': 'text-indigo-600',
  } as const;
  
  // Utility functions for color management
  export const colorUtils = {
    // Get status colors based on status type
    getStatusColors: (status: 'success' | 'error' | 'warning' | 'info') => {
      return semanticColors.status[status];
    },
  
    // Get button colors based on variant
    getButtonColors: (variant: 'primary' | 'secondary' | 'success' | 'error') => {
      return semanticColors.button[variant];
    },
  
    // Get gradient classes
    getGradient: (type: keyof typeof semanticColors.gradients) => {
      return semanticColors.gradients[type];
    },
  };
  
  // Type definitions for better TypeScript support
  export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;
  export type ColorPalette = keyof typeof colors;
  export type StatusType = 'success' | 'error' | 'warning' | 'info';
  export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'error';
  export type GradientType = keyof typeof semanticColors.gradients;
  
  export default colors;