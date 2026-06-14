import system from '../theme';

// The theme was migrated from Chakra UI v2 `extendTheme` to v3 `createSystem`.
// These tests validate the same design intent (brand/terminal colors, Inter
// fonts, brand-default Button, dark-mode body styling, brand semantic tokens)
// against the v3 system API (`system.token`, `system.getRecipe`,
// `system.getGlobalCss`).

describe('Theme Configuration (Chakra v3 system)', () => {
  it('should expose the v3 system API', () => {
    expect(system).toBeDefined();
    expect(typeof system.token).toBe('function');
    expect(typeof system.getRecipe).toBe('function');
    expect(typeof system.getGlobalCss).toBe('function');
  });

  it('should have brand colors', () => {
    expect(system.token('colors.brand.500')).toBe('#0967d2');
    expect(system.token('colors.brand.50')).toBe('#e6f7ff');
    expect(system.token('colors.brand.900')).toBe('#002159');
  });

  it('should have terminal colors', () => {
    expect(system.token('colors.terminal.bg')).toBe('#0a0a0a');
    expect(system.token('colors.terminal.text')).toBe('#00ff00');
    expect(system.token('colors.terminal.accent')).toBe('#00ff66');
  });

  it('should have Inter font configuration', () => {
    expect(system.token('fonts.heading')).toBe('Inter, sans-serif');
    expect(system.token('fonts.body')).toBe('Inter, sans-serif');
  });

  describe('Brand semantic tokens (replaces v2 brand Button contrast logic)', () => {
    it('should define brand colorPalette slots', () => {
      // Semantic tokens resolve to CSS var references in v3.
      expect(system.token('colors.brand.solid')).toBeTruthy();
      expect(system.token('colors.brand.contrast')).toBeTruthy();
      expect(system.token('colors.brand.fg')).toBeTruthy();
      expect(system.token('colors.brand.focusRing')).toBeTruthy();
    });
  });

  describe('Component recipes', () => {
    it('should default the Button to the brand color palette', () => {
      const buttonRecipe = system.getRecipe('button');
      expect(buttonRecipe).toBeDefined();
      expect(buttonRecipe.base?.colorPalette).toBe('brand');
    });

    it('should provide built-in input/textarea/select recipes (v3 defaults)', () => {
      // v3's defaultConfig supplies dark-mode-aware recipes for these out of the
      // box, so the app no longer hand-rolls them. Confirm they exist.
      expect(system.hasRecipe('input')).toBe(true);
      expect(system.hasRecipe('textarea')).toBe(true);
      expect(system.getSlotRecipe('nativeSelect')).toBeDefined();
    });
  });

  describe('Global styles', () => {
    it('should style the body with light and dark mode values', () => {
      const globalCss = system.getGlobalCss();
      const serialized = JSON.stringify(globalCss);
      expect(globalCss).toBeDefined();
      // body bg/color + a dark-mode conditional are present.
      expect(serialized).toContain('body');
      expect(serialized.toLowerCase()).toContain('dark');
    });
  });
});
