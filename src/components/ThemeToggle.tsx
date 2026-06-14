import React from 'react';
import {
  Menu,
  Portal,
  Button,
  Icon,
  HStack,
  Text,
  Box,
} from '@chakra-ui/react';
import { FaTerminal, FaDragon, FaRobot, FaSnowflake } from 'react-icons/fa';
import { TbBrandRadixUi } from 'react-icons/tb';
import { useCustomTheme, getThemeColors } from '../hooks/useCustomTheme';
import { THEME_OPTIONS } from '../stores/themeStore';
import { ColorProfile } from '../types';
import { LuChevronDown, LuMoon, LuStar, LuSun } from 'react-icons/lu';

// Icon mapping for each theme
const themeIcons: Record<ColorProfile, React.ReactElement> = {
  light: <LuSun />,
  dark: <LuMoon />,
  terminal: <Icon asChild><FaTerminal /></Icon>,
  tokyonight: <LuStar />, // Stars for Tokyo Night
  nord: <Icon asChild><FaSnowflake /></Icon>, // Snowflake for Nordic theme
  dracula: <Icon asChild><FaDragon /></Icon>,
  solarized: <Icon asChild><TbBrandRadixUi /></Icon>,
  cyberpunk: <Icon asChild><FaRobot /></Icon>,
};

// Color accents for menu items
const getThemeAccent = (profile: ColorProfile): string => {
  const colors = getThemeColors(profile);
  if (colors) return colors.accent;
  if (profile === 'dark') return '#718096';
  return '#3182ce';
};

const ThemeToggle: React.FC = () => {
  const { colorProfile, setCustomTheme } = useCustomTheme();

  const currentTheme = THEME_OPTIONS.find(t => t.value === colorProfile);

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button size="sm" variant="outline">
          {themeIcons[colorProfile]}
          {currentTheme?.label || 'Theme'}
          <LuChevronDown />
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content zIndex={1000}>
            {THEME_OPTIONS.map((theme) => (
              <Menu.Item
                key={theme.value}
                value={theme.value}
                onClick={() => setCustomTheme(theme.value)}
                bg={colorProfile === theme.value ? 'gray.100' : undefined}
                _dark={{ bg: colorProfile === theme.value ? 'gray.700' : undefined }}
              >
                <HStack gap={3} w="full">
                  <Box color={getThemeAccent(theme.value)}>
                    {themeIcons[theme.value]}
                  </Box>
                  <Box flex={1}>
                    <Text fontWeight={colorProfile === theme.value ? 'bold' : 'normal'}>
                      {theme.label}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {theme.description}
                    </Text>
                  </Box>
                </HStack>
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};

export default ThemeToggle;
