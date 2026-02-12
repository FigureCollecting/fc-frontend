/**
 * Core Fields Section Component
 *
 * Extracted from FigureForm.tsx to keep modules under 750 lines.
 * Contains name, scale, location, storage detail, and image URL fields.
 * Note: Company roles have been moved to their own section (Schema v3).
 * Note: Image preview is now rendered in FigureFormMain as a sticky sidebar.
 */
import React from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Grid,
  GridItem,
  InputGroup,
  InputRightElement,
  IconButton,
  Tooltip,
  Text,
} from '@chakra-ui/react';
import { FaQuestionCircle, FaImage } from 'react-icons/fa';
import { UseFormRegister, UseFormGetValues, FieldErrors } from 'react-hook-form';
import { FigureFormData } from '../../types';

interface CoreFieldsSectionProps {
  register: UseFormRegister<FigureFormData>;
  getValues: UseFormGetValues<FigureFormData>;
  errors: FieldErrors<FigureFormData>;
  mfcLink: string | undefined;
  imageUrl: string | undefined;
  handleScaleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  validateName: (value: string | undefined) => true | string;
  validateUrl: (value: string | undefined) => true | string;
  openImageLink: () => void;
}

const CoreFieldsSection: React.FC<CoreFieldsSectionProps> = ({
  register,
  errors,
  mfcLink,
  imageUrl,
  handleScaleBlur,
  validateName,
  validateUrl,
  openImageLink,
}) => {
  return (
    <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }} gap={6}>
      <GridItem>
        <FormControl isInvalid={!!errors.name}>
          <FormLabel>
            Figure Name
            {!mfcLink && <Text as="span" color="red.500" ml={1} aria-label="required">*</Text>}
          </FormLabel>
          <Input
            {...register('name', { validate: validateName })}
            placeholder="e.g., Nendoroid Miku Hatsune"
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          <FormErrorMessage id="name-error" data-testid="form-error-message">{errors.name?.message}</FormErrorMessage>
        </FormControl>
      </GridItem>

      <GridItem>
        <FormControl isInvalid={!!errors.scale}>
          <FormLabel fontWeight="bold" color="purple.600">
            Scale
            <Tooltip label="Common scales: 1/8, 1/7, 1/6 for scale figures, or enter 'Nendoroid', 'Figma', etc.">
              <IconButton
                aria-label="Scale info"
                icon={<FaQuestionCircle />}
                size="xs"
                variant="ghost"
                ml={1}
              />
            </Tooltip>
          </FormLabel>
          <Input
            {...register('scale')}
            placeholder="e.g., 1/8, 1/7, Nendoroid"
            onBlur={handleScaleBlur}
            fontWeight="semibold"
            borderColor="purple.300"
            borderWidth="2px"
            _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px var(--chakra-colors-purple-500)' }}
          />
          <FormErrorMessage>{errors.scale?.message}</FormErrorMessage>
        </FormControl>
      </GridItem>

      <GridItem>
        <FormControl isInvalid={!!errors.location}>
          <FormLabel>Storage Location</FormLabel>
          <Input
            {...register('location')} //optional
            placeholder="e.g., Shelf, Display Case, Storage Room"
          />
          <FormErrorMessage>{errors.location?.message}</FormErrorMessage>
        </FormControl>
      </GridItem>

      <GridItem>
        <FormControl>
          <FormLabel>
            Storage Detail
            <Tooltip label="Where within your storage location (shelf label, box ID, drawer number, etc.)">
              <IconButton
                aria-label="Storage detail info"
                icon={<FaQuestionCircle />}
                size="xs"
                variant="ghost"
                ml={1}
              />
            </Tooltip>
          </FormLabel>
          <Input
            {...register('storageDetail')}
            placeholder="e.g., Shelf A-3, Box #12, Left corner"
          />
        </FormControl>
      </GridItem>

      <GridItem colSpan={{ base: 1, md: 2 }}>
        <FormControl isInvalid={!!errors.imageUrl}>
          <FormLabel>Image URL (Optional)</FormLabel>
          <InputGroup>
            <Input
              {...register('imageUrl', {
                validate: validateUrl,
              })}
              placeholder="https://example.com/image.jpg"
            />
            <InputRightElement>
              <IconButton
                aria-label="Open image link"
                icon={<FaImage />}
                size="sm"
                variant="ghost"
                onClick={openImageLink}
                isDisabled={!imageUrl}
              />
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>{errors.imageUrl?.message}</FormErrorMessage>
          <Text fontSize="xs" color="gray.500" mt={1}>
            Leave blank to auto-fetch from MFC • Preview shown on right
          </Text>
        </FormControl>
      </GridItem>
    </Grid>
  );
};

export default CoreFieldsSection;
