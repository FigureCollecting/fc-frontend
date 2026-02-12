/**
 * Tests for TerminalThemeProvider component
 */
import React from 'react';
import { render, screen, cleanup, act } from '@testing-library/react';

// Mock requestAnimationFrame to execute synchronously
const originalRAF = window.requestAnimationFrame;
beforeAll(() => {
  window.requestAnimationFrame = (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  };
});
afterAll(() => {
  window.requestAnimationFrame = originalRAF;
});

// Mock useCustomTheme
jest.mock('../../hooks/useCustomTheme', () => ({
  useCustomTheme: jest.fn(),
  themeColors: {
    terminal: {
      bg: '#0a0a0a',
      text: '#00ff00',
      textAlt: '#00ff66',
      accent: '#00ff66',
      border: '#00aa00',
      hover: '#003300',
      navBg: '#0a0a0a',
      cardBg: '#0d0d0d',
      fontFamily: '"Fira Code", monospace',
      borderRadius: '0px',
      textShadow: '0 0 5px rgba(0, 255, 0, 0.5)',
      fontUrl: null,
    },
    cyberpunk: {
      bg: '#0a0014',
      text: '#00ffff',
      textAlt: '#ff00ff',
      accent: '#00ffff',
      accentSecondary: '#ff00ff',
      border: '#1a0033',
      hover: '#1a0033',
      navBg: '#0a0014',
      cardBg: '#100022',
      fontFamily: '"Orbitron", sans-serif',
      borderRadius: '0px',
      textShadow: '0 0 5px rgba(0, 255, 255, 0.5)',
      fontUrl: 'https://fonts.googleapis.com/css2?family=Orbitron',
      buttonBg: '#1a0033',
      buttonText: '#00ffff',
      fontSize: '1rem',
    },
  },
  getThemeColors: jest.fn(),
}));

import ThemeStyleProvider from '../TerminalThemeProvider';
import { useCustomTheme, getThemeColors } from '../../hooks/useCustomTheme';

const mockedUseCustomTheme = useCustomTheme as jest.MockedFunction<typeof useCustomTheme>;
const mockedGetThemeColors = getThemeColors as jest.MockedFunction<typeof getThemeColors>;

describe('ThemeStyleProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Remove any added style tags and font links
    document.querySelectorAll('#custom-theme-global-styles, #custom-theme-font').forEach(el => el.remove());
    document.documentElement.classList.remove('terminal-theme', 'dark-theme', 'custom-theme');
    document.body.style.backgroundColor = '';
    document.body.style.color = '';
    document.body.style.fontFamily = '';
  });

  afterEach(cleanup);

  it('should render children', () => {
    mockedUseCustomTheme.mockReturnValue({ colorProfile: 'light' } as any);
    mockedGetThemeColors.mockReturnValue(null);

    render(
      <ThemeStyleProvider>
        <div data-testid="child">Hello</div>
      </ThemeStyleProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should apply light mode (remove custom styles)', () => {
    mockedUseCustomTheme.mockReturnValue({ colorProfile: 'light' } as any);
    mockedGetThemeColors.mockReturnValue(null);

    render(
      <ThemeStyleProvider>
        <div>Light</div>
      </ThemeStyleProvider>
    );

    expect(document.documentElement.classList.contains('custom-theme')).toBe(false);
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
    expect(document.body.style.backgroundColor).toBe('');
  });

  it('should remove existing style tag in light mode', () => {
    // Pre-add a style tag that light mode should remove
    const styleTag = document.createElement('style');
    styleTag.id = 'custom-theme-global-styles';
    styleTag.textContent = 'body { color: red; }';
    document.head.appendChild(styleTag);

    mockedUseCustomTheme.mockReturnValue({ colorProfile: 'light' } as any);
    mockedGetThemeColors.mockReturnValue(null);

    render(
      <ThemeStyleProvider>
        <div>Light</div>
      </ThemeStyleProvider>
    );

    // Style tag should be removed
    expect(document.getElementById('custom-theme-global-styles')).toBeNull();
  });

  it('should apply dark mode styles and generate CSS', () => {
    mockedUseCustomTheme.mockReturnValue({ colorProfile: 'dark' } as any);
    mockedGetThemeColors.mockReturnValue(null);

    render(
      <ThemeStyleProvider>
        <div>Dark</div>
      </ThemeStyleProvider>
    );

    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
    expect(document.body.style.backgroundColor).toBe('rgb(26, 32, 44)');

    // With requestAnimationFrame mocked synchronously, style tag should have content
    const styleTag = document.getElementById('custom-theme-global-styles') as HTMLStyleElement;
    expect(styleTag).toBeTruthy();
    expect(styleTag?.textContent).toContain('dark-theme');
    expect(styleTag?.textContent).toContain('#1A202C');
  });

  it('should apply terminal theme with scanline effect CSS', () => {
    const terminalColors = {
      bg: '#0a0a0a',
      text: '#00ff00',
      textAlt: '#00ff66',
      accent: '#00ff66',
      border: '#00aa00',
      hover: '#003300',
      navBg: '#0a0a0a',
      cardBg: '#0d0d0d',
      fontFamily: '"Fira Code", monospace',
      borderRadius: '0px',
      textShadow: '0 0 5px rgba(0, 255, 0, 0.5)',
      fontUrl: null,
    };

    mockedUseCustomTheme.mockReturnValue({ colorProfile: 'terminal' } as any);
    mockedGetThemeColors.mockReturnValue(terminalColors);

    render(
      <ThemeStyleProvider>
        <div>Terminal</div>
      </ThemeStyleProvider>
    );

    expect(document.documentElement.classList.contains('custom-theme')).toBe(true);
    expect(document.body.style.fontFamily).toBe('"Fira Code", monospace');

    // Style tag should contain terminal-specific CSS including scanline effect
    const styleTag = document.getElementById('custom-theme-global-styles') as HTMLStyleElement;
    expect(styleTag).toBeTruthy();
    expect(styleTag?.textContent).toContain('custom-theme');
    expect(styleTag?.textContent).toContain('#0a0a0a');
    // Terminal has text-shadow
    expect(styleTag?.textContent).toContain('text-shadow');
    // Terminal has scanline effect (linear-gradient)
    expect(styleTag?.textContent).toContain('linear-gradient');
  });

  it('should load Google Font when URL provided', () => {
    const cyberpunkColors = {
      bg: '#0a0014',
      text: '#00ffff',
      textAlt: '#ff00ff',
      accent: '#00ffff',
      accentSecondary: '#ff00ff',
      border: '#1a0033',
      hover: '#1a0033',
      navBg: '#0a0014',
      cardBg: '#100022',
      fontFamily: '"Orbitron", sans-serif',
      borderRadius: '0px',
      textShadow: '0 0 5px rgba(0, 255, 255, 0.5)',
      fontUrl: 'https://fonts.googleapis.com/css2?family=Orbitron',
      buttonBg: '#1a0033',
      buttonText: '#00ffff',
      fontSize: '1rem',
    };

    mockedUseCustomTheme.mockReturnValue({ colorProfile: 'cyberpunk' } as any);
    mockedGetThemeColors.mockReturnValue(cyberpunkColors);

    render(
      <ThemeStyleProvider>
        <div>Cyberpunk</div>
      </ThemeStyleProvider>
    );

    // Should have added a font link
    const fontLink = document.getElementById('custom-theme-font');
    expect(fontLink).toBeTruthy();
    expect(fontLink?.getAttribute('href')).toBe('https://fonts.googleapis.com/css2?family=Orbitron');

    // Style tag should contain cyberpunk-specific CSS
    const styleTag = document.getElementById('custom-theme-global-styles') as HTMLStyleElement;
    expect(styleTag).toBeTruthy();
    expect(styleTag?.textContent).toContain('custom-theme');
    expect(styleTag?.textContent).toContain('#ff00ff'); // accentSecondary
    expect(styleTag?.textContent).toContain('neon'); // neon effects
  });

  it('should remove existing font link when loading new font', () => {
    // Pre-add a font link
    const existingLink = document.createElement('link');
    existingLink.id = 'custom-theme-font';
    existingLink.href = 'old-font.css';
    document.head.appendChild(existingLink);

    const cyberpunkColors = {
      bg: '#0a0014',
      text: '#00ffff',
      textAlt: '#ff00ff',
      accent: '#00ffff',
      accentSecondary: '#ff00ff',
      border: '#1a0033',
      hover: '#1a0033',
      navBg: '#0a0014',
      cardBg: '#100022',
      fontFamily: '"Orbitron", sans-serif',
      borderRadius: '0px',
      textShadow: '0 0 5px rgba(0, 255, 255, 0.5)',
      fontUrl: 'https://fonts.googleapis.com/css2?family=Orbitron',
      buttonBg: '#1a0033',
      buttonText: '#00ffff',
      fontSize: '1rem',
    };

    mockedUseCustomTheme.mockReturnValue({ colorProfile: 'cyberpunk' } as any);
    mockedGetThemeColors.mockReturnValue(cyberpunkColors);

    render(
      <ThemeStyleProvider>
        <div>Cyberpunk</div>
      </ThemeStyleProvider>
    );

    // The old link should be replaced
    const fontLink = document.getElementById('custom-theme-font');
    expect(fontLink).toBeTruthy();
    expect(fontLink?.getAttribute('href')).toBe('https://fonts.googleapis.com/css2?family=Orbitron');
  });

  it('should clean up on unmount', () => {
    mockedUseCustomTheme.mockReturnValue({ colorProfile: 'dark' } as any);
    mockedGetThemeColors.mockReturnValue(null);

    const { unmount } = render(
      <ThemeStyleProvider>
        <div>Dark</div>
      </ThemeStyleProvider>
    );

    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);

    unmount();

    expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
  });

  it('should reuse existing style tag for dark mode', () => {
    // Pre-add a style tag
    const styleTag = document.createElement('style');
    styleTag.id = 'custom-theme-global-styles';
    document.head.appendChild(styleTag);

    mockedUseCustomTheme.mockReturnValue({ colorProfile: 'dark' } as any);
    mockedGetThemeColors.mockReturnValue(null);

    render(
      <ThemeStyleProvider>
        <div>Dark</div>
      </ThemeStyleProvider>
    );

    // Should reuse existing tag, not create a new one
    const tags = document.querySelectorAll('#custom-theme-global-styles');
    expect(tags.length).toBe(1);
    expect(tags[0].textContent).toContain('dark-theme');
  });

  it('should generate theme styles without textShadow', () => {
    const minimalColors = {
      bg: '#ffffff',
      text: '#000000',
      textAlt: '#333333',
      accent: '#0066ff',
      border: '#cccccc',
      hover: '#eeeeee',
      navBg: '#ffffff',
      cardBg: '#f5f5f5',
      fontFamily: 'Arial, sans-serif',
      borderRadius: '4px',
      textShadow: 'none',
      fontUrl: null,
    };

    mockedUseCustomTheme.mockReturnValue({ colorProfile: 'custom' as any } as any);
    mockedGetThemeColors.mockReturnValue(minimalColors);

    render(
      <ThemeStyleProvider>
        <div>Custom</div>
      </ThemeStyleProvider>
    );

    const styleTag = document.getElementById('custom-theme-global-styles') as HTMLStyleElement;
    expect(styleTag).toBeTruthy();
    expect(styleTag?.textContent).toContain('#ffffff');
    // Should not contain scanline effect since it's not terminal
    expect(styleTag?.textContent).not.toContain('scanline');
  });
});
