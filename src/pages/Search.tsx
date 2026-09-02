import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useQuery } from 'react-query';
import { Box, Heading, SimpleGrid, Spinner, Center, Text, Flex } from '@chakra-ui/react';
import { toaster } from '../components/ui/toaster';
import { searchFigures } from '../api';
import SearchBar from '../components/SearchBar';
import FigureCard from '../components/FigureCard';
import EmptyState from '../components/EmptyState';

const Search: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialSearchQuery = queryParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  
  const { data: searchResults, isLoading, error } = useQuery(
    ['search', searchQuery],
    () => searchFigures(searchQuery),
    {
      enabled: !!searchQuery,
      onError: (err: any) => {
        toaster.create({
          title: 'Error',
          description: err.response?.data?.message || 'Search failed',
          type: 'error',
          duration: 5000,
          closable: true,
        });
      },
    }
  ) || { data: null, isLoading: false, error: null };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };
  
  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  return (
    <Box>
      <Heading size="lg" mb={6}>Search Your Collection</Heading>
      <Box mb={6}>
        <SearchBar onSearch={handleSearch} placeholder="Search by name, manufacturer, origin..." />
      </Box>
      {searchQuery && (
        <Text mb={4} fontSize="lg" fontWeight="medium">
          Search results for: <Text as="span" color="brand.600">"{searchQuery}"</Text>
        </Text>
      )}
      {isLoading ? (
        <Center h="200px">
          <Spinner size="xl" color="brand.500" borderWidth="4px" />
        </Center>
      ) : error ? (
        <Flex justify="center" p={8}>
          <Text color="red.500">Error loading search results. Please try again.</Text>
        </Flex>
      ) : searchResults?.length === 0 ? (
        searchQuery ? (
          <EmptyState 
            type="search" 
            message={`No figures found matching "${searchQuery}". Try a different search term.`}
          />
        ) : (
          <Box textAlign="center" p={10}>
            <Text color="gray.600" fontSize="lg">
              Enter a search term to find figures in your collection.
            </Text>
          </Box>
        )
      ) : (
        <>
          <Text mb={4} color="gray.600">
            Found {searchResults?.length} {searchResults?.length === 1 ? 'figure' : 'figures'}
          </Text>
          
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={6}>
            {searchResults?.map((figure) => (
              <FigureCard
                key={figure.id}
                figure={{
                  _id: figure.id,
                  manufacturer: figure.manufacturer,
                  name: figure.name,
                  scale: figure.scale,
                  mfcLink: figure.mfcLink,
                  origin: figure.origin,
                  category: figure.category,
                  imageUrl: figure.imageUrl,
                  userId: '',
                  createdAt: '',
                  updatedAt: '',
                }}
                searchQuery={searchQuery}
              />
            ))}
          </SimpleGrid>
        </>
      )}
    </Box>
  );
};

export default Search;
