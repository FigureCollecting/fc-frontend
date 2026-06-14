import React, { useEffect, useState } from 'react';
import { useColorModeValue } from "./ui/color-mode";
import { Outlet } from 'react-router-dom';
import {
  Steps,
  Box,
  Container,
  Text,
  Flex,
  Popover,
  HoverCard,
  VStack,
  Badge,
  HStack,
} from '@chakra-ui/react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import SyncStatusBanner from './SyncStatusBanner';
import EmailVerificationBanner from './auth/EmailVerificationBanner';
import { useSyncEvents } from '../hooks/useSyncEvents';

// Import package.json to get version
const packageJson = require('../../package.json');

const Layout: React.FC = () => {
  const [versionInfo, setVersionInfo] = useState<any>(null);

  // Dark mode colors
  const footerBg = useColorModeValue('gray.50', 'gray.800');
  const footerBorder = useColorModeValue('gray.200', 'gray.700');
  const footerText = useColorModeValue('gray.600', 'gray.400');
  const footerTextHover = useColorModeValue('gray.700', 'gray.300');

  // Global SSE hook - connects when sync is active (managed by syncStore)
  useSyncEvents();

  useEffect(() => {
    const fetchVersionInfo = async (): Promise<void> => {
      try {
        const response = await fetch('/api/version');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Add frontend version to the response data
        const enrichedData = {
          ...data,
          services: {
            ...data.services,
            frontend: {
              service: 'frontend',
              version: packageJson.version,
              status: 'healthy'
            }
          }
        };

        setVersionInfo(enrichedData);
      } catch {
        setVersionInfo(null);
      }
    };

    fetchVersionInfo();
  }, []);

  return (
    <Box data-testid="layout" height="100vh" display="flex" flexDirection="column">
      <Box data-testid="navbar" flexShrink={0}>
        <Navbar />
      </Box>
      {/* Email verification banner - appears for unverified users */}
      <EmailVerificationBanner />
      {/* Sync status banner - appears when sync is active or just completed */}
      <SyncStatusBanner />
      <Box flex="1" overflowY="auto">
        <Container maxW={{ base: "100%", xl: "95%" }} pt={2} pb={2} minHeight="100%">
          <Box display="flex" gap={5} minHeight="100%">
            <Box data-testid="sidebar" w="250px" display={{ base: 'none', md: 'block' }}>
              <Sidebar />
            </Box>
            <Box data-testid="outlet" flex="1">
              <Outlet />
            </Box>
          </Box>
        </Container>
      </Box>
      {/* Footer with version info */}
      <Box data-testid="footer" role="contentinfo" as="footer" py={4} borderTop="1px" borderColor={footerBorder} bg={footerBg} flexShrink={0}>
        <Container maxW="container.xl">
          <Flex justify="flex-end" align="center">
            {versionInfo && (
              <HoverCard.Root
                positioning={{
                  placement: 'top-end'
                }}>
                <HoverCard.Trigger asChild>
                  <Text fontSize="xs" color={footerText} cursor="pointer" _hover={{ color: footerTextHover }}>
                    FigureCollecting
                  </Text>
                </HoverCard.Trigger>
                <HoverCard.Positioner>
                  <HoverCard.Content width="auto" maxW="400px">
                    <HoverCard.Body>
                      <VStack align="start" gap={2}>
                        <Text fontWeight="semibold" fontSize="sm">Service Versions</Text>
                        <VStack align="start" gap={1} fontSize="xs">
                          <HStack>
                            <Text minW="70px">Frontend:</Text>
                            <Badge colorPalette={versionInfo.services?.frontend?.status === 'healthy' ? 'green' : 'red'} size="sm">
                              v{versionInfo.services?.frontend?.version || 'unknown'}
                            </Badge>
                            <Text color="gray.500">({versionInfo.services?.frontend?.status || 'unknown'})</Text>
                          </HStack>
                          <HStack>
                            <Text minW="70px">Backend:</Text>
                            <Badge colorPalette={versionInfo.services?.backend?.status === 'healthy' ? 'green' : 'red'} size="sm">
                              v{versionInfo.services?.backend?.version || 'unknown'}
                            </Badge>
                            <Text color="gray.500">({versionInfo.services?.backend?.status || 'unknown'})</Text>
                          </HStack>
                          <HStack>
                            <Text minW="70px">Scraper:</Text>
                            <Badge colorPalette={versionInfo.services?.scraper?.status === 'healthy' ? 'green' : versionInfo.services?.scraper?.status === 'unavailable' ? 'gray' : 'red'} size="sm">
                              v{versionInfo.services?.scraper?.version || 'unknown'}
                            </Badge>
                            <Text color="gray.500">({versionInfo.services?.scraper?.status || 'unknown'})</Text>
                          </HStack>
                        </VStack>
                      </VStack>
                    </HoverCard.Body>
                  </HoverCard.Content>
                </HoverCard.Positioner>
              </HoverCard.Root>
            )}
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
