/**
 * Collection Details Section Component
 *
 * Extracted from FigureForm.tsx to keep modules under 750 lines.
 * Contains collection status, ratings, conditions, quantity, and notes.
 */
import React from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Textarea,
  Grid,
  GridItem,
  IconButton,
  Tooltip,
  Text,
  HStack,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Divider,
  Radio,
  RadioGroup,
  Stack,
} from '@chakra-ui/react';
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
      <Divider my={4} />
      <Text fontSize="md" fontWeight="semibold" color="gray.600">Collection Details</Text>

      <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }} gap={6} mt={3}>
        {/* Row 1: Collection Status (Radio) and Rating */}
        <GridItem>
          <FormControl>
            <FormLabel>Collection Status</FormLabel>
            <RadioGroup
              value={collectionStatus || 'owned'}
              onChange={(value) => setValue('collectionStatus', value as CollectionStatus)}
            >
              <Stack direction="row" spacing={4}>
                <Radio value="owned" colorScheme="green">Owned</Radio>
                <Radio value="ordered" colorScheme="blue">Ordered</Radio>
                <Radio value="wished" colorScheme="purple">Wished</Radio>
              </Stack>
            </RadioGroup>
          </FormControl>
        </GridItem>

        <GridItem>
          {/* Conditional Rating: 1-10 for Owned, 1-5 stars for Wished */}
          {collectionStatus === 'wished' ? (
            <FormControl>
              <FormLabel>
                Priority
                <Tooltip label="How much you want this figure (1-5 stars)">
                  <IconButton
                    aria-label="Priority info"
                    icon={<FaQuestionCircle />}
                    size="xs"
                    variant="ghost"
                    ml={1}
                  />
                </Tooltip>
              </FormLabel>
              <HStack spacing={1}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <IconButton
                    key={star}
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    icon={(watch('wishRating') || 0) >= star ? <FaStar /> : <FaRegStar />}
                    size="sm"
                    variant="ghost"
                    colorScheme="yellow"
                    onClick={() => {
                      // Click same star to clear, otherwise set to clicked star
                      if (watch('wishRating') === star) {
                        setValue('wishRating', undefined);
                      } else {
                        setValue('wishRating', star);
                      }
                    }}
                  />
                ))}
              </HStack>
            </FormControl>
          ) : collectionStatus === 'owned' ? (
            <FormControl>
              <FormLabel>
                Rating
                <Tooltip label="Your personal rating from 1-10">
                  <IconButton
                    aria-label="Rating info"
                    icon={<FaQuestionCircle />}
                    size="xs"
                    variant="ghost"
                    ml={1}
                  />
                </Tooltip>
              </FormLabel>
              <HStack>
                <Box position="relative" flex={1}>
                  <NumberInput
                    min={1}
                    max={10}
                    step={1}
                    precision={0}
                    allowMouseWheel={false}
                    clampValueOnBlur={false}
                    onChange={(valueString, valueNumber) => {
                      // Handle manual input only - steppers are handled separately
                      if (valueString === '' || valueString === undefined) {
                        setValue('rating', undefined);
                      } else if (!isNaN(valueNumber) && valueNumber >= 1 && valueNumber <= 10) {
                        // Round to integer
                        setValue('rating', Math.round(valueNumber));
                      }
                    }}
                    value={watch('rating') ?? ''}
                  >
                    <NumberInputField placeholder="1-10" pr="40px" />
                  </NumberInput>
                  {/* Custom steppers to fully control wrap-around behavior */}
                  <Stack
                    position="absolute"
                    right="1px"
                    top="1px"
                    bottom="1px"
                    spacing={0}
                    width="24px"
                  >
                    <IconButton
                      aria-label="Increase"
                      icon={<Text fontSize="xs">▲</Text>}
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
                      }}
                    />
                    <IconButton
                      aria-label="Decrease"
                      icon={<Text fontSize="xs">▼</Text>}
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
                      }}
                    />
                  </Stack>
                </Box>
                <IconButton
                  aria-label="Clear rating"
                  icon={<FaTrash />}
                  size="sm"
                  variant="ghost"
                  colorScheme="gray"
                  onClick={() => setValue('rating', undefined)}
                  isDisabled={watch('rating') === undefined || watch('rating') === null}
                  opacity={watch('rating') !== undefined && watch('rating') !== null ? 1 : 0.4}
                />
              </HStack>
            </FormControl>
          ) : (
            /* Ordered status - no rating */
            <Box />
          )}
        </GridItem>

        {/* Row 2: Figure Condition and Box Condition */}
        <GridItem>
          <FormControl>
            <FormLabel>Figure Condition</FormLabel>
            <Select {...register('figureCondition')} placeholder="Select condition">
              <option value="sealed">Sealed in Box</option>
              <option value="likenew">Like New</option>
              <option value="verygood">Very Good</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </Select>
          </FormControl>
        </GridItem>

        <GridItem>
          <FormControl>
            <FormLabel>Box Condition</FormLabel>
            <Select {...register('boxCondition')} placeholder="Select condition">
              <option value="mint">Mint</option>
              <option value="verygood">Very Good</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </Select>
          </FormControl>
        </GridItem>

        {/* Row 3: Condition Notes */}
        <GridItem>
          <FormControl>
            <FormLabel>Figure Condition Notes</FormLabel>
            <Textarea
              {...register('figureConditionNotes')}
              placeholder="Details about figure condition (e.g., minor paint scuffs, missing accessory)"
              size="sm"
              rows={2}
            />
          </FormControl>
        </GridItem>

        <GridItem>
          <FormControl>
            <FormLabel>Box Condition Notes</FormLabel>
            <Textarea
              {...register('boxConditionNotes')}
              placeholder="Details about box condition (e.g., corner dent, shelf wear, original shrink wrap)"
              size="sm"
              rows={2}
            />
          </FormControl>
        </GridItem>

        {/* Row 4: Quantity */}
        <GridItem>
          <FormControl>
            <FormLabel htmlFor="quantity">
              Quantity
              <Tooltip label="Number of copies you own (e.g., multiples for display and sealed)">
                <IconButton
                  aria-label="Quantity info"
                  icon={<FaQuestionCircle />}
                  size="xs"
                  variant="ghost"
                  ml={1}
                />
              </Tooltip>
            </FormLabel>
            <NumberInput
              id="quantity"
              min={1}
              max={99}
              onChange={(_, val) => setValue('quantity', isNaN(val) || val < 1 ? 1 : val)}
              value={watch('quantity') ?? 1}
            >
              <NumberInputField aria-label="Quantity" />
              <NumberInputStepper>
                <NumberIncrementStepper aria-label="Increment quantity" />
                <NumberDecrementStepper aria-label="Decrement quantity" />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </GridItem>

        {/* Empty GridItem to maintain 2-column layout */}
        <GridItem />

        {/* Row 5: Note (full width) */}
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <FormControl>
            <FormLabel htmlFor="note">
              Note
              <Tooltip label="Personal notes about this figure (purchase details, memories, display plans)">
                <IconButton
                  aria-label="Note info"
                  icon={<FaQuestionCircle />}
                  size="xs"
                  variant="ghost"
                  ml={1}
                />
              </Tooltip>
            </FormLabel>
            <Textarea
              id="note"
              {...register('note')}
              aria-label="Note"
              placeholder="Personal notes about this figure..."
              size="sm"
              rows={3}
            />
          </FormControl>
        </GridItem>
      </Grid>
    </>
  );
};

export default CollectionDetailsSection;
