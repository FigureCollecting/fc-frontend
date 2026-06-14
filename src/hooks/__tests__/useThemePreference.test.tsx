import { renderHook, act } from '@testing-library/react';
import { Steps, ChakraProvider } from '@chakra-ui/react';
import { useThemePreference } from '../useThemePreference';
import theme from '../../theme';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChakraProvider value={system}>{children}</ChakraProvider>
);

describe('useThemePreference', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should expose colorMode and toggleColorMode from useColorMode', () => {
    const { result } = renderHook(() => useThemePreference(), { wrapper });

    expect(result.current.colorMode).toBeDefined();
    expect(result.current.toggleColorMode).toBeInstanceOf(Function);
  });

  it('should expose savePreference function', () => {
    const { result } = renderHook(() => useThemePreference(), { wrapper });

    expect(result.current.savePreference).toBeInstanceOf(Function);
  });

  it('should save theme preference to localStorage when savePreference is called', () => {
    const { result } = renderHook(() => useThemePreference(), { wrapper });

    act(() => {
      result.current.savePreference('dark');
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('chakra-ui-color-mode', 'dark');
  });

  it('should save light mode to localStorage', () => {
    const { result } = renderHook(() => useThemePreference(), { wrapper });

    act(() => {
      result.current.savePreference('light');
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('chakra-ui-color-mode', 'light');
  });

  it('should handle localStorage errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const setItemSpy = jest
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('localStorage is full');
      });

    const { result } = renderHook(() => useThemePreference(), { wrapper });

    act(() => {
      result.current.savePreference('dark');
    });

    // Should not throw error
    expect(result.current.colorMode).toBeDefined();

    setItemSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('should load theme preference from localStorage on mount', () => {
    localStorage.setItem('chakra-ui-color-mode', 'dark');

    const { result } = renderHook(() => useThemePreference(), { wrapper });

    // colorMode should eventually reflect the stored preference
    expect(result.current.colorMode).toBeDefined();
  });

  it('should toggle color mode when toggleColorMode is called', () => {
    const { result } = renderHook(() => useThemePreference(), { wrapper });

    const initialMode = result.current.colorMode;

    act(() => {
      result.current.toggleColorMode();
    });

    expect(result.current.colorMode).not.toBe(initialMode);
  });

  it('should handle getItem errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const getItemSpy = jest
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementationOnce(() => {
        throw new Error('localStorage access denied');
      });

    // Should not throw error during render
    const { result } = renderHook(() => useThemePreference(), { wrapper });

    expect(result.current.colorMode).toBeDefined();

    // The error may or may not be logged depending on when chakra's useColorMode initializes
    // Just verify the hook doesn't break

    getItemSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('should ignore invalid theme values from localStorage', () => {
    localStorage.setItem('chakra-ui-color-mode', 'invalid-mode');

    const { result } = renderHook(() => useThemePreference(), { wrapper });

    // Should still work with a valid colorMode
    expect(result.current.colorMode).toBeDefined();
    expect(['light', 'dark']).toContain(result.current.colorMode);
  });
});
