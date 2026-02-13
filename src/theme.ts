import { extendTheme, type ThemeConfig } from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';
import type { StyleFunctionProps } from '@chakra-ui/styled-system';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

// Terminal theme colors - retro green on black
const terminalColors = {
  bg: '#0a0a0a',
  text: '#00ff00',
  textDim: '#00cc00',
  accent: '#00ff66',
  border: '#00aa00',
  highlight: '#003300',
};

const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: '#e6f7ff',
      100: '#bae3ff',
      200: '#7cc4fa',
      300: '#47a3f3',
      400: '#2186eb',
      500: '#0967d2',
      600: '#0552b5',
      700: '#03449e',
      800: '#01337d',
      900: '#002159',
    },
    terminal: terminalColors,
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  styles: {
    global: (props: StyleFunctionProps) => ({
      body: {
        bg: mode('white', 'gray.800')(props),
        color: mode('gray.900', 'gray.100')(props),
      },
    }),
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      variants: {
        solid: (props: StyleFunctionProps) => {
          // Fix contrast for brand colorScheme in dark mode
          if (props.colorScheme === 'brand') {
            return {
              bg: mode('brand.500', 'brand.400')(props),
              color: mode('white', 'gray.900')(props),
              _hover: {
                // Dark mode: go darker + add glow instead of lighter (which looks disabled)
                bg: mode('brand.600', 'brand.500')(props),
                boxShadow: mode('none', '0 0 8px rgba(33, 134, 235, 0.5)')(props),
                _disabled: {
                  bg: mode('brand.500', 'brand.400')(props),
                  boxShadow: 'none',
                },
              },
              _active: {
                bg: mode('brand.700', 'brand.600')(props),
                boxShadow: 'none',
              },
            };
          }
          return {};
        },
      },
    },
    Input: {
      variants: {
        outline: (props: StyleFunctionProps) => ({
          field: {
            bg: mode('white', 'gray.700')(props),
            borderColor: mode('gray.200', 'gray.600')(props),
            color: mode('gray.900', 'gray.100')(props),
            _focus: {
              borderColor: mode('blue.500', 'blue.300')(props),
              boxShadow: mode(
                '0 0 0 1px var(--chakra-colors-blue-500)',
                '0 0 0 1px var(--chakra-colors-blue-300)'
              )(props),
            },
            _placeholder: {
              color: mode('gray.500', 'gray.400')(props),
            },
          },
        }),
      },
    },
    Select: {
      variants: {
        outline: (props: StyleFunctionProps) => ({
          field: {
            bg: mode('white', 'gray.700')(props),
            borderColor: mode('gray.200', 'gray.600')(props),
            color: mode('gray.900', 'gray.100')(props),
            _focus: {
              borderColor: mode('blue.500', 'blue.300')(props),
            },
          },
        }),
      },
    },
    Textarea: {
      variants: {
        outline: (props: StyleFunctionProps) => ({
          bg: mode('white', 'gray.700')(props),
          borderColor: mode('gray.200', 'gray.600')(props),
          color: mode('gray.900', 'gray.100')(props),
          _focus: {
            borderColor: mode('blue.500', 'blue.300')(props),
          },
          _placeholder: {
            color: mode('gray.500', 'gray.400')(props),
          },
        }),
      },
    },
    FormLabel: {
      baseStyle: (props: StyleFunctionProps) => ({
        color: mode('gray.700', 'gray.200')(props),
      }),
    },
    Card: {
      baseStyle: (props: StyleFunctionProps) => ({
        container: {
          bg: mode('white', 'gray.700')(props),
          borderColor: mode('gray.200', 'gray.600')(props),
        },
      }),
    },
    Menu: {
      baseStyle: (props: StyleFunctionProps) => ({
        list: {
          bg: mode('white', 'gray.700')(props),
          borderColor: mode('gray.200', 'gray.600')(props),
        },
        item: {
          bg: mode('white', 'gray.700')(props),
          color: mode('gray.800', 'gray.100')(props),
          _hover: {
            bg: mode('gray.100', 'gray.600')(props),
          },
          _focus: {
            bg: mode('gray.100', 'gray.600')(props),
          },
        },
      }),
    },
  },
});

export default theme;
