import { useEffect, useCallback } from 'react';
import { useColorMode } from '@chakra-ui/react';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import { updateUserProfile } from '../api';
import { ColorProfile } from '../types';

export const useCustomTheme = () => {
  const { setColorMode } = useColorMode();
  const { colorProfile, setColorProfile } = useThemeStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Keep Chakra color mode in sync
    // All custom themes except 'light' use dark as base for Chakra
    if (colorProfile === 'light') {
      setColorMode('light');
    } else {
      setColorMode('dark');
    }
  }, [colorProfile, setColorMode]);

  // Sync theme to backend when authenticated
  const setCustomTheme = useCallback((profile: ColorProfile) => {
    // Update local state first (optimistic update)
    setColorProfile(profile);

    // Sync to backend if authenticated (fire and forget, don't block UI)
    if (isAuthenticated) {
      updateUserProfile({ colorProfile: profile }).catch(() => {
        // Silently fail - local theme change still works
      });
    }
  }, [setColorProfile, isAuthenticated]);

  return {
    colorProfile,
    setCustomTheme,
  };
};

// Theme color palettes and styles for all custom themes
// WCAG CONTRAST GUIDELINES APPLIED:
// - Text contrast: 4.5:1 minimum
// - Non-text UI elements: 3:1 minimum
// - Hover states must be VISIBLY different from bg while keeping text readable
export const themeColors = {
  terminal: {
    bg: '#0a0a0a',
    cardBg: '#121212',
    navBg: '#0a0a0a',
    text: '#33ff33',
    textAlt: '#33ff33',
    border: '#1a3a1a',
    // VISIBLE hover: green-tinted, clearly different from black bg
    hover: '#1a3a1a',
    accent: '#ffcc00',
    // Darker button bg for better text contrast
    buttonBg: '#1a5a1a',
    buttonText: '#ffffff',
    // IBM Plex Mono - clean, compact monospace with retro feel
    fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
    fontUrl: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap',
    // Slightly smaller for compactness
    fontSize: '0.95rem',
    borderRadius: '0px',
    textShadow: '0 0 8px rgba(51, 255, 51, 0.6)',
    // Scanline effect for true retro feel
    specialEffect: 'scanlines',
  },

  // REPLACED: Sunset → Tokyo Night (1.9M+ installs, modern and beautiful)
  // Source: https://github.com/enkia/tokyo-night-vscode-theme
  tokyonight: {
    bg: '#1a1b26',
    cardBg: '#24283b',
    navBg: '#1a1b26',
    text: '#c0caf5',
    textAlt: '#a9b1d6',
    border: '#3b4261',
    // VISIBLE hover: lighter blue-gray, clearly different
    hover: '#3b4261',
    accent: '#7aa2f7', // Tokyo Night blue
    accentSecondary: '#bb9af7', // Purple accent
    // Darker muted button bg
    buttonBg: '#3d59a1',
    buttonText: '#ffffff',
    // Clean modern sans-serif
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
    fontSize: '1rem',
    borderRadius: '8px',
    textShadow: 'none',
    specialEffect: null,
  },

  // REPLACED: Gruvbox → Nord (2.3M+ installs, beautiful Nordic theme)
  // Source: https://www.nordtheme.com/
  nord: {
    bg: '#2e3440',
    cardBg: '#3b4252',
    navBg: '#2e3440',
    text: '#eceff4',
    textAlt: '#e5e9f0',
    border: '#4c566a',
    // VISIBLE hover: polar night lighter shade
    hover: '#434c5e',
    accent: '#88c0d0', // Nord frost
    accentSecondary: '#81a1c1', // Nord frost darker
    // Darker button for text contrast
    buttonBg: '#5e81ac',
    buttonText: '#ffffff',
    // Clean professional sans-serif
    fontFamily: "'Source Sans Pro', 'Segoe UI', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700&display=swap',
    fontSize: '1rem',
    borderRadius: '6px',
    textShadow: 'none',
    specialEffect: null,
  },

  dracula: {
    bg: '#282a36',
    cardBg: '#343746',
    navBg: '#282a36',
    text: '#f8f8f2',
    textAlt: '#f8f8f2',
    border: '#44475a',
    // VISIBLE hover: clearly lighter than bg
    hover: '#44475a',
    accent: '#bd93f9', // Purple
    accentSecondary: '#ff79c6', // Pink
    // Darker purple button for contrast
    buttonBg: '#6272a4',
    buttonText: '#ffffff',
    // Clean sans-serif that works well with Dracula
    fontFamily: "'Fira Sans', 'Segoe UI', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;500;600&display=swap',
    fontSize: '1rem',
    borderRadius: '8px',
    textShadow: 'none',
    specialEffect: null,
  },

  solarized: {
    bg: '#002b36',
    cardBg: '#073642',
    navBg: '#002b36',
    text: '#839496',
    textAlt: '#93a1a1',
    border: '#586e75',
    // VISIBLE hover: clearly lighter cyan-tint
    hover: '#094050',
    accent: '#268bd2', // Blue
    accentSecondary: '#2aa198', // Cyan
    // Muted button color
    buttonBg: '#2176a8',
    buttonText: '#ffffff',
    // Classic Solarized font pairing
    fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap',
    fontSize: '1rem',
    borderRadius: '6px',
    textShadow: 'none',
    specialEffect: null,
  },

  cyberpunk: {
    bg: '#0d0221',
    cardBg: '#1a0533',
    navBg: '#0d0221',
    text: '#ffffff',
    textAlt: '#e0e0e0',
    border: '#ff00ff', // PINK NEON BORDER
    // VISIBLE hover: purple with pink tint
    hover: '#2a0a4a',
    accent: '#00ffff', // Cyan neon
    accentSecondary: '#ff00ff', // Magenta/pink neon
    // Gradient button with muted colors for text contrast
    buttonBg: '#6b2a8a',
    buttonText: '#ffffff',
    // Roboto Mono - clean, compact monospace with techy feel
    fontFamily: "'Roboto Mono', 'Fira Code', monospace",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;600;700&display=swap',
    // Compact for readability
    fontSize: '0.95rem',
    borderRadius: '2px',
    // Dual-color glow: cyan AND pink
    textShadow: '0 0 10px rgba(0, 255, 255, 0.5), 0 0 20px rgba(255, 0, 255, 0.3)',
    specialEffect: 'neon',
  },
};

// Helper to get colors for a theme
export const getThemeColors = (profile: ColorProfile) => {
  if (profile === 'light' || profile === 'dark') {
    return null; // Use Chakra defaults
  }
  // Map profile names to themeColors keys
  const profileMap: Record<string, keyof typeof themeColors> = {
    terminal: 'terminal',
    tokyonight: 'tokyonight',
    nord: 'nord',
    dracula: 'dracula',
    solarized: 'solarized',
    cyberpunk: 'cyberpunk',
  };
  return themeColors[profileMap[profile]] || null;
};
