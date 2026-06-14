import React, { useState } from 'react';
import { useColorModeValue } from "../components/ui/color-mode";
import { Link as RouterLink } from 'react-router-dom';
import {
  Steps,
  Box,
  Heading,
  SimpleGrid,
  Stat,
  Icon,
  Button,
  Flex,
  Text,
  Grid,
  GridItem,
  useDisclosure,
  HStack,
  Separator,
} from '@chakra-ui/react';
import { FaCube, FaPlus, FaSearch, FaChartBar, FaBoxOpen, FaSync } from 'react-icons/fa';
import MfcSyncModal from '../components/MfcSyncModal';
import MfcCookiesModal from '../components/MfcCookiesModal';
import CollectionStatusTabs from '../components/CollectionStatusTabs';
import { useQuery, useQueryClient } from 'react-query';
import { getFigures, getFigureStats } from '../api';
import FigureCard from '../components/FigureCard';
import SearchBar from '../components/SearchBar';
import { useNavigate } from 'react-router-dom';
import { CollectionStatus } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const cardBg = useColorModeValue('white', 'gray.800');
  const { open: isSyncOpen, onOpen: onSyncOpen, onClose: onSyncClose } = useDisclosure();
  const { open: isCookiesOpen, onOpen: onCookiesOpen, onClose: onCookiesClose } = useDisclosure();

  // Collection status state - controls which slice of data is shown
  const [activeStatus, setActiveStatus] = useState<CollectionStatus>('owned');

  // Fetch stats with status filter - also provides status counts for tabs
  const { data: statsData, isLoading: isStatsLoading } = useQuery(
    ['dashboardStats', activeStatus],
    () => getFigureStats(activeStatus)
  ) || {};

  // Fetch recent figures filtered by active status
  const { data: figuresData } = useQuery(
    ['recentFigures', activeStatus],
    () => getFigures(1, 12, 'createdAt', 'desc', activeStatus)
  ) || {};

  const handleSyncComplete = () => {
    // Refresh dashboard data after sync
    queryClient.invalidateQueries(['recentFigures']);
    queryClient.invalidateQueries(['dashboardStats']);
  };
  
  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  // Default status counts if data hasn't loaded yet
  const statusCounts = statsData?.statusCounts || { owned: 0, ordered: 0, wished: 0 };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Dashboard</Heading>
        <HStack gap={3}>
          <Button colorPalette="brand" size="sm" asChild><RouterLink to="/figures/add"><FaPlus />Add Item
                                    </RouterLink></Button>
          <Button colorPalette="purple" variant="outline" size="sm" onClick={onSyncOpen}><FaSync />Sync with MFC
                      </Button>
        </HStack>
      </Flex>
      {/* Collection Status Tabs - filter by Owned/Ordered/Wished */}
      <CollectionStatusTabs
        activeStatus={activeStatus}
        statusCounts={statusCounts}
        onStatusChange={setActiveStatus}
        isLoading={isStatsLoading}
      />
      <Box mb={8}>
        <SearchBar onSearch={handleSearch} placeholder="Search your entire collection..." />
      </Box>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={5} mb={8}>
        <Stat.Root
          bg={cardBg}
          p={5}
          shadow="sm"
          borderRadius="lg"
          borderLeft="4px solid"
          borderLeftColor="brand.500"
        >
          <Stat.Label>Total Figures</Stat.Label>
          <Flex align="center" mt={2}>
            <Icon color="brand.500" boxSize={6} mr={2} asChild><FaCube /></Icon>
            <Stat.ValueText>{statsData?.totalCount || 0}</Stat.ValueText>
          </Flex>
          <Stat.HelpText>In your collection</Stat.HelpText>
        </Stat.Root>
        
        <Stat.Root
          bg={cardBg}
          p={5}
          shadow="sm"
          borderRadius="lg"
          borderLeft="4px solid"
          borderLeftColor="purple.500"
        >
          <Stat.Label>Manufacturers</Stat.Label>
          <Flex align="center" mt={2}>
            <Icon color="purple.500" boxSize={6} mr={2} asChild><FaBoxOpen /></Icon>
            <Stat.ValueText>{statsData?.manufacturerStats.length || 0}</Stat.ValueText>
          </Flex>
          <Stat.HelpText>Different brands</Stat.HelpText>
        </Stat.Root>
        
        <Stat.Root
          bg={cardBg}
          p={5}
          shadow="sm"
          borderRadius="lg"
          borderLeft="4px solid"
          borderLeftColor="green.500"
        >
          <Stat.Label>Scales</Stat.Label>
          <Flex align="center" mt={2}>
            <Icon color="green.500" boxSize={6} mr={2} asChild><FaChartBar /></Icon>
            <Stat.ValueText>{statsData?.scaleStats.length || 0}</Stat.ValueText>
          </Flex>
          <Stat.HelpText>Different sizes</Stat.HelpText>
        </Stat.Root>
        
        <Stat.Root
          bg={cardBg}
          p={5}
          shadow="sm"
          borderRadius="lg"
          borderLeft="4px solid"
          borderLeftColor="orange.500"
        >
          <Stat.Label>Origins</Stat.Label>
          <Flex align="center" mt={2}>
            <Icon color="orange.500" boxSize={6} mr={2} asChild><FaSearch /></Icon>
            <Stat.ValueText>{statsData?.originStats?.length || 0}</Stat.ValueText>
          </Flex>
          <Stat.HelpText>Series/Franchises</Stat.HelpText>
        </Stat.Root>
      </SimpleGrid>
      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
        <GridItem>
          <Box bg={cardBg} p={5} shadow="sm" borderRadius="lg">
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md">Recent Figures</Heading>
              <Button variant="outline" size="sm" aria-label="View All Items" asChild><RouterLink to="/figures">View All
                              </RouterLink></Button>
            </Flex>
            
            <Separator mb={4} />
            
            {figuresData?.data.length === 0 ? (
              <Flex direction="column" align="center" justify="center" py={8}>
                <Text color="gray.500" mb={4}>You haven't added any figures yet.</Text>
                <Button colorPalette="brand" asChild><RouterLink to="/figures/add"><FaPlus />Add Your First Figure
                                                      </RouterLink></Button>
              </Flex>
            ) : (
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4}>
                {figuresData?.data.map((figure) => (
                  <FigureCard key={figure._id} figure={figure} />
                ))}
              </SimpleGrid>
            )}
          </Box>
        </GridItem>
        
        <GridItem>
          <Box bg={cardBg} p={5} shadow="sm" borderRadius="lg" height="100%">
            <Heading size="md" mb={4}>Top Manufacturers</Heading>
            <Separator mb={4} />
            
            {!statsData?.manufacturerStats.length ? (
              <Text color="gray.500" textAlign="center" py={8}>
                No manufacturer data available.
              </Text>
            ) : (
              <Box>
                {statsData.manufacturerStats.slice(0, 5).map((stat) => (
                  <Flex key={stat._id} justify="space-between" py={2}>
                    <Text>{stat._id}</Text>
                    <Text fontWeight="bold">{stat.count}</Text>
                  </Flex>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  width="100%"
                  mt={4}
                  aria-label="View Detailed Figure Statistics"
                  asChild><RouterLink to="/statistics">View All Statistics
                                  </RouterLink></Button>
              </Box>
            )}
          </Box>
        </GridItem>
      </Grid>
      <MfcSyncModal
        isOpen={isSyncOpen}
        onClose={onSyncClose}
        onSyncComplete={handleSyncComplete}
        onOpenCookiesModal={onCookiesOpen}
      />
      <MfcCookiesModal
        isOpen={isCookiesOpen}
        onClose={onCookiesClose}
        onCookiesChanged={() => {}}
      />
    </Box>
  );
};

export default Dashboard;
