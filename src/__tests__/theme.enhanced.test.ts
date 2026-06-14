/**
 * Enhanced theme tests - covers component variant functions
 */
import theme from '../theme';

describe('theme configuration', () => {
  it('should have correct initial color mode', () => {
    expect(theme.token('config.initialColorMode')).toBe('light');
    expect(theme.token('config.useSystemColorMode')).toBe(false);
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

  it('should have Inter font', () => {
    expect(theme.token('fonts.heading')).toContain('Inter');
    expect(theme.token('fonts.body')).toContain('Inter');
  });

  describe('Button component variants', () => {
    it('should have solid variant for brand colorScheme', () => {
      const solidVariant = theme.token('components.Button.variants.solid');
      expect(solidVariant).toBeDefined();

      // Call with brand colorScheme
      const brandStyles = solidVariant({ colorScheme: 'brand', system, colorMode: 'light' });
      expect(brandStyles.bg).toBeTruthy();
      expect(brandStyles.color).toBeTruthy();
      expect(brandStyles._hover).toBeDefined();
    });

    it('should use default Chakra styles for non-brand colorScheme', () => {
      const solidVariant = theme.token('components.Button.variants.solid');
      const otherStyles = solidVariant({ colorScheme: 'red', system, colorMode: 'light' });
      // Non-brand colorSchemes get default Chakra solid variant styles (not brand-specific overrides)
      expect(otherStyles.bg).not.toContain('brand');
    });

    it('should have different styles for dark mode', () => {
      const solidVariant = theme.token('components.Button.variants.solid');
      const darkStyles = solidVariant({ colorScheme: 'brand', system, colorMode: 'dark' });
      expect(darkStyles.bg).toBeTruthy();
    });
  });

  describe('Input component variants', () => {
    it('should have outline variant', () => {
      const outlineVariant = theme.token('components.Input.variants.outline');
      expect(outlineVariant).toBeDefined();

      const styles = outlineVariant({ system, colorMode: 'light' });
      expect(styles.field).toBeDefined();
      expect(styles.field.bg).toBeTruthy();
      expect(styles.field._focus).toBeDefined();
      expect(styles.field._placeholder).toBeDefined();
    });
  });

  describe('Select component variants', () => {
    it('should have outline variant', () => {
      const outlineVariant = theme.token('components.Select.variants.outline');
      expect(outlineVariant).toBeDefined();

      const styles = outlineVariant({ system, colorMode: 'light' });
      expect(styles.field).toBeDefined();
      expect(styles.field.bg).toBeTruthy();
    });
  });

  describe('Textarea component variants', () => {
    it('should have outline variant', () => {
      const outlineVariant = theme.token('components.Textarea.variants.outline');
      expect(outlineVariant).toBeDefined();

      const styles = outlineVariant({ system, colorMode: 'light' });
      expect(styles.bg).toBeTruthy();
      expect(styles._focus).toBeDefined();
      expect(styles._placeholder).toBeDefined();
    });
  });

  describe('FormLabel component', () => {
    it('should have baseStyle', () => {
      const baseStyle = theme.token('components.FormLabel.baseStyle');
      expect(baseStyle).toBeDefined();

      const styles = baseStyle({ system, colorMode: 'light' });
      expect(styles.color).toBeTruthy();
    });
  });

  describe('Card component', () => {
    it('should have baseStyle', () => {
      const baseStyle = theme.token('components.Card.baseStyle');
      expect(baseStyle).toBeDefined();

      const styles = baseStyle({ system, colorMode: 'light' });
      expect(styles.container).toBeDefined();
      expect(styles.container.bg).toBeTruthy();
    });
  });

  describe('Menu component', () => {
    it('should have baseStyle', () => {
      const baseStyle = theme.token('components.Menu.baseStyle');
      expect(baseStyle).toBeDefined();

      const styles = baseStyle({ system, colorMode: 'light' });
      expect(styles.list).toBeDefined();
      expect(styles.item).toBeDefined();
      expect(styles.item._hover).toBeDefined();
      expect(styles.item._focus).toBeDefined();
    });
  });

  describe('global styles', () => {
    it('should have global body styles', () => {
      const globalStyles = theme.token('styles.global');
      expect(globalStyles).toBeDefined();

      const styles = globalStyles({ system, colorMode: 'light' });
      expect(styles.body).toBeDefined();
      expect(styles.body.bg).toBeTruthy();
      expect(styles.body.color).toBeTruthy();
    });
  });
});
