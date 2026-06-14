/**
 * Catalog & Purchase Section Component
 *
 * Extracted from FigureForm.tsx to keep modules under 750 lines.
 * Contains collapsible panels for Catalog Details and Purchase Information.
 */
import React, { useState } from 'react';
import {
  Steps,
  Box,
  Button,
  Input,
  Grid,
  GridItem,
  IconButton,
  Text,
  Collapsible,
  NativeSelect,
  NumberInput,
  NumberInputField,
  Field,
} from '@chakra-ui/react';
import { Tooltip } from '../ui/tooltip';
import { FaChevronDown, FaChevronUp, FaQuestionCircle } from 'react-icons/fa';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { FigureFormData } from '../../types';

interface CatalogPurchaseSectionProps {
  register: UseFormRegister<FigureFormData>;
  setValue: UseFormSetValue<FigureFormData>;
  watch: UseFormWatch<FigureFormData>;
}

const CatalogPurchaseSection: React.FC<CatalogPurchaseSectionProps> = ({
  register,
  setValue,
  watch,
}) => {
  const [showCatalogDetails, setShowCatalogDetails] = useState(false);
  const [showPurchaseInfo, setShowPurchaseInfo] = useState(false);

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════════════
          Schema v3.0 Fields - Physical Dimensions (Collapsible)
          ═══════════════════════════════════════════════════════════════════════════ */}
      <Box borderWidth="1px" borderRadius="lg" p={4} mt={4}>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowCatalogDetails(!showCatalogDetails)}
          width="full"
          justifyContent="space-between"><Text fontWeight="semibold">Physical Dimensions</Text>{showCatalogDetails ? <FaChevronUp /> : <FaChevronDown />}</Button>
        <Collapsible.Root open={showCatalogDetails}>
          <Collapsible.Content>
            <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' }} gap={6} mt={4}>
              <GridItem>
                <Field.Root>
                  <Field.Label>Height (mm)</Field.Label>
                  <NumberInput.Root min={0} onValueChange={(_, val) => setValue('heightMm', isNaN(val) ? undefined : val)} value={String(watch('heightMm') ?? '')}>
                    <NumberInput.Input placeholder="e.g., 230" />
                  </NumberInput.Root>
                </Field.Root>
              </GridItem>

              <GridItem>
                <Field.Root>
                  <Field.Label>Width (mm)</Field.Label>
                  <NumberInput.Root min={0} onValueChange={(_, val) => setValue('widthMm', isNaN(val) ? undefined : val)} value={String(watch('widthMm') ?? '')}>
                    <NumberInput.Input placeholder="e.g., 150" />
                  </NumberInput.Root>
                </Field.Root>
              </GridItem>

              <GridItem>
                <Field.Root>
                  <Field.Label>Depth (mm)</Field.Label>
                  <NumberInput.Root min={0} onValueChange={(_, val) => setValue('depthMm', isNaN(val) ? undefined : val)} value={String(watch('depthMm') ?? '')}>
                    <NumberInput.Input placeholder="e.g., 120" />
                  </NumberInput.Root>
                </Field.Root>
              </GridItem>
            </Grid>
          </Collapsible.Content>
        </Collapsible.Root>
      </Box>
      {/* ═══════════════════════════════════════════════════════════════════════════
          Schema v3.0 Fields - Purchase Info (Collapsible)
          ═══════════════════════════════════════════════════════════════════════════ */}
      <Box borderWidth="1px" borderRadius="lg" p={4} mt={4}>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowPurchaseInfo(!showPurchaseInfo)}
          width="full"
          justifyContent="space-between"><Text fontWeight="semibold">Purchase Information</Text>{showPurchaseInfo ? <FaChevronUp /> : <FaChevronDown />}</Button>
        <Collapsible.Root open={showPurchaseInfo}>
          <Collapsible.Content>
            <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' }} gap={6} mt={4}>
              <GridItem>
                <Field.Root>
                  <Field.Label>Purchase Date</Field.Label>
                  <Input
                    type="date"
                    {...register('purchaseDate')}
                  />
                </Field.Root>
              </GridItem>

              <GridItem>
                <Field.Root>
                  <Field.Label>Purchase Price</Field.Label>
                  <NumberInput.Root min={0} onValueChange={(_, val) => setValue('purchasePrice', isNaN(val) ? undefined : val)} value={String(watch('purchasePrice') ?? '')}>
                    <NumberInput.Input placeholder="e.g., 150.00" />
                  </NumberInput.Root>
                </Field.Root>
              </GridItem>

              <GridItem>
                <Field.Root>
                  <Field.Label>Purchase Currency</Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field {...register('purchaseCurrency')}>
                      <option value="USD">USD ($)</option>
                      <option value="JPY">JPY (¥)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CNY">CNY (¥)</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Field.Root>
              </GridItem>

              <GridItem>
                <Field.Root>
                  <Field.Label>
                    Merchant Name
                    <Tooltip content="Store or seller name">
                      <IconButton aria-label="Merchant info" size="xs" variant="ghost" ml={1}><FaQuestionCircle /></IconButton>
                    </Tooltip>
                  </Field.Label>
                  <Input
                    {...register('merchantName')}
                    placeholder="e.g., AmiAmi, Solaris Japan"
                  />
                </Field.Root>
              </GridItem>

              <GridItem colSpan={{ base: 1, md: 2 }}>
                <Field.Root>
                  <Field.Label>
                    Merchant URL
                    <Tooltip content="Link to the store or product page">
                      <IconButton aria-label="Merchant URL info" size="xs" variant="ghost" ml={1}><FaQuestionCircle /></IconButton>
                    </Tooltip>
                  </Field.Label>
                  <Input
                    {...register('merchantUrl')}
                    placeholder="https://www.amiami.com/..."
                  />
                </Field.Root>
              </GridItem>
            </Grid>
          </Collapsible.Content>
        </Collapsible.Root>
      </Box>
    </>
  );
};

export default CatalogPurchaseSection;
