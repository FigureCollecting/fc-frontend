import React, { useState, useCallback, useMemo } from 'react';
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
  useColorModeValue,
  Text,
} from '@chakra-ui/react';
import { FaDownload } from 'react-icons/fa';
import { getFigureStats } from '../api';
import { CollectionStatus } from '../types';
import { mergeManufacturerStats, StatEntry } from '../utils/statsUtils';
import CollectionStatusTabs from '../components/CollectionStatusTabs';
import StatTable from '../components/StatTable';

const Statistics: React.FC = () => {
  const navigate = useNavigate();
  const cardBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.600', 'gray.300');
  const helpTextColor = useColorModeValue('gray.500', 'gray.400');

  const [activeStatus, setActiveStatus] = useState<CollectionStatus>('owned');

  // Scoped stats for the active status tab
  const {
    data: stats,
    isLoading: isLoadingScoped,
    error: scopedError,
  } = useQuery(
    ['figureStats', activeStatus],
    () => getFigureStats(activeStatus),
    { keepPreviousData: true }
  );

  // Unscoped stats for tab badge counts
  const { data: allStats, isLoading: isLoadingAll } = useQuery(
    'figureStatsAll',
    () => getFigureStats(),
    { staleTime: 30000 }
  );

  const statusCounts = useMemo(() => {
    const counts = allStats?.statusCounts ?? stats?.statusCounts;
    return counts ?? { owned: 0, ordered: 0, wished: 0 };
  }, [allStats?.statusCounts, stats?.statusCounts]);

  const mergedManufacturers = useMemo(() => {
    if (!stats) return [];
    return mergeManufacturerStats(stats.manufacturerStats, stats.v3ManufacturerStats);
  }, [stats]);

  const handleRowClick = useCallback((paramName: string, value: string) => {
    const params = new URLSearchParams();
    params.set(paramName, value);
    params.set('status', activeStatus);
    navigate(`/figures?${params.toString()}`);
  }, [activeStatus, navigate]);

  const downloadCsv = useCallback(() => {
    if (!stats) return;

    const headers = ['Category', 'Value', 'Count'];
    const rows: string[][] = [];

    const addSection = (label: string, entries: StatEntry[]) => {
      for (const e of entries) {
        rows.push([label, e._id || 'Not Specified', String(e.count)]);
      }
    };

    addSection('Manufacturer', mergedManufacturers);
    addSection('Scale', stats.scaleStats);
    addSection('Origin', stats.originStats ?? []);
    addSection('Category', stats.categoryStats ?? []);
    addSection('Distributor', stats.distributorStats ?? []);
    addSection('Sculptor', stats.sculptorStats ?? []);
    addSection('Illustrator', stats.illustratorStats ?? []);
    addSection('Classification', stats.classificationStats ?? []);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `figure_statistics_${activeStatus}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [stats, mergedManufacturers, activeStatus]);

  const isLoading = isLoadingScoped || isLoadingAll;

  if (scopedError) {
    return (
      <Box textAlign="center" py={10}>
        <Heading size="md" color="red.500">Error loading statistics</Heading>
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
          isDisabled={!stats}
        />
      </Flex>

      <CollectionStatusTabs
        activeStatus={activeStatus}
        statusCounts={statusCounts}
        onStatusChange={setActiveStatus}
        isLoading={isLoading}
      />

      {isLoading && !stats ? (
        <Center h="40vh">
          <Spinner size="xl" color="brand.500" thickness="4px" role="status" />
        </Center>
      ) : stats ? (
        <>
          {/* Summary Cards */}
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing={4} mb={8}>
            <Stat bg={cardBg} p={4} shadow="sm" borderRadius="lg" textAlign="center">
              <StatLabel color={labelColor}>Total Figures</StatLabel>
              <StatNumber fontSize="3xl" color="brand.500">{stats.totalCount}</StatNumber>
              <StatHelpText color={helpTextColor}>{activeStatus}</StatHelpText>
            </Stat>
            <Stat bg={cardBg} p={4} shadow="sm" borderRadius="lg" textAlign="center">
              <StatLabel color={labelColor}>Manufacturers</StatLabel>
              <StatNumber fontSize="3xl" color="purple.500">{mergedManufacturers.length}</StatNumber>
              <StatHelpText color={helpTextColor}>brands</StatHelpText>
            </Stat>
            <Stat bg={cardBg} p={4} shadow="sm" borderRadius="lg" textAlign="center">
              <StatLabel color={labelColor}>Scales</StatLabel>
              <StatNumber fontSize="3xl" color="green.500">{stats.scaleStats.length}</StatNumber>
              <StatHelpText color={helpTextColor}>sizes</StatHelpText>
            </Stat>
            <Stat bg={cardBg} p={4} shadow="sm" borderRadius="lg" textAlign="center">
              <StatLabel color={labelColor}>Origins</StatLabel>
              <StatNumber fontSize="3xl" color="blue.500">{(stats.originStats ?? []).length}</StatNumber>
              <StatHelpText color={helpTextColor}>series</StatHelpText>
            </Stat>
            <Stat bg={cardBg} p={4} shadow="sm" borderRadius="lg" textAlign="center">
              <StatLabel color={labelColor}>Categories</StatLabel>
              <StatNumber fontSize="3xl" color="orange.500">{(stats.categoryStats ?? []).length}</StatNumber>
              <StatHelpText color={helpTextColor}>types</StatHelpText>
            </Stat>
          </SimpleGrid>

          {/* Stat Tables */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            <StatTable
              title="Manufacturers"
              data={mergedManufacturers}
              paramName="mfr"
              totalCount={stats.totalCount}
              onRowClick={handleRowClick}
            />
            <StatTable
              title="Scales"
              data={stats.scaleStats}
              paramName="scale"
              totalCount={stats.totalCount}
              onRowClick={handleRowClick}
            />
            <StatTable
              title="Origins"
              data={stats.originStats ?? []}
              paramName="origin"
              totalCount={stats.totalCount}
              onRowClick={handleRowClick}
            />
            <StatTable
              title="Categories"
              data={stats.categoryStats ?? []}
              paramName="cat"
              totalCount={stats.totalCount}
              onRowClick={handleRowClick}
            />
            {(stats.distributorStats ?? []).length > 0 && (
              <StatTable
                title="Distributors"
                data={stats.distributorStats ?? []}
                paramName="dist"
                totalCount={stats.totalCount}
                onRowClick={handleRowClick}
              />
            )}
            {(stats.sculptorStats ?? []).length > 0 && (
              <StatTable
                title="Sculptors"
                data={stats.sculptorStats ?? []}
                paramName="scl"
                totalCount={stats.totalCount}
                onRowClick={handleRowClick}
              />
            )}
            {(stats.illustratorStats ?? []).length > 0 && (
              <StatTable
                title="Illustrators"
                data={stats.illustratorStats ?? []}
                paramName="ill"
                totalCount={stats.totalCount}
                onRowClick={handleRowClick}
              />
            )}
            {(stats.classificationStats ?? []).length > 0 && (
              <StatTable
                title="Classifications"
                data={stats.classificationStats ?? []}
                paramName="cls"
                totalCount={stats.totalCount}
                onRowClick={handleRowClick}
              />
            )}
          </SimpleGrid>
        </>
      ) : null}
    </Box>
  );
};

export default Statistics;
