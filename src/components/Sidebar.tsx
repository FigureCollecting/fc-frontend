import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Box, Stack, Link, Text, Icon, Flex } from '@chakra-ui/react';
import { FaHome, FaCube, FaPlus, FaSearch, FaChartBar, FaListUl, FaUser } from 'react-icons/fa';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const MenuItem = ({ icon, children, to }: { icon: React.ElementType; children: React.ReactNode; to: string }) => {
    const active = isActive(to);
    
    return (
      <Link
        display="block"
        p={2}
        borderRadius="md"
        bg={active ? 'brand.50' : 'transparent'}
        color={active ? 'brand.600' : 'gray.700'}
        fontWeight={active ? 'medium' : 'normal'}
        data-active={active}
        _hover={{
          bg: 'brand.50',
          color: 'brand.600',
        }}
        asChild><RouterLink to={to}>
          <Flex align="center">
            <Icon as={icon} mr={3} />
            <Text>{children}</Text>
          </Flex>
        </RouterLink></Link>
    );
  };

  return (
    <Box
      as="aside"
      data-testid="sidebar"
      height="100%"
      borderRight={{ base: 'none', md: '1px solid' }}
      borderColor={{ base: 'transparent', md: 'gray.200' }}
      pr={4}
      py={3}
    >
      <Stack gap={1}>
        <Text fontWeight="bold" fontSize="sm" color="gray.500" mb={2} px={2}>
          MAIN
        </Text>
        <MenuItem icon={FaHome} to="/">
          Dashboard
        </MenuItem>

        <Text fontWeight="bold" fontSize="sm" color="gray.500" mt={6} mb={2} px={2}>
          COLLECTION
        </Text>
        <MenuItem icon={FaCube} to="/figures">
          All Items
        </MenuItem>
        <MenuItem icon={FaPlus} to="/figures/add">
          Add Item
        </MenuItem>
        <MenuItem icon={FaSearch} to="/search">
          Search
        </MenuItem>
        <MenuItem icon={FaChartBar} to="/statistics">
          Statistics
        </MenuItem>
        <MenuItem icon={FaListUl} to="/lists">
          Lists
        </MenuItem>

        <Text fontWeight="bold" fontSize="sm" color="gray.500" mt={6} mb={2} px={2}>
          ACCOUNT
        </Text>
        <MenuItem icon={FaUser} to="/profile">
          Profile
        </MenuItem>
      </Stack>
    </Box>
  );
};

export default Sidebar;
