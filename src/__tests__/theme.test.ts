import theme from '../theme';

describe('Theme Configuration', () => {
  it('should have color mode configuration', () => {
    expect(theme.config).toBeDefined();
    expect(theme.token('config.initialColorMode')).toBeDefined();
    expect(theme.token('config.useSystemColorMode')).toBeDefined();
  });

  it('should disable system color mode (controlled via store)', () => {
    expect(theme.token('config.useSystemColorMode')).toBe(false);
  });

  it('should have initial color mode as light', () => {
    expect(theme.token('config.initialColorMode')).toBe('light');
  });

  it('should have brand colors', () => {
    expect(theme.token('colors.brand')).toBeDefined();
    expect(theme.token('colors.brand')).toBe('#0967d2');
  });

  it('should have terminal colors', () => {
    expect(theme.token('colors.terminal')).toBeDefined();
    expect(theme.token('colors.terminal.bg')).toBe('#0a0a0a');
    expect(theme.token('colors.terminal.text')).toBe('#00ff00');
  });

  it('should have font configuration', () => {
    expect(theme.fonts).toBeDefined();
    expect(theme.token('fonts.heading')).toBe('Inter, sans-serif');
    expect(theme.token('fonts.body')).toBe('Inter, sans-serif');
  });

  describe('Component Styles', () => {
    it('should have Input component configuration', () => {
      expect(theme.token('components.Input')).toBeDefined();
      expect(theme.token('components.Input.variants')).toBeDefined();
      expect(theme.token('components.Input.variants.outline')).toBeDefined();
    });

    it('should have Select component configuration', () => {
      expect(theme.token('components.Select')).toBeDefined();
      expect(theme.token('components.Select.variants')).toBeDefined();
      expect(theme.token('components.Select.variants.outline')).toBeDefined();
    });

    it('should have Textarea component configuration', () => {
      expect(theme.token('components.Textarea')).toBeDefined();
      expect(theme.token('components.Textarea.variants')).toBeDefined();
      expect(theme.token('components.Textarea.variants.outline')).toBeDefined();
    });

    it('should have FormLabel component configuration', () => {
      expect(theme.token('components.FormLabel')).toBeDefined();
      expect(theme.token('components.FormLabel.baseStyle')).toBeDefined();
    });

    it('should have Card component configuration', () => {
      expect(theme.token('components.Card')).toBeDefined();
      expect(theme.token('components.Card.baseStyle')).toBeDefined();
    });

    it('should have Menu component configuration', () => {
      expect(theme.token('components.Menu')).toBeDefined();
      expect(theme.token('components.Menu.baseStyle')).toBeDefined();
    });

    it('should have Button default props', () => {
      expect(theme.token('components.Button')).toBeDefined();
      expect(theme.token('components.Button.defaultProps')).toBeDefined();
      expect(theme.token('components.Button.defaultProps.colorScheme')).toBe('brand');
    });
  });

  describe('Global Styles', () => {
    it('should have global styles as a function for dynamic mode support', () => {
      expect(theme.token('styles.global')).toBeDefined();
      // With mode() function, global styles are a function not a static object
      expect(typeof theme.token('styles.global')).toBe('function');
    });
  });
});
