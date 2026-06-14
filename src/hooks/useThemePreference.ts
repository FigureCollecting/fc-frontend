import { useEffect } from 'react';
import { useColorMode } from "../components/ui/color-mode";
import { stateLogger } from '../utils/logger';

type ColorMode = 'light' | 'dark';

export const useThemePreference = () => {
  const { colorMode, toggleColorMode, setColorMode } = useColorMode();

  // Save preference to localStorage
  const savePreference = (mode: ColorMode) => {
    try {
      localStorage.setItem('chakra-ui-color-mode', mode);
      setColorMode(mode);
    } catch (error) {
      stateLogger.error('Failed to save theme preference:', error);
    }
  };

  // Load preference on mount
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('chakra-ui-color-mode');
      if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
        setColorMode(savedMode);
      }
    } catch (error) {
      stateLogger.error('Failed to load theme preference:', error);
    }
  }, [setColorMode]);

  return {
    colorMode: colorMode as ColorMode,
    toggleColorMode,
    savePreference,
  };
};
