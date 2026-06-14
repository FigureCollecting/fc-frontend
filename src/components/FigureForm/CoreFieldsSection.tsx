/**
 * Core Fields Section Component
 *
 * Extracted from FigureForm.tsx to keep modules under 750 lines.
 * Contains name, scale, storage detail, and image URL fields.
 * Note: Company roles have been moved to their own section (Schema v3).
 * Note: Image preview is now rendered in FigureFormMain as a sticky sidebar.
 */
import React from 'react';
import {
  Steps,
  Input,
  Grid,
  GridItem,
  InputGroup,
  InputRightElement,
  IconButton,
  Text,
  Field,
} from '@chakra-ui/react';
import { Tooltip } from '@/components/ui/tooltip';
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
        <Field.Root invalid={!!errors.name}>
          <Field.Label>
            Figure Name
            {!mfcLink && <Text as="span" color="red.500" ml={1} aria-label="required">*</Text>}
          </Field.Label>
          <Input
            {...register('name', { validate: validateName })}
            placeholder="e.g., Nendoroid Miku Hatsune"
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          <Field.ErrorText id="name-error" data-testid="form-error-message">{errors.name?.message}</Field.ErrorText>
        </Field.Root>
      </GridItem>
      <GridItem>
        <Field.Root invalid={!!errors.scale}>
          <Field.Label fontWeight="bold" color="purple.600">
            Scale
            <Tooltip content="Common scales: 1/8, 1/7, 1/6 for scale figures, or enter 'Nendoroid', 'Figma', etc.">
              <IconButton aria-label="Scale info" size="xs" variant="ghost" ml={1}><FaQuestionCircle /></IconButton>
            </Tooltip>
          </Field.Label>
          <Input
            {...register('scale')}
            placeholder="e.g., 1/8, 1/7, Nendoroid"
            onBlur={handleScaleBlur}
            fontWeight="semibold"
            borderColor="purple.300"
            borderWidth="2px"
            _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px var(--chakra-colors-purple-500)' }}
          />
          <Field.ErrorText>{errors.scale?.message}</Field.ErrorText>
        </Field.Root>
      </GridItem>
      <GridItem>
        <Field.Root>
          <Field.Label>
            Storage Detail
            <Tooltip content="Where within your storage location (shelf label, box ID, drawer number, etc.)">
              <IconButton aria-label="Storage detail info" size="xs" variant="ghost" ml={1}><FaQuestionCircle /></IconButton>
            </Tooltip>
          </Field.Label>
          <Input
            {...register('storageDetail')}
            placeholder="e.g., Shelf A-3, Box #12, Left corner"
          />
        </Field.Root>
      </GridItem>
      <GridItem colSpan={{ base: 1, md: 2 }}>
        <Field.Root invalid={!!errors.imageUrl}>
          <Field.Label>Image URL (Optional)</Field.Label>
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
                size="sm"
                variant="ghost"
                onClick={openImageLink}
                disabled={!imageUrl}><FaImage /></IconButton>
            </InputRightElement>
          </InputGroup>
          <Field.ErrorText>{errors.imageUrl?.message}</Field.ErrorText>
          <Text fontSize="xs" color="gray.500" mt={1}>
            Leave blank to auto-fetch from MFC • Preview shown on right
          </Text>
        </Field.Root>
      </GridItem>
    </Grid>
  );
};

export default CoreFieldsSection;
