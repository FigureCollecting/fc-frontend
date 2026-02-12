import React, { useState, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Textarea,
  useToast,
  Progress,
  Badge,
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  useColorModeValue,
  Input,
  FormControl,
  FormLabel,
  Switch,
  Divider,
  Icon,
} from '@chakra-ui/react';
import { FaUpload, FaFileImport, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { previewBulkImport, executeBulkImport } from '../api';
import { BulkImportPreviewItem, BulkImportPreviewResponse, BulkImportExecuteResponse } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('BULK_IMPORT');

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onImportComplete }) => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [csvContent, setCsvContent] = useState('');
  const [previewData, setPreviewData] = useState<BulkImportPreviewResponse | null>(null);
  const [importResult, setImportResult] = useState<BulkImportExecuteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
    };
    reader.readAsText(file);
  }, []);

  const handlePreview = async () => {
    if (!csvContent.trim()) {
      toast({
        title: 'No content',
        description: 'Please paste CSV content or upload a file',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await previewBulkImport(csvContent);
      setPreviewData(result);
      setStep('preview');
      logger.info('Preview generated:', result.summary);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to preview import';
      toast({
        title: 'Preview failed',
        description: message,
        status: 'error',
        duration: 5000,
      });
      logger.error('Preview failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    setStep('importing');
    setIsLoading(true);
    try {
      const result = await executeBulkImport(csvContent, skipDuplicates);
      setImportResult(result);
      setStep('complete');
      logger.info('Import completed:', result);

      toast({
        title: 'Import successful',
        description: `Imported ${result.imported} figures${result.skipped > 0 ? `, skipped ${result.skipped} duplicates` : ''}`,
        status: 'success',
        duration: 5000,
      });

      if (result.imported > 0) {
        onImportComplete();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Import failed';
      toast({
        title: 'Import failed',
        description: message,
        status: 'error',
        duration: 5000,
      });
      logger.error('Import failed:', error);
      setStep('preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setCsvContent('');
    setPreviewData(null);
    setImportResult(null);
    onClose();
  };

  const getStatusBadge = (status: BulkImportPreviewItem['status']) => {
    switch (status) {
      case 'new':
        return <Badge colorScheme="green">New</Badge>;
      case 'catalog_exists':
        return <Badge colorScheme="blue">In Catalog</Badge>;
      case 'duplicate':
        return <Badge colorScheme="orange">Already Owned</Badge>;
    }
  };

  const renderUploadStep = () => (
    <VStack spacing={4} align="stretch">
      <Alert status="info">
        <AlertIcon />
        <Text fontSize="sm">
          Export your collection from MyFigureCollection.net and paste the CSV content below,
          or upload the CSV file directly.
        </Text>
      </Alert>

      <FormControl>
        <FormLabel>Upload CSV File</FormLabel>
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          p={1}
        />
      </FormControl>

      <Text textAlign="center" color="gray.500">- OR -</Text>

      <FormControl>
        <FormLabel>Paste CSV Content</FormLabel>
        <Textarea
          placeholder="Paste your MFC CSV export here..."
          value={csvContent}
          onChange={(e) => setCsvContent(e.target.value)}
          minH="200px"
          fontFamily="mono"
          fontSize="sm"
        />
      </FormControl>
    </VStack>
  );

  const renderPreviewStep = () => (
    <VStack spacing={4} align="stretch">
      {previewData && (
        <>
          <StatGroup>
            <Stat>
              <StatLabel>New Items</StatLabel>
              <StatNumber color="green.500">{previewData.summary.new}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>In Catalog</StatLabel>
              <StatNumber color="blue.500">{previewData.summary.catalogExists}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Already Owned</StatLabel>
              <StatNumber color="orange.500">{previewData.summary.duplicates}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Total</StatLabel>
              <StatNumber>{previewData.totalItems}</StatNumber>
            </Stat>
          </StatGroup>

          <Divider />

          <FormControl display="flex" alignItems="center">
            <FormLabel mb="0">Skip duplicates (already owned items)</FormLabel>
            <Switch
              isChecked={skipDuplicates}
              onChange={(e) => setSkipDuplicates(e.target.checked)}
              colorScheme="green"
            />
          </FormControl>

          {previewData.summary.duplicates > 0 && skipDuplicates && (
            <Alert status="info" size="sm">
              <AlertIcon />
              <Text fontSize="sm">
                {previewData.summary.duplicates} duplicate(s) will be skipped during import.
              </Text>
            </Alert>
          )}

          <Box maxH="300px" overflowY="auto" borderWidth={1} borderRadius="md" borderColor={borderColor}>
            <TableContainer>
              <Table size="sm" variant="simple">
                <Thead position="sticky" top={0} bg={bgColor}>
                  <Tr>
                    <Th>MFC ID</Th>
                    <Th>Title</Th>
                    <Th>Manufacturer</Th>
                    <Th>Scale</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {previewData.items.slice(0, 50).map((item) => (
                    <Tr key={item.mfcId} opacity={item.status === 'duplicate' && skipDuplicates ? 0.5 : 1}>
                      <Td>
                        <a
                          href={`https://myfigurecollection.net/item/${item.mfcId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--chakra-colors-blue-500)' }}
                        >
                          {item.mfcId}
                        </a>
                      </Td>
                      <Td maxW="200px" isTruncated title={item.cleanTitle}>
                        {item.cleanTitle}
                      </Td>
                      <Td>{item.manufacturers.join(', ') || '-'}</Td>
                      <Td>{item.scale || '-'}</Td>
                      <Td>{getStatusBadge(item.status)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>

          {previewData.items.length > 50 && (
            <Text fontSize="sm" color="gray.500" textAlign="center">
              Showing first 50 of {previewData.items.length} items
            </Text>
          )}
        </>
      )}
    </VStack>
  );

  const renderImportingStep = () => (
    <VStack spacing={4} py={8}>
      <Progress size="lg" isIndeterminate w="100%" colorScheme="green" />
      <Text>Importing figures...</Text>
    </VStack>
  );

  const renderCompleteStep = () => (
    <VStack spacing={4} align="stretch">
      {importResult && (
        <>
          <Alert status={importResult.errors.length > 0 ? 'warning' : 'success'}>
            <AlertIcon as={importResult.errors.length > 0 ? FaExclamationTriangle : FaCheckCircle} />
            <Box>
              <Text fontWeight="bold">Import Complete</Text>
              <Text fontSize="sm">
                Successfully imported {importResult.imported} figure(s)
                {importResult.skipped > 0 && `, skipped ${importResult.skipped} duplicate(s)`}
              </Text>
            </Box>
          </Alert>

          {importResult.errors.length > 0 && (
            <>
              <Text fontWeight="bold" color="red.500">
                Errors ({importResult.errors.length}):
              </Text>
              <Box maxH="200px" overflowY="auto" borderWidth={1} borderRadius="md" p={2}>
                {importResult.errors.map((error, index) => (
                  <Text key={index} fontSize="sm" color="red.600">
                    MFC #{error.mfcId}: {error.error}
                  </Text>
                ))}
              </Box>
            </>
          )}
        </>
      )}
    </VStack>
  );

  const renderStepContent = () => {
    switch (step) {
      case 'upload':
        return renderUploadStep();
      case 'preview':
        return renderPreviewStep();
      case 'importing':
        return renderImportingStep();
      case 'complete':
        return renderCompleteStep();
    }
  };

  const renderFooter = () => {
    switch (step) {
      case 'upload':
        return (
          <HStack spacing={3}>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handlePreview}
              isLoading={isLoading}
              leftIcon={<Icon as={FaFileImport} />}
            >
              Preview Import
            </Button>
          </HStack>
        );
      case 'preview':
        return (
          <HStack spacing={3}>
            <Button variant="ghost" onClick={() => setStep('upload')}>
              Back
            </Button>
            <Button
              colorScheme="green"
              onClick={handleImport}
              isLoading={isLoading}
              leftIcon={<Icon as={FaUpload} />}
              isDisabled={!previewData || (previewData.summary.new + previewData.summary.catalogExists === 0)}
            >
              Import {previewData ? (skipDuplicates
                ? previewData.summary.new + previewData.summary.catalogExists
                : previewData.totalItems) : 0} Figures
            </Button>
          </HStack>
        );
      case 'importing':
        return null;
      case 'complete':
        return (
          <Button colorScheme="blue" onClick={handleClose}>
            Close
          </Button>
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader>
          <HStack>
            <Icon as={FaFileImport} />
            <Text>Import from MyFigureCollection</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>{renderStepContent()}</ModalBody>
        <ModalFooter>{renderFooter()}</ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BulkImportModal;
