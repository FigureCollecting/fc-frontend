/**
 * Enhanced theme tests (Chakra v3 system).
 *
 * The v2 component `variants`/`baseStyle` functions that took
 * `StyleFunctionProps` + `mode()` no longer exist in v3. The equivalent design
 * intent is now expressed through tokens, brand semantic tokens, the brand
 * Button recipe default, and v3's built-in dark-mode-aware recipes. These tests
 * validate that intent against the real v3 system.
 */
import system from '../theme';

describe('theme configuration (Chakra v3 system)', () => {
  it('should have brand colors', () => {
    expect(system.token('colors.brand.500')).toBe('#0967d2');
    expect(system.token('colors.brand.400')).toBe('#2186eb');
  });

  it('should have terminal colors', () => {
    expect(system.token('colors.terminal.bg')).toBe('#0a0a0a');
    expect(system.token('colors.terminal.text')).toBe('#00ff00');
  });

  it('should have Inter font', () => {
    expect(system.token('fonts.heading')).toContain('Inter');
    expect(system.token('fonts.body')).toContain('Inter');
  });

  describe('Button brand palette default', () => {
    it('should set the brand colorPalette on the button base recipe', () => {
      const buttonRecipe = system.getRecipe('button');
      expect(buttonRecipe.base?.colorPalette).toBe('brand');
    });

    it('should still provide the standard solid/outline/ghost variants', () => {
      const buttonRecipe = system.getRecipe('button');
      const variantKeys = Object.keys(buttonRecipe.variants?.variant ?? {});
      expect(variantKeys).toEqual(
        expect.arrayContaining(['solid', 'outline', 'ghost'])
      );
    });
  });

  describe('Brand semantic tokens', () => {
    it('should resolve solid/contrast/fg slots to css vars', () => {
      expect(system.token('colors.brand.solid')).toContain('--chakra-colors-brand-solid');
      expect(system.token('colors.brand.contrast')).toContain('--chakra-colors-brand-contrast');
      expect(system.token('colors.brand.fg')).toContain('--chakra-colors-brand-fg');
    });
  });

  describe('Built-in form recipes (v3 defaults, dark-mode aware)', () => {
    it('should expose input outline-style recipe', () => {
      const input = system.getRecipe('input');
      expect(input).toBeDefined();
      expect(input.variants?.variant).toBeDefined();
    });

    it('should expose textarea recipe', () => {
      const textarea = system.getRecipe('textarea');
      expect(textarea).toBeDefined();
    });

    it('should expose nativeSelect slot recipe', () => {
      const nativeSelect = system.getSlotRecipe('nativeSelect');
      expect(nativeSelect).toBeDefined();
      expect(nativeSelect.slots).toEqual(
        expect.arrayContaining(['root', 'field'])
      );
    });
  });

  describe('global styles', () => {
    it('should style the body with bg/color and a dark conditional', () => {
      const globalCss = system.getGlobalCss();
      const serialized = JSON.stringify(globalCss);
      expect(serialized).toContain('body');
      expect(serialized.toLowerCase()).toContain('dark');
    });
  });
});
