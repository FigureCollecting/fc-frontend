/**
 * MFC Fields Section Component
 *
 * Displays MFC-specific fields extracted from scraping:
 * - mfcTitle, origin, version
 * - category, classification, materials
 * - tags (as badges/chips)
 */
import React from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  Grid,
  GridItem,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
  Text,
  Box,
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
          <FormControl>
            <FormLabel fontSize="sm">MFC Title</FormLabel>
            <Input
              {...register('mfcTitle')}
              placeholder="Figure title from MFC"
              size="sm"
            />
          </FormControl>
        </GridItem>

        <GridItem>
          <FormControl>
            <FormLabel fontSize="sm">Origin / Series</FormLabel>
            <Input
              {...register('origin')}
              placeholder="e.g., Fate/Grand Order"
              size="sm"
            />
          </FormControl>
        </GridItem>

        <GridItem>
          <FormControl>
            <FormLabel fontSize="sm">Version</FormLabel>
            <Input
              {...register('version')}
              placeholder="e.g., Little Devil Ver."
              size="sm"
            />
          </FormControl>
        </GridItem>

        <GridItem>
          <FormControl>
            <FormLabel fontSize="sm">Category</FormLabel>
            <Input
              {...register('category')}
              placeholder="e.g., Scale Figure"
              size="sm"
            />
          </FormControl>
        </GridItem>

        <GridItem>
          <FormControl>
            <FormLabel fontSize="sm">Classification</FormLabel>
            <Input
              {...register('classification')}
              placeholder="e.g., Goods"
              size="sm"
            />
          </FormControl>
        </GridItem>

        <GridItem>
          <FormControl>
            <FormLabel fontSize="sm">Materials</FormLabel>
            <Input
              {...register('materials')}
              placeholder="e.g., PVC, ABS"
              size="sm"
            />
          </FormControl>
        </GridItem>

        {tags.length > 0 && (
          <GridItem colSpan={{ base: 1, md: 3 }}>
            <FormControl>
              <FormLabel fontSize="sm">Tags</FormLabel>
              <Wrap spacing={2}>
                {tags.map((tag, index) => (
                  <WrapItem key={index}>
                    <Tag
                      size="md"
                      colorScheme={
                        tag === '18+' ? 'red' :
                        tag === 'Castoff' ? 'orange' :
                        tag === 'Limited' ? 'purple' :
                        'gray'
                      }
                    >
                      <TagLabel>{tag}</TagLabel>
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
            </FormControl>
          </GridItem>
        )}
      </Grid>
    </Box>
  );
};

export default MfcFieldsSection;
