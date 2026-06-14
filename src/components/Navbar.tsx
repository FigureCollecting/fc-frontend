import React from 'react';
import { useColorModeValue } from "./ui/color-mode";
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  IconButton,
  Button,
  Stack,
  Collapsible,
  Icon,
  Link,
  Popover,
  useBreakpointValue,
  useDisclosure,
  Avatar,
  Menu,
  Portal,
} from '@chakra-ui/react';
import { Tooltip } from './ui/tooltip';
import { toaster } from './ui/toaster';
import { FaUser, FaSignOutAlt, FaLock, FaUnlock, FaCog } from 'react-icons/fa';
import { useAuthStore } from '../stores/authStore';
import { useQueryClient } from 'react-query';
import ThemeToggle from './ThemeToggle';
import MfcCookiesModal from './MfcCookiesModal';
import { clearMfcCookies, hasMfcCookies, getStorageType } from '../utils/crypto';
import { LuChevronDown, LuChevronRight, LuMenu, LuX } from 'react-icons/lu';

const CookieStatusIndicator: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const userId = user?._id;
  const [cookiesStored, setCookiesStored] = React.useState(hasMfcCookies(userId));
  const [storageType, setStorageType] = React.useState(getStorageType(userId));
  const { open: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const iconColor = useColorModeValue(
    cookiesStored ? 'green.500' : 'gray.400',
    cookiesStored ? 'green.400' : 'gray.500'
  );
  const statusTextColor = useColorModeValue('gray.600', 'gray.300');

  // Refresh status when cookies might have changed
  const refreshStatus = React.useCallback(() => {
    setCookiesStored(hasMfcCookies(userId));
    setStorageType(getStorageType(userId));
  }, [userId]);

  React.useEffect(() => {
    const interval = setInterval(refreshStatus, 1000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  const handleClearCookies = () => {
    clearMfcCookies(userId);
    setCookiesStored(false);
    setStorageType(null);
    toaster.create({
      title: 'MFC Cookies Cleared',
      description: 'Your MyFigureCollection cookies have been removed.',
      type: 'success',
      duration: 3000,
      closable: true,
    });
  };

  const handleCookiesChanged = () => {
    refreshStatus();
  };

  const getTooltipLabel = () => {
    if (!cookiesStored) return 'MFC Cookies: None stored';
    if (storageType === 'session') return 'MFC Cookies: Session (until logout)';
    if (storageType === 'persistent') return 'MFC Cookies: Persistent (encrypted)';
    return 'MFC Cookies: Unknown';
  };

  return (
    <>
      <Menu.Root>
        <Tooltip content={getTooltipLabel()} positioning={{
          placement: "bottom"
        }}>
          <Menu.Trigger asChild><IconButton
              variant="ghost"
              size="sm"
              color={iconColor}
              aria-label="MFC Cookie Status"
              data-testid="cookie-status-button"
              minW="32px"><Icon w="16px" h="16px">{cookiesStored ? <FaLock /> : <FaUnlock />}</Icon></IconButton></Menu.Trigger>
        </Tooltip>
        <Portal><Menu.Positioner><Menu.Content>
              <Box px={4} py={2}>
                <Text fontWeight="semibold" fontSize="sm">MFC Cookie Status</Text>
                <Text fontSize="xs" color={statusTextColor}>
                  {cookiesStored ? `Active (${storageType})` : 'No cookies stored'}
                </Text>
              </Box>
              <Menu.Separator />
              {cookiesStored && (
                <Menu.Item onClick={handleClearCookies} color="red.500" value='item-0'>
                  Clear Cookies
                </Menu.Item>
              )}
              <Menu.Item onClick={onModalOpen} value='item-1'>
                <FaCog />Manage
              </Menu.Item>
            </Menu.Content></Menu.Positioner></Portal>
      </Menu.Root>
      <MfcCookiesModal
        isOpen={isModalOpen}
        onClose={onModalClose}
        onCookiesChanged={handleCookiesChanged}
      />
    </>
  );
};

const Navbar: React.FC = () => {
  const { open, onToggle } = useDisclosure();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    // Clear all React Query cache to prevent user data leakage
    queryClient.clear();
    
    // Clear auth store
    logout();
    
    // Clear any remaining localStorage items
    localStorage.removeItem('token');
    
    // Navigate to login
    navigate('/login');
  };

  return (
    <Box>
      <Flex
        bg={useColorModeValue('white', 'gray.800')}
        color={useColorModeValue('gray.600', 'white')}
        minH={'60px'}
        py={{ base: 2 }}
        px={{ base: 4 }}
        borderBottom={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('gray.200', 'gray.900')}
        align={'center'}
        boxShadow="sm"
      >
        <Flex
          flex={{ base: 1, md: 'auto' }}
          ml={{ base: -2 }}
          display={{ base: 'flex', md: 'none' }}
        >
          <IconButton
            onClick={onToggle}
            variant={'ghost'}
            aria-label={'Toggle Navigation'}
            data-testid="mobile-nav-toggle">{open ? (
              <Box data-testid="close-icon">
                <Icon w={3} h={3}><LuX /></Icon>
              </Box>
            ) : (
              <Box data-testid="hamburger-icon">
                <Icon w={5} h={5}><LuMenu /></Icon>
              </Box>
            )}</IconButton>
        </Flex>
        <Flex flex={{ base: 1 }} justify={{ base: 'center', md: 'start' }}>
          <Link
            asChild
            textAlign={useBreakpointValue({ base: 'center', md: 'left' })}
            fontFamily={'heading'}
            fontWeight="bold"
            color={useColorModeValue('gray.800', 'white')}
            _hover={{
              textDecoration: 'none',
            }}
          >
            <RouterLink to="/">FigureCollecting</RouterLink>
          </Link>

          <Flex display={{ base: 'none', md: 'flex' }} ml={10}>
            <DesktopNav />
          </Flex>
        </Flex>

        <Stack
          flex={{ base: 1, md: 0 }}
          justify={'flex-end'}
          direction={'row'}
          gap={6}
          align={'center'}
        >
          <ThemeToggle />
          {user && <CookieStatusIndicator />}
          {user ? (
            <Menu.Root>
              <Menu.Trigger asChild><Button
                  rounded={'full'}
                  variant={'plain'}
                  cursor={'pointer'}
                  minW={0}
                  data-testid="user-avatar-button"
                  aria-label="User Menu">
                  <Avatar.Root size={'sm'} bg="brand.500" color="white"><Avatar.Fallback name={user.username} /></Avatar.Root>
                </Button></Menu.Trigger>
              <Portal><Menu.Positioner><Menu.Content>
                    <Menu.Item asChild value='item-2'>
                      <RouterLink to="/profile">
                        <Icon><FaUser /></Icon>Profile
                      </RouterLink>
                    </Menu.Item>
                    <Menu.Separator />
                    <Menu.Item onClick={handleLogout} value='item-3'>
                      <Icon><FaSignOutAlt /></Icon>Sign Out
                    </Menu.Item>
                  </Menu.Content></Menu.Positioner></Portal>
            </Menu.Root>
          ) : (
            <>
              <Button
                asChild
                fontSize={'sm'}
                fontWeight={400}
                variant={'plain'}
              >
                <RouterLink to="/login">Sign In</RouterLink>
              </Button>
              <Button
                asChild
                display={{ base: 'none', md: 'inline-flex' }}
                fontSize={'sm'}
                fontWeight={600}
                colorPalette="brand"
              >
                <RouterLink to="/register">Sign Up</RouterLink>
              </Button>
            </>
          )}
        </Stack>
      </Flex>
      <Collapsible.Root open={open}>
        <Collapsible.Content>
          <MobileNav />
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
};

const DesktopNav = () => {
  const linkColor = useColorModeValue('gray.600', 'gray.200');
  const linkHoverColor = useColorModeValue('gray.800', 'white');
  const popoverContentBgColor = useColorModeValue('white', 'gray.800');

  return (
    <Stack direction={'row'} gap={4}>
      {NAV_ITEMS.map((navItem) => (
        <Box key={navItem.label}>
          <Popover.Root
            positioning={{
              placement: 'bottom-start'
            }}>
            <Popover.Trigger asChild>
              <Link
                asChild
                p={2}
                fontSize={'sm'}
                fontWeight={500}
                color={linkColor}
                _hover={{
                  textDecoration: 'none',
                  color: linkHoverColor,
                }}
              >
                <RouterLink to={navItem.href ?? '#'}>{navItem.label}</RouterLink>
              </Link>
            </Popover.Trigger>

            {navItem.children && (
              <Popover.Positioner>
                <Popover.Content
                  border={0}
                  boxShadow={'xl'}
                  bg={popoverContentBgColor}
                  p={4}
                  rounded={'xl'}
                  minW={'sm'}>
                  <Stack>
                    {navItem.children.map((child) => (
                      <DesktopSubNav key={child.label} {...child} />
                    ))}
                  </Stack>
                </Popover.Content>
              </Popover.Positioner>
            )}
          </Popover.Root>
        </Box>
      ))}
    </Stack>
  );
};

const DesktopSubNav = ({ label, href, subLabel }: NavItem) => {
  return (
    <Link
      asChild
      display={'block'}
      p={2}
      rounded={'md'}
      _hover={{ bg: useColorModeValue('brand.50', 'gray.900') }}
      aria-label={`Navigate to ${label}${subLabel ? ': ' + subLabel : ''}`}
    >
      <RouterLink to={href ?? '#'}>
      <Stack direction={'row'} align={'center'}>
        <Box>
          <Text
            transition={'all .3s ease'}
            _groupHover={{ color: 'brand.500' }}
            fontWeight={500}
          >
            {label}
          </Text>
          <Text fontSize={'sm'}>{subLabel}</Text>
        </Box>
        <Flex
          transition={'all .3s ease'}
          transform={'translateX(-10px)'}
          opacity={0}
          _groupHover={{ opacity: '100%', transform: 'translateX(0)' }}
          justify={'flex-end'}
          align={'center'}
          flex={1}
        >
          <Icon color={'brand.500'} w={5} h={5}><LuChevronRight /></Icon>
        </Flex>
      </Stack>
      </RouterLink>
    </Link>
  );
};

const MobileNav = () => {
  return (
    <Stack
      bg={useColorModeValue('white', 'gray.800')}
      p={4}
      display={{ md: 'none' }}
    >
      {NAV_ITEMS.map((navItem) => (
        <MobileNavItem key={navItem.label} {...navItem} />
      ))}
    </Stack>
  );
};

const MobileNavItem = ({ label, children, href }: NavItem) => {
  const { open, onToggle } = useDisclosure();

  return (
    <Stack gap={4} onClick={children && onToggle}>
      <Flex
        py={2}
        asChild
        justify={'space-between'}
        align={'center'}
        _hover={{
          textDecoration: 'none',
        }}
      >
        <RouterLink to={href ?? '#'}>
          <Text
            fontWeight={600}
            color={useColorModeValue('gray.600', 'gray.200')}
          >
            {label}
          </Text>
          {children && (
            <Icon
              transition={'all .25s ease-in-out'}
              transform={open ? 'rotate(180deg)' : ''}
              w={6}
              h={6}
            >
              <LuChevronDown />
            </Icon>
          )}
        </RouterLink>
      </Flex>
      <Collapsible.Root open={open} style={{ marginTop: '0!important' }}>
        <Collapsible.Content>
          <Stack
            mt={2}
            pl={4}
            borderLeft={1}
            borderStyle={'solid'}
            borderColor={useColorModeValue('gray.200', 'gray.700')}
            align={'start'}
          >
            {children &&
              children.map((child) => (
                <Link
                  key={child.label}
                  asChild
                  py={2}
                >
                  <RouterLink to={child.href || '#'}>{child.label}</RouterLink>
                </Link>
              ))}
          </Stack>
        </Collapsible.Content>
      </Collapsible.Root>
    </Stack>
  );
};

interface NavItem {
  label: string;
  subLabel?: string;
  children?: Array<NavItem>;
  href?: string;
}

const NAV_ITEMS: Array<NavItem> = [
  {
    label: 'Dashboard',
    href: '/',
  },
  {
    label: 'Collection',
    children: [
      {
        label: 'All Items',
        subLabel: 'View your entire collection',
        href: '/figures',
      },
      {
        label: 'Add New Item',
        subLabel: 'Add a new item to your collection',
        href: '/figures/add',
      },
    ],
  },
  {
    label: 'Search',
    href: '/search',
  },
  {
    label: 'Statistics',
    href: '/statistics',
  },
];

export default Navbar;
