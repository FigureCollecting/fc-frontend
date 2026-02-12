import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Button,
  Flex,
  Text,
  Divider,
  Grid,
  GridItem,
  useColorModeValue,
  useDisclosure,
  HStack,
} from '@chakra-ui/react';
import { FaCube, FaPlus, FaSearch, FaChartBar, FaBoxOpen, FaSync } from 'react-icons/fa';
import MfcSyncModal from '../components/MfcSyncModal';
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
  const { isOpen: isSyncOpen, onOpen: onSyncOpen, onClose: onSyncClose } = useDisclosure();

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
        <HStack spacing={3}>
          <Button
            as={RouterLink}
            to="/figures/add"
            leftIcon={<FaPlus />}
            colorScheme="brand"
            size="sm"
          >
            Add Item
          </Button>
          <Button
            leftIcon={<FaSync />}
            colorScheme="purple"
            variant="outline"
            size="sm"
            onClick={onSyncOpen}
          >
            Sync with MFC
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
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5} mb={8}>
        <Stat
          bg={cardBg}
          p={5}
          shadow="sm"
          borderRadius="lg"
          borderLeft="4px solid"
          borderLeftColor="brand.500"
        >
          <StatLabel>Total Figures</StatLabel>
          <Flex align="center" mt={2}>
            <Icon as={FaCube} color="brand.500" boxSize={6} mr={2} />
            <StatNumber>{statsData?.totalCount || 0}</StatNumber>
          </Flex>
          <StatHelpText>In your collection</StatHelpText>
        </Stat>
        
        <Stat
          bg={cardBg}
          p={5}
          shadow="sm"
          borderRadius="lg"
          borderLeft="4px solid"
          borderLeftColor="purple.500"
        >
          <StatLabel>Manufacturers</StatLabel>
          <Flex align="center" mt={2}>
            <Icon as={FaBoxOpen} color="purple.500" boxSize={6} mr={2} />
            <StatNumber>{statsData?.manufacturerStats.length || 0}</StatNumber>
          </Flex>
          <StatHelpText>Different brands</StatHelpText>
        </Stat>
        
        <Stat
          bg={cardBg}
          p={5}
          shadow="sm"
          borderRadius="lg"
          borderLeft="4px solid"
          borderLeftColor="green.500"
        >
          <StatLabel>Scales</StatLabel>
          <Flex align="center" mt={2}>
            <Icon as={FaChartBar} color="green.500" boxSize={6} mr={2} />
            <StatNumber>{statsData?.scaleStats.length || 0}</StatNumber>
          </Flex>
          <StatHelpText>Different sizes</StatHelpText>
        </Stat>
        
        <Stat
          bg={cardBg}
          p={5}
          shadow="sm"
          borderRadius="lg"
          borderLeft="4px solid"
          borderLeftColor="orange.500"
        >
          <StatLabel>Locations</StatLabel>
          <Flex align="center" mt={2}>
            <Icon as={FaSearch} color="orange.500" boxSize={6} mr={2} />
            <StatNumber>{statsData?.locationStats.length || 0}</StatNumber>
          </Flex>
          <StatHelpText>Storage areas</StatHelpText>
        </Stat>
      </SimpleGrid>
      
      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
        <GridItem>
          <Box bg={cardBg} p={5} shadow="sm" borderRadius="lg">
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md">Recent Figures</Heading>
              <Button 
                as={RouterLink} 
                to="/figures" 
                variant="outline" 
                size="sm"
                aria-label="View All Items"
              >
                View All
              </Button>
            </Flex>
            
            <Divider mb={4} />
            
            {figuresData?.data.length === 0 ? (
              <Flex direction="column" align="center" justify="center" py={8}>
                <Text color="gray.500" mb={4}>You haven't added any figures yet.</Text>
                <Button 
                  as={RouterLink} 
                  to="/figures/add" 
                  leftIcon={<FaPlus />} 
                  colorScheme="brand"
                >
                  Add Your First Figure
                </Button>
              </Flex>
            ) : (
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
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
            <Divider mb={4} />
            
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
                  as={RouterLink} 
                  to="/statistics" 
                  variant="outline" 
                  size="sm" 
                  width="100%" 
                  mt={4}
                  aria-label="View Detailed Figure Statistics"
                >
                  View All Statistics
                </Button>
              </Box>
            )}
          </Box>
        </GridItem>
      </Grid>

      <MfcSyncModal
        isOpen={isSyncOpen}
        onClose={onSyncClose}
        onSyncComplete={handleSyncComplete}
      />
    </Box>
  );
};

export default Dashboard;
