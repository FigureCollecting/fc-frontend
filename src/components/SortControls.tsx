import React from 'react';
import { useColorModeValue } from "./ui/color-mode";
import { Steps, HStack, NativeSelect, IconButton, Field } from '@chakra-ui/react';
import { Tooltip } from '@/components/ui/tooltip';
import { FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';

export type SortField = 'activity' | 'createdAt' | 'updatedAt' | 'name';
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
  { value: 'activity', label: 'Collection Order' },
  { value: 'createdAt', label: 'Date Added' },
  { value: 'updatedAt', label: 'Last Updated' },
  { value: 'name', label: 'Name' },
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
    <HStack gap={2} data-testid="sort-controls">
      <Field.Root w="auto">
        <Field.Label htmlFor="sort-by" srOnly>
          Sort by
        </Field.Label>
        <NativeSelect.Root>
          <NativeSelect.Field
            id="sort-by"
            value={sortBy}
            onValueChange={handleFieldChange}
            size="sm"
            borderColor={borderColor}
            bg={bgColor}
            aria-label="Sort by field"
            data-testid="sort-field-select">
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Field.Root>
      <Tooltip
        content={sortOrder === 'asc' ? 'Ascending (click for descending)' : 'Descending (click for ascending)'}
        positioning={{
          placement: "top"
        }}
      >
        <IconButton
          aria-label={`Sort ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
          size="sm"
          variant="outline"
          onClick={handleDirectionToggle}
          borderColor={borderColor}
          data-testid="sort-direction-button">{sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}</IconButton>
      </Tooltip>
    </HStack>
  );
};

export default SortControls;
