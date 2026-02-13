import React from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  SimpleGrid,
  Spinner,
  Center,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Divider,
  useColorModeValue,
  Text,
} from '@chakra-ui/react';
import { FaDownload } from 'react-icons/fa';
import { getFigureStats } from '../api';

const Statistics: React.FC = () => {
  const navigate = useNavigate();
  const cardBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.600', 'gray.300');
  const helpTextColor = useColorModeValue('gray.500', 'gray.400');
  const headingColor = useColorModeValue('gray.700', 'gray.100');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');
  const { data: stats, isLoading, error } = useQuery('figureStats', () => getFigureStats()) || { data: null, isLoading: false, error: null };

  const handleRowClick = (filterType: 'manufacturer' | 'scale' | 'location', value: string) => {
    if (!value) return;
    const searchParams = new URLSearchParams();
    searchParams.set(filterType, value);
    navigate(`/figures?${searchParams.toString()}`);
  };

  const downloadCsv = () => {
    if (!stats) return;
    
    // Prepare CSV content
    const headers = ["Category", "Value", "Count"];
    const rows = [
      ...stats.manufacturerStats.map((s) => ["Manufacturer", s._id, s.count]),
      ...stats.scaleStats.map((s) => ["Scale", s._id, s.count]),
      ...stats.locationStats.map((s) => ["Location", s._id, s.count]),
    ];
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'figure_statistics.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <Center h="50vh">
        <Spinner size="xl" color="brand.500" thickness="4px" />
      </Center>
    );
  }

  if (error || !stats) {
    return (
      <Box textAlign="center" py={10}>
        <Heading size="md" color="red.500">
          Error loading statistics
        </Heading>
        <Text mt={4}>Please try again later</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Collection Statistics</Heading>
        <IconButton
          aria-label="Download statistics as CSV"
          icon={<FaDownload />}
          onClick={downloadCsv}
          colorScheme="brand"
          variant="outline"
        />
      </Flex>
      
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={10}>
        <Stat
          bg={cardBg}
          p={6}
          shadow="sm"
          borderRadius="lg"
          textAlign="center"
        >
          <StatLabel fontSize="lg" color={labelColor}>Total Figures</StatLabel>
          <StatNumber fontSize="5xl" fontWeight="bold" color="brand.500">
            {stats.totalCount}
          </StatNumber>
          <StatHelpText color={helpTextColor}>In your collection</StatHelpText>
        </Stat>

        <Stat
          bg={cardBg}
          p={6}
          shadow="sm"
          borderRadius="lg"
          textAlign="center"
        >
          <StatLabel fontSize="lg" color={labelColor}>Manufacturers</StatLabel>
          <StatNumber fontSize="5xl" fontWeight="bold" color="purple.500">
            {stats.manufacturerStats.length}
          </StatNumber>
          <StatHelpText color={helpTextColor}>Different brands</StatHelpText>
        </Stat>

        <Stat
          bg={cardBg}
          p={6}
          shadow="sm"
          borderRadius="lg"
          textAlign="center"
        >
          <StatLabel fontSize="lg" color={labelColor}>Scales</StatLabel>
          <StatNumber fontSize="5xl" fontWeight="bold" color="green.500">
            {stats.scaleStats.length}
          </StatNumber>
          <StatHelpText color={helpTextColor}>Different sizes</StatHelpText>
        </Stat>
      </SimpleGrid>
      
      {/* Stacked layout for tables - full width for better readability */}
      <Box display="flex" flexDirection="column" gap={6}>
        <Box bg={cardBg} p={6} shadow="sm" borderRadius="lg">
          <Heading size="md" mb={4} color={headingColor}>Manufacturers</Heading>
          <Divider mb={4} />

          <TableContainer maxH="350px" overflowY="auto">
            <Table variant="simple" size="sm">
              <Thead position="sticky" top={0} bg={cardBg} zIndex={1}>
                <Tr>
                  <Th>Manufacturer</Th>
                  <Th isNumeric>Count</Th>
                  <Th isNumeric>%</Th>
                </Tr>
              </Thead>
              <Tbody>
                {stats.manufacturerStats.map((stat) => (
                  <Tr
                    key={stat._id}
                    onClick={() => stat._id && handleRowClick('manufacturer', stat._id)}
                    cursor={stat._id ? 'pointer' : 'default'}
                    _hover={{ bg: stat._id ? rowHoverBg : undefined }}
                    transition="background-color 0.2s"
                    role="button"
                    tabIndex={stat._id ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && stat._id) {
                        handleRowClick('manufacturer', stat._id);
                      }
                    }}
                  >
                    <Td>{stat._id || 'Unknown'}</Td>
                    <Td isNumeric fontWeight="medium">{stat.count}</Td>
                    <Td isNumeric color="gray.500">
                      {((stat.count / stats.totalCount) * 100).toFixed(1)}%
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>

        <Box bg={cardBg} p={6} shadow="sm" borderRadius="lg">
          <Heading size="md" mb={4} color={headingColor}>Scales</Heading>
          <Divider mb={4} />

          <TableContainer maxH="350px" overflowY="auto">
            <Table variant="simple" size="sm">
              <Thead position="sticky" top={0} bg={cardBg} zIndex={1}>
                <Tr>
                  <Th>Scale</Th>
                  <Th isNumeric>Count</Th>
                  <Th isNumeric>%</Th>
                </Tr>
              </Thead>
              <Tbody>
                {stats.scaleStats.map((stat) => (
                  <Tr
                    key={stat._id}
                    onClick={() => stat._id && handleRowClick('scale', stat._id)}
                    cursor={stat._id ? 'pointer' : 'default'}
                    _hover={{ bg: stat._id ? rowHoverBg : undefined }}
                    transition="background-color 0.2s"
                    role="button"
                    tabIndex={stat._id ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && stat._id) {
                        handleRowClick('scale', stat._id);
                      }
                    }}
                  >
                    <Td>{stat._id || 'Unknown'}</Td>
                    <Td isNumeric fontWeight="medium">{stat.count}</Td>
                    <Td isNumeric color="gray.500">
                      {((stat.count / stats.totalCount) * 100).toFixed(1)}%
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>

        <Box bg={cardBg} p={6} shadow="sm" borderRadius="lg">
          <Heading size="md" mb={4} color={headingColor}>Storage Locations</Heading>
          <Divider mb={4} />

          <TableContainer maxH="350px" overflowY="auto">
            <Table variant="simple" size="sm">
              <Thead position="sticky" top={0} bg={cardBg} zIndex={1}>
                <Tr>
                  <Th>Location</Th>
                  <Th isNumeric>Count</Th>
                  <Th isNumeric>%</Th>
                </Tr>
              </Thead>
              <Tbody>
                {stats.locationStats.map((stat) => (
                  <Tr
                    key={stat._id}
                    onClick={() => stat._id && handleRowClick('location', stat._id)}
                    cursor={stat._id ? 'pointer' : 'default'}
                    _hover={{ bg: stat._id ? rowHoverBg : undefined }}
                    transition="background-color 0.2s"
                    role="button"
                    tabIndex={stat._id ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && stat._id) {
                        handleRowClick('location', stat._id);
                      }
                    }}
                  >
                    <Td>{stat._id || 'Unknown'}</Td>
                    <Td isNumeric fontWeight="medium">{stat.count}</Td>
                    <Td isNumeric color="gray.500">
                      {((stat.count / stats.totalCount) * 100).toFixed(1)}%
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Box>
  );
};

export default Statistics;
