import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

// Terminal theme colors - retro green on black
const terminalColors = {
  bg: { value: '#0a0a0a' },
  text: { value: '#00ff00' },
  textDim: { value: '#00cc00' },
  accent: { value: '#00ff66' },
  border: { value: '#00aa00' },
  highlight: { value: '#003300' },
};

const config = defineConfig({
  // Body background/foreground per color mode. v3 replaces the v2 `mode()`
  // helper with the `_dark` conditional.
  globalCss: {
    body: {
      bg: 'white',
      color: 'gray.900',
      _dark: {
        bg: 'gray.800',
        color: 'gray.100',
      },
    },
  },
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#e6f7ff' },
          100: { value: '#bae3ff' },
          200: { value: '#7cc4fa' },
          300: { value: '#47a3f3' },
          400: { value: '#2186eb' },
          500: { value: '#0967d2' },
          600: { value: '#0552b5' },
          700: { value: '#03449e' },
          800: { value: '#01337d' },
          900: { value: '#002159' },
        },
        terminal: terminalColors,
      },
      fonts: {
        heading: { value: 'Inter, sans-serif' },
        body: { value: 'Inter, sans-serif' },
      },
    },
    // Map the brand palette onto the v3 semantic color-palette slots so that
    // `colorPalette="brand"` (and the default Button below) render with good
    // contrast in both light and dark mode. This replaces the v2 custom Button
    // `solid` variant that hand-rolled `mode()` brand contrast.
    semanticTokens: {
      colors: {
        brand: {
          solid: { value: { base: '{colors.brand.500}', _dark: '{colors.brand.400}' } },
          contrast: { value: { base: 'white', _dark: '{colors.gray.900}' } },
          fg: { value: { base: '{colors.brand.700}', _dark: '{colors.brand.300}' } },
          muted: { value: { base: '{colors.brand.100}', _dark: '{colors.brand.800}' } },
          subtle: { value: { base: '{colors.brand.50}', _dark: '{colors.brand.900}' } },
          emphasized: { value: { base: '{colors.brand.600}', _dark: '{colors.brand.500}' } },
          focusRing: { value: { base: '{colors.brand.500}', _dark: '{colors.brand.400}' } },
        },
      },
    },
    // Default Button to the brand color palette, matching the v2
    // `Button.defaultProps.colorScheme = 'brand'`.
    recipes: {
      button: {
        base: {
          colorPalette: 'brand',
        },
      },
    },
  },
});

const system = createSystem(defaultConfig, config);

export default system;
