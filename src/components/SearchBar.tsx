import React, { useState, useEffect, useRef } from 'react';
import { useColorModeValue } from "./ui/color-mode";
import { useNavigate } from 'react-router-dom';
import {
  Steps,
  InputGroup,
  Input,
  InputRightElement,
  IconButton,
  Box,
  VStack,
  Text,
  Spinner,
  Portal,
} from '@chakra-ui/react';
import { FaSearch } from 'react-icons/fa';
import { useQuery } from 'react-query';
import { searchFigures } from '../api';

// Helper component to highlight matching text in autocomplete suggestions
const HighlightMatch: React.FC<{ text: string; query: string; highlightColor: string }> = ({
  text,
  query,
  highlightColor
}) => {
  if (!query || !text) return <>{text}</>;

  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  if (terms.length === 0) return <>{text}</>;

  // Build a regex that matches any of the search terms (case-insensitive)
  const escapedTerms = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');

  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = terms.some(term => part.toLowerCase() === term);
        return isMatch ? (
          <Box
            display="inline"
            px={0.5}
            borderRadius="sm"
            css={{
              background: `${highlightColor} !important`,
              color: 'inherit'
            }}
            asChild><mark key={index}>
              {part}
            </mark></Box>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        );
      })}
    </>
  );
};

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search your figures...'
}) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const inputBg = useColorModeValue('white', 'gray.800');
  const dropdownBg = useColorModeValue('white', 'gray.700');
  const hoverBg = useColorModeValue('gray.100', 'gray.600');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const highlightColor = useColorModeValue('var(--chakra-colors-yellow-200)', 'var(--chakra-colors-yellow-600)');

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch suggestions based on debounced query
  const { data: suggestions, isLoading } = useQuery(
    ['searchSuggestions', debouncedQuery],
    () => searchFigures(debouncedQuery),
    {
      enabled: debouncedQuery.length >= 3, // Match backend Atlas Search minGrams: 3
      staleTime: 30000, // Cache for 30 seconds
    }
  );

  // Show dropdown when we have results or loading
  useEffect(() => {
    if (query.length >= 3 && (isLoading || (suggestions && suggestions.length > 0))) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [query, suggestions, isLoading]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      onSearch(query.trim());
    }
  };

  const handleSuggestionClick = (figureId: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/figures/${figureId}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <Box position="relative" width="100%">
      <Box width="100%" asChild><form onSubmit={handleSubmit}>
          <InputGroup size="lg">
            <Input
              ref={inputRef}
              type="search"
              role="combobox"
              aria-label="Search your figures"
              aria-expanded={isOpen}
              aria-autocomplete="list"
              aria-controls="search-suggestions"
              placeholder={placeholder}
              value={query}
              onValueChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (query.length >= 3 && suggestions && suggestions.length > 0) {
                  setIsOpen(true);
                }
              }}
              bg={inputBg}
              boxShadow="sm"
              borderRadius="lg"
            />
            <InputRightElement>
              <IconButton aria-label="Search" size="sm" colorPalette="brand" type="submit"><FaSearch /></IconButton>
            </InputRightElement>
          </InputGroup>
        </form></Box>
      {/* Suggestions Dropdown */}
      {isOpen && (
        <Portal>
          <Box
            ref={dropdownRef}
            id="search-suggestions"
            role="listbox"
            position="fixed"
            top={inputRef.current ? inputRef.current.getBoundingClientRect().bottom + 4 : 0}
            left={inputRef.current ? inputRef.current.getBoundingClientRect().left : 0}
            width={inputRef.current ? inputRef.current.getBoundingClientRect().width : '100%'}
            bg={dropdownBg}
            borderRadius="md"
            boxShadow="lg"
            border="1px"
            borderColor={borderColor}
            maxH="300px"
            overflowY="auto"
            zIndex={1500}
          >
            {isLoading ? (
              <Box p={4} textAlign="center">
                <Spinner size="sm" mr={2} />
                <Text as="span" fontSize="sm" color="gray.500">
                  Searching...
                </Text>
              </Box>
            ) : suggestions && suggestions.length > 0 ? (
              <VStack align="stretch" gap={0} py={1}>
                {suggestions.slice(0, 8).map((result) => (
                  <Box
                    key={result.id}
                    role="option"
                    px={4}
                    py={2}
                    cursor="pointer"
                    _hover={{ bg: hoverBg }}
                    onClick={() => handleSuggestionClick(result.id)}
                  >
                    <Text fontWeight="medium" fontSize="sm" lineClamp={1}>
                      <HighlightMatch text={result.name} query={query} highlightColor={highlightColor} />
                    </Text>
                    <Text fontSize="xs" color="gray.500" lineClamp={1}>
                      <HighlightMatch text={result.manufacturer || ''} query={query} highlightColor={highlightColor} /> • <HighlightMatch text={result.scale || ''} query={query} highlightColor={highlightColor} />
                      {result.searchScore !== undefined && <Text as="span" color="gray.400" ml={2}>({result.searchScore.toFixed(2)})</Text>}
                    </Text>
                  </Box>
                ))}
                {suggestions.length > 8 && (
                  <Box px={4} py={2} borderTop="1px" borderColor={borderColor}>
                    <Text
                      fontSize="xs"
                      color="brand.500"
                      cursor="pointer"
                      onClick={() => {
                        setIsOpen(false);
                        onSearch(query);
                      }}
                    >
                      View all {suggestions.length} results →
                    </Text>
                  </Box>
                )}
              </VStack>
            ) : (
              <Box p={4} textAlign="center">
                <Text fontSize="sm" color="gray.500">
                  No figures found
                </Text>
              </Box>
            )}
          </Box>
        </Portal>
      )}
    </Box>
  );
};

export default SearchBar;
