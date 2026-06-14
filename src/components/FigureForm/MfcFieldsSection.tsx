/**
 * MFC Fields Section Component
 *
 * Displays MFC-specific fields extracted from scraping:
 * - mfcTitle, origin, version
 * - category, classification, materials
 * - tags (as badges/chips)
 */
import React from 'react';
import { Input,
  Grid,
  GridItem,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
  Text,
  Box,
  Field,
} from '@chakra-ui/react';
import { UseFormRegister, UseFormWatch } from 'react-hook-form';
import { FigureFormData } from '../../types';

interface MfcFieldsSectionProps {
  register: UseFormRegister<FigureFormData>;
  watch: UseFormWatch<FigureFormData>;
}

const MfcFieldsSection: React.FC<MfcFieldsSectionProps> = ({ register, watch }) => {
  const tags = watch('tags') || [];

  return (
    <Box>
      <Text fontWeight="semibold" fontSize="md" mb={3}>
        MFC Data
      </Text>
      <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' }} gap={4}>
        <GridItem>
          <Field.Root>
            <Field.Label fontSize="sm">MFC Title</Field.Label>
            <Input
              {...register('mfcTitle')}
              placeholder="Figure title from MFC"
              size="sm"
            />
          </Field.Root>
        </GridItem>

        <GridItem>
          <Field.Root>
            <Field.Label fontSize="sm">Origin / Series</Field.Label>
            <Input
              {...register('origin')}
              placeholder="e.g., Fate/Grand Order"
              size="sm"
            />
          </Field.Root>
        </GridItem>

        <GridItem>
          <Field.Root>
            <Field.Label fontSize="sm">Version</Field.Label>
            <Input
              {...register('version')}
              placeholder="e.g., Little Devil Ver."
              size="sm"
            />
          </Field.Root>
        </GridItem>

        <GridItem>
          <Field.Root>
            <Field.Label fontSize="sm">Category</Field.Label>
            <Input
              {...register('category')}
              placeholder="e.g., Scale Figure"
              size="sm"
            />
          </Field.Root>
        </GridItem>

        <GridItem>
          <Field.Root>
            <Field.Label fontSize="sm">Classification</Field.Label>
            <Input
              {...register('classification')}
              placeholder="e.g., Goods"
              size="sm"
            />
          </Field.Root>
        </GridItem>

        <GridItem>
          <Field.Root>
            <Field.Label fontSize="sm">Materials</Field.Label>
            <Input
              {...register('materials')}
              placeholder="e.g., PVC, ABS"
              size="sm"
            />
          </Field.Root>
        </GridItem>

        {tags.length > 0 && (
          <GridItem colSpan={{ base: 1, md: 3 }}>
            <Field.Root>
              <Field.Label fontSize="sm">Tags</Field.Label>
              <Wrap gap={2}>
                {tags.map((tag, index) => (
                  <WrapItem key={index}>
                    <Tag.Root
                      size="md"
                      colorPalette={
                        tag === '18+' ? 'red' :
                        tag === 'Castoff' ? 'orange' :
                        tag === 'Limited' ? 'purple' :
                        'gray'
                      }
                    >
                      <Tag.Label>{tag}</Tag.Label>
                    </Tag.Root>
                  </WrapItem>
                ))}
              </Wrap>
            </Field.Root>
          </GridItem>
        )}
      </Grid>
    </Box>
  );
};

export default MfcFieldsSection;
