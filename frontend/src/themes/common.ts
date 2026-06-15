// Common theme structure and types
export interface ThemeColors {
  primary: {
    main: string;
    light: string;
    dark: string;
    text: string;
    chatInput: string;
    innerBackground: string;
    outerBackground: string;
    sidebarBackground: string;
  };
  secondary: {
    main: string;
  };
  error: {
    main: string;
  };
  success: {
    main: string;
  };
  warning: {
    main: string;
  };
  profileAvatar: {
    background: string;
    text: string;
  };
  selectedChat: {
    background: string;
    text: string;
    borderRight: string;
  };
  libraryCard: {
    background: string;
  };
  input: {
    border: string;
    text: string;
  };
}

export const createTheme = (colors: ThemeColors) => ({
  primary: {
    main: colors.primary.main,
    light: colors.primary.light,
    dark: colors.primary.dark,
    text: colors.primary.text,
    chatInput: colors.primary.chatInput,
    innerBackground: colors.primary.innerBackground,
    outerBackground: colors.primary.outerBackground,
    sidebarBackground: colors.primary.sidebarBackground,
  },
  secondary: {
    main: colors.secondary.main,
  },
  error: {
    main: colors.error.main,
  },
  success: {
    main: colors.success.main,
  },
  warning: {
    main: colors.warning.main,
  },
  profileAvatar: {
    background: colors.profileAvatar.background,
    text: colors.profileAvatar.text,
  },
  selectedChat: {
    background: colors.selectedChat.background,
    text: colors.selectedChat.text,
    borderRight: colors.selectedChat.borderRight,
  },
  libraryCard: {
    background: colors.libraryCard.background,
  },
  input: {
    border: colors.input.border,
    text: colors.input.text,
  },
});