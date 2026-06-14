import React from 'react';
import { useColorModeValue } from "./ui/color-mode";
import {
  Steps,
  Box,
  Heading,
  Flex,
  Table,
  Badge,
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
          <Badge colorPalette="gray" borderRadius="full">0</Badge>
        </Flex>
        <Text color="gray.500" fontStyle="italic">No data yet</Text>
      </Box>
    );
  }

  return (
    <Box bg={cardBg} p={6} shadow="sm" borderRadius="lg">
      <Flex align="center" gap={2} mb={4}>
        <Heading size="md" color={headingColor}>{title}</Heading>
        <Badge colorPalette="brand" borderRadius="full">{data.length}</Badge>
      </Flex>
      <Table.ScrollArea maxH="400px" overflowY="auto">
        <Table.Root variant="line" size="sm">
          <Table.Header position="sticky" top={0} bg={cardBg} zIndex={1}>
            <Table.Row>
              <Table.ColumnHeader>Name</Table.ColumnHeader>
              <Table.ColumnHeader textAlign='end'>Count</Table.ColumnHeader>
              <Table.ColumnHeader textAlign='end'>%</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.map((stat, index) => {
              const displayName = getDisplayName(stat._id);
              const clickValue = getClickValue(stat._id);
              return (
                <Table.Row
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
                  <Table.Cell fontStyle={stat._id ? 'normal' : 'italic'} color={stat._id ? undefined : 'gray.500'}>
                    {displayName}
                  </Table.Cell>
                  <Table.Cell fontWeight="medium" textAlign='end'>{stat.count}</Table.Cell>
                  <Table.Cell color="gray.500" textAlign='end'>
                    {totalCount > 0 ? ((stat.count / totalCount) * 100).toFixed(1) : '0.0'}%
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Box>
  );
};

export default StatTable;
