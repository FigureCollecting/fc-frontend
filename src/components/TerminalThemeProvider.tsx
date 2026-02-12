import React, { useEffect } from 'react';
import { useCustomTheme, themeColors, getThemeColors } from '../hooks/useCustomTheme';
import { ColorProfile } from '../types';

interface ThemeStyleProviderProps {
  children: React.ReactNode;
}

// Dark mode colors for Chakra's dark mode
// WCAG: Hover must be visibly different from bg (3:1 contrast)
const darkModeColors = {
  bg: '#1A202C',
  cardBg: '#2D3748',
  border: '#4A5568',
  hover: '#3D4A5C', // VISIBLE hover - lighter than bg, darker than border
  text: '#E2E8F0',
  accent: '#63B3ED',
};

const FONT_LINK_ID = 'custom-theme-font';

// Load Google Font dynamically
const loadGoogleFont = (fontUrl: string | null) => {
  const existingLink = document.getElementById(FONT_LINK_ID);
  if (existingLink) {
    existingLink.remove();
  }

  if (fontUrl) {
    const link = document.createElement('link');
    link.id = FONT_LINK_ID;
    link.rel = 'stylesheet';
    link.href = fontUrl;
    document.head.appendChild(link);
  }
};

const ThemeStyleProvider: React.FC<ThemeStyleProviderProps> = ({ children }) => {
  const { colorProfile } = useCustomTheme();

  useEffect(() => {
    const STYLE_ID = 'custom-theme-global-styles';
    const htmlElement = document.documentElement;
    const bodyElement = document.body;

    // Remove all theme classes first
    htmlElement.classList.remove('terminal-theme', 'dark-theme', 'custom-theme');

    const colors = getThemeColors(colorProfile);

    if (colors) {
      // Custom theme
      htmlElement.classList.add('custom-theme');
      loadGoogleFont(colors.fontUrl);

      bodyElement.style.backgroundColor = colors.bg;
      bodyElement.style.color = colors.text;
      bodyElement.style.fontFamily = colors.fontFamily;

      let styleTag = document.getElementById(STYLE_ID) as HTMLStyleElement;
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = STYLE_ID;
        document.head.appendChild(styleTag);
      }

      requestAnimationFrame(() => {
        styleTag.textContent = generateThemeStyles(colors, colorProfile);
      });
    } else if (colorProfile === 'dark') {
      // Standard dark mode
      loadGoogleFont(null);
      htmlElement.classList.add('dark-theme');

      bodyElement.style.backgroundColor = darkModeColors.bg;
      bodyElement.style.color = darkModeColors.text;
      bodyElement.style.fontFamily = '';

      let styleTag = document.getElementById(STYLE_ID) as HTMLStyleElement;
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = STYLE_ID;
        document.head.appendChild(styleTag);
      }

      requestAnimationFrame(() => {
        styleTag.textContent = generateDarkModeStyles();
      });
    } else {
      // Light mode - remove all custom styles
      loadGoogleFont(null);
      bodyElement.style.backgroundColor = '';
      bodyElement.style.color = '';
      bodyElement.style.fontFamily = '';

      const styleTag = document.getElementById(STYLE_ID);
      if (styleTag) {
        styleTag.remove();
      }
    }

    return () => {
      htmlElement.classList.remove('terminal-theme', 'dark-theme', 'custom-theme');
      const styleTag = document.getElementById(STYLE_ID);
      if (styleTag) {
        styleTag.remove();
      }
      const fontLink = document.getElementById(FONT_LINK_ID);
      if (fontLink) {
        fontLink.remove();
      }
    };
  }, [colorProfile]);

  return <>{children}</>;
};

// Generate dark mode CSS
function generateDarkModeStyles() {
  const c = darkModeColors;
  return `
    /* Base */
    html.dark-theme,
    html.dark-theme body,
    html.dark-theme #root {
      background-color: ${c.bg} !important;
      color: ${c.text} !important;
    }

    /* Text */
    html.dark-theme .chakra-heading,
    html.dark-theme h1, html.dark-theme h2, html.dark-theme h3,
    html.dark-theme h4, html.dark-theme h5, html.dark-theme h6 {
      color: #F7FAFC !important;
    }

    html.dark-theme .chakra-text,
    html.dark-theme p,
    html.dark-theme span:not(.chakra-badge),
    html.dark-theme label {
      color: ${c.text} !important;
    }

    /* Cards */
    html.dark-theme .chakra-card,
    html.dark-theme [role="group"] {
      background-color: ${c.cardBg} !important;
      border-color: ${c.border} !important;
    }

    /* SIDEBAR - Active and Hover (THE KEY FIX) */
    html.dark-theme [data-testid="sidebar"] a,
    html.dark-theme [data-testid="sidebar"] button {
      color: ${c.text} !important;
    }

    html.dark-theme [data-testid="sidebar"] a[data-active="true"],
    html.dark-theme [data-testid="sidebar"] a:hover,
    html.dark-theme [data-testid="sidebar"] button:hover {
      background-color: ${c.hover} !important;
      color: ${c.accent} !important;
    }

    /* BUTTONS - Override Chakra's bright hover */
    html.dark-theme .chakra-button {
      border-color: ${c.border} !important;
    }

    /* Ghost/outline buttons get gray hover */
    html.dark-theme .chakra-button[data-variant="ghost"]:hover,
    html.dark-theme .chakra-button[data-variant="outline"]:hover {
      background-color: ${c.hover} !important;
    }

    /* Solid buttons (primary action) - blue with darker blue hover */
    html.dark-theme .chakra-button[data-variant="solid"],
    html.dark-theme .chakra-button:not([data-variant]) {
      background-color: #3182CE !important;
      color: white !important;
    }

    html.dark-theme .chakra-button[data-variant="solid"]:hover,
    html.dark-theme .chakra-button:not([data-variant]):hover {
      background-color: #2B6CB0 !important;
      box-shadow: 0 0 8px rgba(49, 130, 206, 0.5) !important;
    }

    /* Inputs - use base bg (darker) to distinguish from cards */
    html.dark-theme .chakra-input,
    html.dark-theme .chakra-textarea,
    html.dark-theme .chakra-input__field,
    html.dark-theme input,
    html.dark-theme textarea {
      background-color: ${c.bg} !important;
      border-color: ${c.border} !important;
      color: #F7FAFC !important;
      -webkit-text-fill-color: #F7FAFC !important;
    }

    /* Form controls and labels should be transparent */
    html.dark-theme .chakra-form-control {
      background-color: transparent !important;
    }

    html.dark-theme label,
    html.dark-theme .chakra-form__label {
      background-color: transparent !important;
    }

    /* Auth page card */
    html.dark-theme [data-testid="auth-card"] {
      background-color: ${c.cardBg} !important;
    }

    html.dark-theme .chakra-input::placeholder,
    html.dark-theme input::placeholder {
      color: #A0AEC0 !important;
      -webkit-text-fill-color: #A0AEC0 !important;
    }

    /* Select */
    html.dark-theme select,
    html.dark-theme .chakra-select,
    html.dark-theme .chakra-select__field {
      background-color: ${c.cardBg} !important;
      border-color: ${c.border} !important;
      color: #F7FAFC !important;
    }

    /* Links */
    html.dark-theme a:not([data-testid="sidebar"] a) {
      color: ${c.accent} !important;
    }

    /* Menu */
    html.dark-theme .chakra-menu__menu-list {
      background-color: ${c.bg} !important;
      border-color: ${c.border} !important;
    }

    html.dark-theme .chakra-menu__menuitem {
      background-color: ${c.bg} !important;
      color: ${c.text} !important;
    }

    html.dark-theme .chakra-menu__menuitem:hover,
    html.dark-theme .chakra-menu__menuitem:focus {
      background-color: ${c.hover} !important;
    }
  `;
}

// Theme colors type with optional properties
type ThemeColors = typeof themeColors[keyof typeof themeColors];

// Generate CSS for custom themes
function generateThemeStyles(colors: ThemeColors, colorProfile: ColorProfile) {
  const isTerminal = colorProfile === 'terminal';
  const isCyberpunk = colorProfile === 'cyberpunk';
  const hasTextShadow = colors.textShadow && colors.textShadow !== 'none';

  // Get secondary accent for cyberpunk (magenta)
  const accentSecondary = 'accentSecondary' in colors ? colors.accentSecondary : colors.accent;

  // Get custom font size if defined
  const fontSize = 'fontSize' in colors ? colors.fontSize : '1rem';

  // Get button colors - use dedicated buttonBg/buttonText for better contrast
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = colors as any;
  const buttonBg = c.buttonBg || colors.accent;
  const buttonText = c.buttonText || colors.bg;

  return `
    /* Base elements */
    html.custom-theme,
    html.custom-theme body,
    html.custom-theme #root {
      background-color: ${colors.bg} !important;
      color: ${colors.text} !important;
      font-family: ${colors.fontFamily} !important;
      font-size: ${fontSize} !important;
    }

    /* Apply font globally for terminal theme */
    ${isTerminal ? `
    html.custom-theme * {
      font-family: ${colors.fontFamily} !important;
    }
    /* Terminal needs larger text for readability */
    html.custom-theme p,
    html.custom-theme span,
    html.custom-theme label,
    html.custom-theme .chakra-text {
      font-size: 1.1rem !important;
    }
    ` : ''}

    /* Text shadow for themes with glow effects */
    ${hasTextShadow ? `
    html.custom-theme .chakra-heading,
    html.custom-theme h1,
    html.custom-theme h2,
    html.custom-theme h3 {
      text-shadow: ${colors.textShadow} !important;
    }
    ` : ''}

    /* TERMINAL SCANLINE EFFECT */
    ${isTerminal ? `
    html.custom-theme::before {
      content: " ";
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%);
      background-size: 100% 4px;
      z-index: 9999;
      pointer-events: none;
      opacity: 0.3;
    }
    ` : ''}

    /* CYBERPUNK NEON EFFECTS - PINK IS PROMINENT */
    ${isCyberpunk ? `
    /* PINK neon border on cards - THIS IS THE SIGNATURE LOOK */
    /* EXCLUDE form-related groups like InputGroup and FormControl */
    html.custom-theme .chakra-card,
    html.custom-theme [role="group"]:not(.chakra-input__group):not(.chakra-form-control) {
      border: 2px solid ${accentSecondary} !important;
      box-shadow: 0 0 15px rgba(255, 0, 255, 0.4), 0 0 30px rgba(255, 0, 255, 0.2), inset 0 0 20px rgba(0, 255, 255, 0.05) !important;
    }

    /* Ensure form controls don't get neon borders */
    html.custom-theme .chakra-form-control,
    html.custom-theme .chakra-input__group {
      border: none !important;
      box-shadow: none !important;
    }

    /* Dual-glow headings: CYAN + PINK */
    html.custom-theme .chakra-heading,
    html.custom-theme h1 {
      text-shadow: 0 0 10px rgba(0, 255, 255, 0.6), 0 0 20px rgba(255, 0, 255, 0.4), 0 0 40px rgba(255, 0, 255, 0.2) !important;
      color: ${colors.accent} !important;
    }

    html.custom-theme h2,
    html.custom-theme h3 {
      text-shadow: 0 0 8px rgba(255, 0, 255, 0.5), 0 0 16px rgba(0, 255, 255, 0.3) !important;
    }

    /* PINK neon accent on links */
    html.custom-theme a {
      color: ${accentSecondary} !important;
      text-shadow: 0 0 5px rgba(255, 0, 255, 0.3) !important;
    }

    html.custom-theme a:hover {
      text-shadow: 0 0 10px ${accentSecondary}, 0 0 20px ${accentSecondary} !important;
    }

    /* Neon button with PINK glow on hover */
    html.custom-theme .chakra-button {
      border: 1px solid ${accentSecondary} !important;
      box-shadow: 0 0 5px rgba(255, 0, 255, 0.2) !important;
    }

    html.custom-theme .chakra-button:hover {
      box-shadow: 0 0 15px rgba(255, 0, 255, 0.5), 0 0 30px rgba(0, 255, 255, 0.3) !important;
    }

    /* Solid buttons get muted purple with PINK glow for readable text */
    html.custom-theme .chakra-button[data-variant="solid"],
    html.custom-theme button[type="submit"] {
      background-color: ${buttonBg} !important;
      border: 1px solid ${accentSecondary} !important;
      color: ${buttonText} !important;
      font-weight: 600 !important;
      box-shadow: 0 0 15px rgba(255, 0, 255, 0.4), 0 0 30px rgba(0, 255, 255, 0.2) !important;
    }

    /* Sidebar hover with PINK glow */
    html.custom-theme [data-testid="sidebar"] a:hover,
    html.custom-theme [data-testid="sidebar"] button:hover {
      box-shadow: 0 0 10px rgba(255, 0, 255, 0.3), inset 0 0 5px rgba(0, 255, 255, 0.1) !important;
    }

    /* Input fields with subtle neon border */
    html.custom-theme input,
    html.custom-theme textarea,
    html.custom-theme select {
      border: 1px solid rgba(255, 0, 255, 0.3) !important;
    }

    html.custom-theme input:focus,
    html.custom-theme textarea:focus,
    html.custom-theme select:focus {
      border-color: ${accentSecondary} !important;
      box-shadow: 0 0 10px rgba(255, 0, 255, 0.3) !important;
    }
    ` : ''}

    /* Navbar and footer */
    html.custom-theme nav,
    html.custom-theme header,
    html.custom-theme [role="navigation"] {
      background-color: ${colors.navBg} !important;
      border-color: ${colors.border} !important;
    }

    /* Footer - needs distinct background from main content */
    /* Using cardBg to visually separate it from the main bg */
    html.custom-theme footer,
    html.custom-theme [role="contentinfo"],
    html.custom-theme [data-testid="footer"] {
      background-color: ${colors.cardBg} !important;
      border-color: ${colors.border} !important;
    }

    /* Cards and containers */
    html.custom-theme .chakra-card,
    html.custom-theme [role="group"] {
      background-color: ${colors.cardBg} !important;
      border-color: ${colors.border} !important;
      border-radius: ${colors.borderRadius} !important;
    }

    /* Auth pages (Login/Register) card container - override inline bg */
    html.custom-theme [data-testid="auth-card"] {
      background-color: ${colors.cardBg} !important;
    }

    /* Forms and form controls should be transparent to show parent bg */
    html.custom-theme [role="form"],
    html.custom-theme form,
    html.custom-theme .chakra-form-control {
      background-color: transparent !important;
    }

    /* Input GROUP wrapper - ensure it doesn't add background */
    html.custom-theme .chakra-input__group,
    html.custom-theme .chakra-input__left-element,
    html.custom-theme .chakra-input__right-element {
      background-color: transparent !important;
    }

    /* SIDEBAR - Active and Hover (THE KEY FIX) */
    html.custom-theme [data-testid="sidebar"] a,
    html.custom-theme [data-testid="sidebar"] button {
      color: ${colors.text} !important;
    }

    html.custom-theme [data-testid="sidebar"] a[data-active="true"],
    html.custom-theme [data-testid="sidebar"] a:hover,
    html.custom-theme [data-testid="sidebar"] button:hover {
      background-color: ${colors.hover} !important;
      color: ${colors.accent} !important;
    }

    /* BUTTONS - Override Chakra's colorScheme inline styles */
    /* Target ALL chakra-button elements - colorScheme sets inline styles we need to override */
    html.custom-theme .chakra-button {
      border-color: ${colors.border} !important;
      border-radius: ${colors.borderRadius} !important;
    }

    /* Ghost/outline buttons keep theme text color */
    html.custom-theme .chakra-button[data-variant="ghost"],
    html.custom-theme .chakra-button[data-variant="outline"] {
      color: ${colors.text} !important;
      background-color: transparent !important;
    }

    html.custom-theme .chakra-button[data-variant="ghost"]:hover,
    html.custom-theme .chakra-button[data-variant="outline"]:hover {
      background-color: ${colors.hover} !important;
    }

    /* Solid buttons AND colorScheme buttons (which are solid by default) */
    /* This targets ANY button that's not explicitly ghost/outline */
    html.custom-theme .chakra-button:not([data-variant="ghost"]):not([data-variant="outline"]):not([data-variant="link"]),
    html.custom-theme button[type="submit"] {
      background-color: ${buttonBg} !important;
      color: ${buttonText} !important;
    }

    html.custom-theme .chakra-button:not([data-variant="ghost"]):not([data-variant="outline"]):not([data-variant="link"]):hover,
    html.custom-theme button[type="submit"]:hover {
      background-color: ${buttonBg} !important;
      filter: brightness(1.15) !important;
    }

    /* Tooltips */
    html.custom-theme .chakra-tooltip,
    html.custom-theme [role="tooltip"],
    html.custom-theme .chakra-popover__content {
      background-color: ${colors.cardBg} !important;
      color: ${colors.text} !important;
      border-color: ${colors.border} !important;
      border-radius: ${colors.borderRadius} !important;
    }

    /* Menu and dropdown */
    html.custom-theme .chakra-menu__menu-list,
    html.custom-theme .chakra-select__menu {
      background-color: ${colors.bg} !important;
      border-color: ${colors.border} !important;
      border-radius: ${colors.borderRadius} !important;
    }

    html.custom-theme .chakra-menu__menuitem,
    html.custom-theme .chakra-select__option {
      background-color: ${colors.bg} !important;
      color: ${colors.text} !important;
    }

    html.custom-theme .chakra-menu__menuitem:hover,
    html.custom-theme .chakra-menu__menuitem:focus,
    html.custom-theme .chakra-select__option:hover {
      background-color: ${colors.hover} !important;
    }

    /* Inputs - use BASE bg (darker than cardBg) to distinguish from card */
    /* This creates a "sunken" effect for form fields */
    html.custom-theme .chakra-input,
    html.custom-theme .chakra-textarea,
    html.custom-theme .chakra-select,
    html.custom-theme .chakra-select__field,
    html.custom-theme input,
    html.custom-theme textarea,
    html.custom-theme select {
      background-color: ${colors.bg} !important;
      border-color: ${colors.border} !important;
      color: ${colors.text} !important;
      border-radius: ${colors.borderRadius} !important;
      -webkit-text-fill-color: ${colors.text} !important;
    }

    html.custom-theme .chakra-input::placeholder,
    html.custom-theme .chakra-textarea::placeholder,
    html.custom-theme input::placeholder,
    html.custom-theme textarea::placeholder {
      color: ${colors.text} !important;
      opacity: 0.5 !important;
      -webkit-text-fill-color: ${colors.text} !important;
    }

    /* Headings and text */
    html.custom-theme .chakra-heading,
    html.custom-theme h1, html.custom-theme h2, html.custom-theme h3,
    html.custom-theme h4, html.custom-theme h5, html.custom-theme h6 {
      color: ${colors.textAlt} !important;
    }

    html.custom-theme .chakra-text,
    html.custom-theme p,
    html.custom-theme span:not(.chakra-badge) {
      color: ${colors.text} !important;
    }

    /* Form labels - MUST have transparent bg, inherit from card/container */
    html.custom-theme label,
    html.custom-theme .chakra-form__label,
    html.custom-theme .chakra-form-control label {
      color: ${colors.text} !important;
      background-color: transparent !important;
    }

    /* Links */
    html.custom-theme .chakra-link,
    html.custom-theme a:not([data-testid="sidebar"] a) {
      color: ${colors.accent} !important;
    }

    /* Tables */
    html.custom-theme table,
    html.custom-theme .chakra-table {
      border-color: ${colors.border} !important;
    }

    html.custom-theme th,
    html.custom-theme td {
      border-color: ${colors.border} !important;
      color: ${colors.text} !important;
    }

    html.custom-theme thead {
      background-color: ${colors.cardBg} !important;
    }

    /* Modal */
    html.custom-theme .chakra-modal__content {
      background-color: ${colors.bg} !important;
      border-color: ${colors.border} !important;
      border-radius: ${colors.borderRadius} !important;
    }

    html.custom-theme .chakra-modal__header,
    html.custom-theme .chakra-modal__footer {
      background-color: ${colors.cardBg} !important;
    }

    /* Dividers */
    html.custom-theme .chakra-divider,
    html.custom-theme hr {
      border-color: ${colors.border} !important;
    }

    /* Stats */
    html.custom-theme .chakra-stat {
      background-color: ${colors.cardBg} !important;
    }

    /* Scrollbar */
    html.custom-theme ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    html.custom-theme ::-webkit-scrollbar-track {
      background: ${colors.bg};
    }

    html.custom-theme ::-webkit-scrollbar-thumb {
      background: ${colors.border};
      border-radius: 4px;
    }

    html.custom-theme ::-webkit-scrollbar-thumb:hover {
      background: ${colors.accent};
    }
  `;
}

export default ThemeStyleProvider;
