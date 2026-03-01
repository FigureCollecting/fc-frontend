import React from 'react';
import {
  Box,
  Heading,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  useColorModeValue,
  Text,
} from '@chakra-ui/react';
import { StatEntry } from '../utils/statsUtils';

export interface StatTableProps {
  title: string;
  data: StatEntry[];
  paramName: string;
  totalCount: number;
  onRowClick: (paramName: string, value: string) => void;
}

const getDisplayName = (id: string | null | undefined): string => {
  if (id == null || id === '') return 'Not Specified';
  return id;
};

const getClickValue = (id: string | null | undefined): string => {
  if (id == null || id === '') return '__unspecified__';
  return id;
};

const StatTable: React.FC<StatTableProps> = ({
  title,
  data,
  paramName,
  totalCount,
  onRowClick,
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const headingColor = useColorModeValue('gray.700', 'gray.100');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');

  if (data.length === 0) {
    return (
      <Box bg={cardBg} p={6} shadow="sm" borderRadius="lg">
        <Flex align="center" gap={2} mb={4}>
          <Heading size="md" color={headingColor}>{title}</Heading>
          <Badge colorScheme="gray" borderRadius="full">0</Badge>
        </Flex>
        <Text color="gray.500" fontStyle="italic">No data yet</Text>
      </Box>
    );
  }

  return (
    <Box bg={cardBg} p={6} shadow="sm" borderRadius="lg">
      <Flex align="center" gap={2} mb={4}>
        <Heading size="md" color={headingColor}>{title}</Heading>
        <Badge colorScheme="brand" borderRadius="full">{data.length}</Badge>
      </Flex>
      <TableContainer maxH="400px" overflowY="auto">
        <Table variant="simple" size="sm">
          <Thead position="sticky" top={0} bg={cardBg} zIndex={1}>
            <Tr>
              <Th>Name</Th>
              <Th isNumeric>Count</Th>
              <Th isNumeric>%</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.map((stat, index) => {
              const displayName = getDisplayName(stat._id);
              const clickValue = getClickValue(stat._id);
              return (
                <Tr
                  key={stat._id || `unspecified-${index}`}
                  onClick={() => onRowClick(paramName, clickValue)}
                  cursor="pointer"
                  _hover={{ bg: rowHoverBg }}
                  transition="background-color 0.2s"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onRowClick(paramName, clickValue);
                    }
                  }}
                >
                  <Td fontStyle={stat._id ? 'normal' : 'italic'} color={stat._id ? undefined : 'gray.500'}>
                    {displayName}
                  </Td>
                  <Td isNumeric fontWeight="medium">{stat.count}</Td>
                  <Td isNumeric color="gray.500">
                    {totalCount > 0 ? ((stat.count / totalCount) * 100).toFixed(1) : '0.0'}%
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default StatTable;
