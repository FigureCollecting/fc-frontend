/**
 * Collection Details Section Component
 *
 * Extracted from FigureForm.tsx to keep modules under 750 lines.
 * Contains collection status, ratings, conditions, quantity, and notes.
 */
import React from 'react';
import { Box,
  Textarea,
  Grid,
  GridItem,
  IconButton,
  Text,
  HStack,
  NativeSelect,
  NumberInput,
  RadioGroup,
  Stack,
  Separator,
  Field,
} from '@chakra-ui/react';
import { Tooltip } from '../ui/tooltip';
import { FaQuestionCircle, FaTrash, FaStar, FaRegStar } from 'react-icons/fa';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { FigureFormData, CollectionStatus } from '../../types';

interface CollectionDetailsSectionProps {
  register: UseFormRegister<FigureFormData>;
  setValue: UseFormSetValue<FigureFormData>;
  watch: UseFormWatch<FigureFormData>;
}

const CollectionDetailsSection: React.FC<CollectionDetailsSectionProps> = ({
  register,
  setValue,
  watch,
}) => {
  const collectionStatus = watch('collectionStatus');

  return (
    <>
      <Separator my={4} />
      <Text fontSize="md" fontWeight="semibold" color="gray.600">Collection Details</Text>
      <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }} gap={6} mt={3}>
        {/* Row 1: Collection Status (Radio) and Rating */}
        <GridItem>
          <Field.Root>
            <Field.Label>Collection Status</Field.Label>
            <RadioGroup.Root
              value={collectionStatus || 'owned'}
              onValueChange={(e) => setValue('collectionStatus', e.value as CollectionStatus)}>
              <Stack direction="row" gap={4}>
                <RadioGroup.Item value="owned"><RadioGroup.ItemHiddenInput /><RadioGroup.ItemIndicator /><RadioGroup.ItemText>Owned</RadioGroup.ItemText></RadioGroup.Item>
                <RadioGroup.Item value="ordered"><RadioGroup.ItemHiddenInput /><RadioGroup.ItemIndicator /><RadioGroup.ItemText>Ordered</RadioGroup.ItemText></RadioGroup.Item>
                <RadioGroup.Item value="wished"><RadioGroup.ItemHiddenInput /><RadioGroup.ItemIndicator /><RadioGroup.ItemText>Wished</RadioGroup.ItemText></RadioGroup.Item>
              </Stack>
            </RadioGroup.Root>
          </Field.Root>
        </GridItem>

        <GridItem>
          {/* Conditional Rating: 1-10 for Owned, 1-5 stars for Wished */}
          {collectionStatus === 'wished' ? (
            <Field.Root>
              <Field.Label>
                Priority
                <Tooltip content="How much you want this figure (1-5 stars)">
                  <IconButton aria-label="Priority info" size="xs" variant="ghost" ml={1}><FaQuestionCircle /></IconButton>
                </Tooltip>
              </Field.Label>
              <HStack gap={1}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <IconButton
                    key={star}
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    size="sm"
                    variant="ghost"
                    colorPalette="yellow"
                    onClick={() => {
                      // Click same star to clear, otherwise set to clicked star
                      if (watch('wishRating') === star) {
                        setValue('wishRating', undefined);
                      } else {
                        setValue('wishRating', star);
                      }
                    }}>{(watch('wishRating') || 0) >= star ? <FaStar /> : <FaRegStar />}</IconButton>
                ))}
              </HStack>
            </Field.Root>
          ) : collectionStatus === 'owned' ? (
            <Field.Root>
              <Field.Label>
                Rating
                <Tooltip content="Your personal rating from 1-10">
                  <IconButton aria-label="Rating info" size="xs" variant="ghost" ml={1}><FaQuestionCircle /></IconButton>
                </Tooltip>
              </Field.Label>
              <HStack>
                <Box position="relative" flex={1}>
                  <NumberInput.Root
                    min={1}
                    max={10}
                    step={1}
                    formatOptions={{ maximumFractionDigits: 0 }}
                    allowMouseWheel={false}
                    clampValueOnBlur={false}
                    onValueChange={(e) => {
                      // Handle manual input only - steppers are handled separately
                      if (e.value === '' || e.value === undefined) {
                        setValue('rating', undefined);
                      } else if (!isNaN(e.valueAsNumber) && e.valueAsNumber >= 1 && e.valueAsNumber <= 10) {
                        // Round to integer
                        setValue('rating', Math.round(e.valueAsNumber));
                      }
                    }}
                    value={String(watch('rating') ?? '')}
                  >
                    <NumberInput.Input placeholder="1-10" pr="40px" />
                  </NumberInput.Root>
                  {/* Custom steppers to fully control wrap-around behavior */}
                  <Stack
                    position="absolute"
                    right="1px"
                    top="1px"
                    bottom="1px"
                    gap={0}
                    width="24px"
                  >
                    <IconButton
                      aria-label="Increase"
                      size="xs"
                      variant="ghost"
                      height="50%"
                      minW="24px"
                      borderRadius={0}
                      onClick={() => {
                        const current = watch('rating');
                        if (current === undefined || current === null) {
                          setValue('rating', 1);
                        } else if (current >= 10) {
                          setValue('rating', undefined);
                        } else {
                          setValue('rating', Math.min(10, current + 1));
                        }
                      }}><Text fontSize="xs">▲</Text></IconButton>
                    <IconButton
                      aria-label="Decrease"
                      size="xs"
                      variant="ghost"
                      height="50%"
                      minW="24px"
                      borderRadius={0}
                      onClick={() => {
                        const current = watch('rating');
                        if (current === undefined || current === null) {
                          setValue('rating', 10);
                        } else if (current <= 1) {
                          setValue('rating', undefined);
                        } else {
                          setValue('rating', Math.max(1, current - 1));
                        }
                      }}><Text fontSize="xs">▼</Text></IconButton>
                  </Stack>
                </Box>
                <IconButton
                  aria-label="Clear rating"
                  size="sm"
                  variant="ghost"
                  colorPalette="gray"
                  onClick={() => setValue('rating', undefined)}
                  disabled={watch('rating') === undefined || watch('rating') === null}
                  opacity={watch('rating') !== undefined && watch('rating') !== null ? 1 : 0.4}><FaTrash /></IconButton>
              </HStack>
            </Field.Root>
          ) : (
            /* Ordered status - no rating */
            (<Box />)
          )}
        </GridItem>

        {/* Row 2: Figure Condition and Box Condition */}
        <GridItem>
          <Field.Root>
            <Field.Label>Figure Condition</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field {...register('figureCondition')} placeholder="Select condition">
                <option value="sealed">Sealed in Box</option>
                <option value="likenew">Like New</option>
                <option value="verygood">Very Good</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>
        </GridItem>

        <GridItem>
          <Field.Root>
            <Field.Label>Box Condition</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field {...register('boxCondition')} placeholder="Select condition">
                <option value="mint">Mint</option>
                <option value="verygood">Very Good</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>
        </GridItem>

        {/* Row 3: Condition Notes */}
        <GridItem>
          <Field.Root>
            <Field.Label>Figure Condition Notes</Field.Label>
            <Textarea
              {...register('figureConditionNotes')}
              placeholder="Details about figure condition (e.g., minor paint scuffs, missing accessory)"
              size="sm"
              rows={2}
            />
          </Field.Root>
        </GridItem>

        <GridItem>
          <Field.Root>
            <Field.Label>Box Condition Notes</Field.Label>
            <Textarea
              {...register('boxConditionNotes')}
              placeholder="Details about box condition (e.g., corner dent, shelf wear, original shrink wrap)"
              size="sm"
              rows={2}
            />
          </Field.Root>
        </GridItem>

        {/* Row 4: Quantity */}
        <GridItem>
          <Field.Root>
            <Field.Label htmlFor="quantity">
              Quantity
              <Tooltip content="Number of copies you own (e.g., multiples for display and sealed)">
                <IconButton aria-label="Quantity info" size="xs" variant="ghost" ml={1}><FaQuestionCircle /></IconButton>
              </Tooltip>
            </Field.Label>
            <NumberInput.Root
              id="quantity"
              min={1}
              max={99}
              onValueChange={(e) => setValue('quantity', isNaN(e.valueAsNumber) || e.valueAsNumber < 1 ? 1 : e.valueAsNumber)}
              value={String(watch('quantity') ?? 1)}
            >
              <NumberInput.Input aria-label="Quantity" />
              <NumberInput.Control>
                <NumberInput.IncrementTrigger aria-label="Increment quantity" />
                <NumberInput.DecrementTrigger aria-label="Decrement quantity" />
              </NumberInput.Control>
            </NumberInput.Root>
          </Field.Root>
        </GridItem>

        {/* Empty GridItem to maintain 2-column layout */}
        <GridItem />

        {/* Row 5: Note (full width) */}
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <Field.Root>
            <Field.Label htmlFor="note">
              Note
              <Tooltip content="Personal notes about this figure (purchase details, memories, display plans)">
                <IconButton aria-label="Note info" size="xs" variant="ghost" ml={1}><FaQuestionCircle /></IconButton>
              </Tooltip>
            </Field.Label>
            <Textarea
              id="note"
              {...register('note')}
              aria-label="Note"
              placeholder="Personal notes about this figure..."
              size="sm"
              rows={3}
            />
          </Field.Root>
        </GridItem>
      </Grid>
    </>
  );
};

export default CollectionDetailsSection;
