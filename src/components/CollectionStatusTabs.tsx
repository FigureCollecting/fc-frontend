/**
 * CollectionStatusTabs Component
 *
 * Displays tabs for Owned/Ordered/Wished collection statuses with counts.
 * Acts as the primary view filter for collection data slices.
 */
import React from 'react';
import { useColorModeValue } from "./ui/color-mode";
import { Steps, Tabs, TabList, Tab, Badge, HStack } from '@chakra-ui/react';
import { FaBox, FaTruck, FaStar } from 'react-icons/fa';
import { CollectionStatus, StatusCounts } from '../types';

interface CollectionStatusTabsProps {
  activeStatus: CollectionStatus;
  statusCounts: StatusCounts;
  onStatusChange: (status: CollectionStatus) => void;
  isLoading?: boolean;
}

const statusConfig: Record<CollectionStatus, { label: string; icon: React.ElementType; color: string }> = {
  owned: { label: 'Owned', icon: FaBox, color: 'green' },
  ordered: { label: 'Ordered', icon: FaTruck, color: 'blue' },
  wished: { label: 'Wished', icon: FaStar, color: 'purple' },
};

const CollectionStatusTabs: React.FC<CollectionStatusTabsProps> = ({
  activeStatus,
  statusCounts,
  onStatusChange,
  isLoading = false,
}) => {
  const statuses: CollectionStatus[] = ['owned', 'ordered', 'wished'];
  const activeIndex = statuses.indexOf(activeStatus);

  const tabBg = useColorModeValue('white', 'gray.800');
  const activeBg = useColorModeValue('brand.50', 'brand.900');

  const handleTabChange = (index: number) => {
    onStatusChange(statuses[index]);
  };

  return (
    <Tabs.Root
      value={activeIndex}
      onValueChange={handleTabChange}
      variant='subtle'
      colorPalette="brand"
      mb={4}
    >
      <Tabs.List
        bg={tabBg}
        p={1}
        borderRadius="lg"
        boxShadow="sm"
        gap={2}
      >
        {statuses.map((status) => {
          const config = statusConfig[status];
          const count = statusCounts[status];
          const isActive = status === activeStatus;
          const Icon = config.icon;

          return (
            <Tab
              key={status}
              px={4}
              py={2}
              borderRadius="md"
              fontWeight="medium"
              _selected={{
                bg: activeBg,
                color: 'brand.600',
              }}
              disabled={isLoading}
            >
              <HStack gap={2}>
                <Icon />
                <span>{config.label}</span>
                <Badge
                  colorPalette={isActive ? 'brand' : 'gray'}
                  variant={isActive ? 'solid' : 'subtle'}
                  borderRadius="full"
                  px={2}
                  fontSize="xs"
                >
                  {count}
                </Badge>
              </HStack>
            </Tab>
          );
        })}
      </Tabs.List>
    </Tabs.Root>
  );
};

export default CollectionStatusTabs;
