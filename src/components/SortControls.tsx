import React from 'react';
import {
  HStack,
  Select,
  FormControl,
  FormLabel,
  IconButton,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';

export type SortField = 'createdAt' | 'name' | 'manufacturer' | 'scale' | 'price';
export type SortDirection = 'asc' | 'desc';

export interface SortParams {
  sortBy: SortField;
  sortOrder: SortDirection;
}

interface SortControlsProps {
  sortBy: SortField;
  sortOrder: SortDirection;
  onSortChange: (params: SortParams) => void;
}

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'createdAt', label: 'Date Added' },
  { value: 'name', label: 'Name' },
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'scale', label: 'Scale' },
  { value: 'price', label: 'Price' },
];

const SortControls: React.FC<SortControlsProps> = ({
  sortBy,
  sortOrder,
  onSortChange,
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('white', 'gray.700');

  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortBy = e.target.value as SortField;
    onSortChange({ sortBy: newSortBy, sortOrder });
  };

  const handleDirectionToggle = () => {
    const newSortOrder: SortDirection = sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange({ sortBy, sortOrder: newSortOrder });
  };

  return (
    <HStack spacing={2} data-testid="sort-controls">
      <FormControl w="auto">
        <FormLabel htmlFor="sort-by" srOnly>
          Sort by
        </FormLabel>
        <Select
          id="sort-by"
          value={sortBy}
          onChange={handleFieldChange}
          size="sm"
          borderColor={borderColor}
          bg={bgColor}
          aria-label="Sort by field"
          data-testid="sort-field-select"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </FormControl>

      <Tooltip
        label={sortOrder === 'asc' ? 'Ascending (click for descending)' : 'Descending (click for ascending)'}
        placement="top"
      >
        <IconButton
          aria-label={`Sort ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
          icon={sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
          size="sm"
          variant="outline"
          onClick={handleDirectionToggle}
          borderColor={borderColor}
          data-testid="sort-direction-button"
        />
      </Tooltip>
    </HStack>
  );
};

export default SortControls;
