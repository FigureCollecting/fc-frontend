/**
 * Catalog & Purchase Section Component
 *
 * Extracted from FigureForm.tsx to keep modules under 750 lines.
 * Contains collapsible panels for Catalog Details and Purchase Information.
 */
import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Grid,
  GridItem,
  IconButton,
  Tooltip,
  Text,
  Collapse,
  Select,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react';
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
          rightIcon={showCatalogDetails ? <FaChevronUp /> : <FaChevronDown />}
          width="full"
          justifyContent="space-between"
        >
          <Text fontWeight="semibold">Physical Dimensions</Text>
        </Button>
        <Collapse in={showCatalogDetails} animateOpacity>
          <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' }} gap={6} mt={4}>
            <GridItem>
              <FormControl>
                <FormLabel>Height (mm)</FormLabel>
                <NumberInput min={0} onChange={(_, val) => setValue('heightMm', isNaN(val) ? undefined : val)} value={watch('heightMm') ?? ''}>
                  <NumberInputField placeholder="e.g., 230" />
                </NumberInput>
              </FormControl>
            </GridItem>

            <GridItem>
              <FormControl>
                <FormLabel>Width (mm)</FormLabel>
                <NumberInput min={0} onChange={(_, val) => setValue('widthMm', isNaN(val) ? undefined : val)} value={watch('widthMm') ?? ''}>
                  <NumberInputField placeholder="e.g., 150" />
                </NumberInput>
              </FormControl>
            </GridItem>

            <GridItem>
              <FormControl>
                <FormLabel>Depth (mm)</FormLabel>
                <NumberInput min={0} onChange={(_, val) => setValue('depthMm', isNaN(val) ? undefined : val)} value={watch('depthMm') ?? ''}>
                  <NumberInputField placeholder="e.g., 120" />
                </NumberInput>
              </FormControl>
            </GridItem>
          </Grid>
        </Collapse>
      </Box>

      {/* ═══════════════════════════════════════════════════════════════════════════
          Schema v3.0 Fields - Purchase Info (Collapsible)
          ═══════════════════════════════════════════════════════════════════════════ */}
      <Box borderWidth="1px" borderRadius="lg" p={4} mt={4}>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowPurchaseInfo(!showPurchaseInfo)}
          rightIcon={showPurchaseInfo ? <FaChevronUp /> : <FaChevronDown />}
          width="full"
          justifyContent="space-between"
        >
          <Text fontWeight="semibold">Purchase Information</Text>
        </Button>
        <Collapse in={showPurchaseInfo} animateOpacity>
          <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' }} gap={6} mt={4}>
            <GridItem>
              <FormControl>
                <FormLabel>Purchase Date</FormLabel>
                <Input
                  type="date"
                  {...register('purchaseDate')}
                />
              </FormControl>
            </GridItem>

            <GridItem>
              <FormControl>
                <FormLabel>Purchase Price</FormLabel>
                <NumberInput min={0} onChange={(_, val) => setValue('purchasePrice', isNaN(val) ? undefined : val)} value={watch('purchasePrice') ?? ''}>
                  <NumberInputField placeholder="e.g., 150.00" />
                </NumberInput>
              </FormControl>
            </GridItem>

            <GridItem>
              <FormControl>
                <FormLabel>Purchase Currency</FormLabel>
                <Select {...register('purchaseCurrency')}>
                  <option value="USD">USD ($)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CNY">CNY (¥)</option>
                </Select>
              </FormControl>
            </GridItem>

            <GridItem>
              <FormControl>
                <FormLabel>
                  Merchant Name
                  <Tooltip label="Store or seller name">
                    <IconButton
                      aria-label="Merchant info"
                      icon={<FaQuestionCircle />}
                      size="xs"
                      variant="ghost"
                      ml={1}
                    />
                  </Tooltip>
                </FormLabel>
                <Input
                  {...register('merchantName')}
                  placeholder="e.g., AmiAmi, Solaris Japan"
                />
              </FormControl>
            </GridItem>

            <GridItem colSpan={{ base: 1, md: 2 }}>
              <FormControl>
                <FormLabel>
                  Merchant URL
                  <Tooltip label="Link to the store or product page">
                    <IconButton
                      aria-label="Merchant URL info"
                      icon={<FaQuestionCircle />}
                      size="xs"
                      variant="ghost"
                      ml={1}
                    />
                  </Tooltip>
                </FormLabel>
                <Input
                  {...register('merchantUrl')}
                  placeholder="https://www.amiami.com/..."
                />
              </FormControl>
            </GridItem>
          </Grid>
        </Collapse>
      </Box>
    </>
  );
};

export default CatalogPurchaseSection;
