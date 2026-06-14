/**
 * ReleasesSection Component
 *
 * Manages releases array in the figure form.
 * Each release has: date, price, currency, JAN (barcode), isRerelease flag.
 * Uses react-hook-form's useFieldArray for array management.
 */

import React from 'react';
import { useColorModeValue } from "../ui/color-mode";
import { Box,
  Button,
  Checkbox,
  HStack,
  IconButton,
  Input,
  NativeSelect,
  Text,
  VStack,
  Badge,
  Grid,
  GridItem,
  Field,
} from '@chakra-ui/react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { FigureFormData, IReleaseFormData } from '../../types';

const CURRENCY_OPTIONS = ['JPY', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CNY'];

/**
 * Formats an ISO date string to just the date portion (YYYY-MM-DD or YYYY-MM).
 * Handles full ISO timestamps by extracting just the date part.
 */
const formatDateForInput = (date?: string): string => {
  if (!date) return '';
  // If it's a full ISO string (contains 'T'), extract just the date
  if (date.includes('T')) {
    return date.split('T')[0];
  }
  return date;
};

const ReleasesSection: React.FC = () => {
  const { control, register } = useFormContext<FigureFormData>();

  // Color mode support
  const rowBgColor = useColorModeValue('gray.50', 'gray.700');

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'releases',
  });

  const handleAddRelease = () => {
    append({
      date: '',
      price: undefined,
      currency: 'JPY',
      jan: '',
      isRerelease: false,
      variant: '',
    } as IReleaseFormData);
  };

  return (
    <Box>
      <HStack justify="space-between" mb={3}>
        <Text fontWeight="semibold" fontSize="md">
          Releases
        </Text>
        <Button
          size="sm"
          variant="outline"
          colorPalette="orange"
          onClick={handleAddRelease}
          aria-label="Add release"><FaPlus />Add Release
                  </Button>
      </HStack>
      {fields.length === 0 ? (
        <Text color="gray.500" fontSize="sm" fontStyle="italic">
          No releases added. Click &quot;Add Release&quot; to add release information.
        </Text>
      ) : (
        <VStack gap={4} align="stretch">
          {fields.map((field, index) => (
            <Box
              key={field.id}
              p={4}
              borderWidth="1px"
              borderRadius="md"
              bg={rowBgColor}
              position="relative"
            >
              {/* Rerelease Badge */}
              {field.isRerelease && (
                <Badge
                  colorPalette="orange"
                  position="absolute"
                  top={2}
                  right={12}
                >
                  Rerelease
                </Badge>
              )}

              {/* Remove Button */}
              <IconButton
                aria-label="Remove release"
                size="sm"
                colorPalette="red"
                variant="ghost"
                position="absolute"
                top={2}
                right={2}
                onClick={() => remove(index)}><FaTrash /></IconButton>

              <Grid templateColumns="repeat(4, 1fr)" gap={3}>
                {/* Release Date */}
                <GridItem>
                  <Field.Root>
                    <Field.Label fontSize="xs" mb={1}>Date</Field.Label>
                    <Input
                      {...register(`releases.${index}.date` as const)}
                      placeholder="YYYY-MM"
                      size="sm"
                      defaultValue={formatDateForInput(field.date)}
                    />
                  </Field.Root>
                </GridItem>

                {/* Price */}
                <GridItem>
                  <Field.Root>
                    <Field.Label fontSize="xs" mb={1}>Price</Field.Label>
                    <Input
                      {...register(`releases.${index}.price` as const, {
                        valueAsNumber: true,
                      })}
                      type="number"
                      placeholder="Price"
                      size="sm"
                      defaultValue={field.price}
                    />
                  </Field.Root>
                </GridItem>

                {/* Currency */}
                <GridItem>
                  <Field.Root>
                    <Field.Label fontSize="xs" mb={1}>Currency</Field.Label>
                    <NativeSelect.Root size="sm">
                      <NativeSelect.Field
                        {...register(`releases.${index}.currency` as const)}
                        aria-label="Currency"
                        defaultValue={field.currency || 'JPY'}>
                        {CURRENCY_OPTIONS.map((curr) => (
                          <option key={curr} value={curr}>
                            {curr}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field.Root>
                </GridItem>

                {/* JAN/Barcode */}
                <GridItem>
                  <Field.Root>
                    <Field.Label fontSize="xs" mb={1}>JAN/UPC</Field.Label>
                    <Input
                      {...register(`releases.${index}.jan` as const)}
                      placeholder="Barcode"
                      size="sm"
                      defaultValue={field.jan}
                    />
                  </Field.Root>
                </GridItem>

                {/* Variant (e.g., "Standard (Japan)", "Limited (China)") */}
                <GridItem colSpan={2}>
                  <Field.Root>
                    <Field.Label fontSize="xs" mb={1}>Variant</Field.Label>
                    <Input
                      {...register(`releases.${index}.variant` as const)}
                      placeholder="e.g., Standard (Japan)"
                      size="sm"
                      defaultValue={field.variant}
                    />
                  </Field.Root>
                </GridItem>
              </Grid>

              {/* Rerelease Checkbox */}
              <HStack mt={3}>
                <Controller
                  control={control}
                  name={`releases.${index}.isRerelease` as const}
                  defaultValue={field.isRerelease}
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <Checkbox.Root
                      onCheckedChange={(e) => onChange(e.checked)}
                      onBlur={onBlur}
                      ref={ref}
                      aria-label="Rerelease"
                      size="sm"
                      checked={value}
                    ><Checkbox.HiddenInput /><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Label>
                      <Text fontSize="sm">This is a rerelease</Text>
                    </Checkbox.Label></Checkbox.Root>
                  )}
                />
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default ReleasesSection;
