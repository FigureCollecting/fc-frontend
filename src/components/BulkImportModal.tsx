import React, { useState, useCallback } from 'react';
import { useColorModeValue } from "./ui/color-mode";
import { Button,
  VStack,
  HStack,
  Text,
  Textarea,
  Progress,
  Badge,
  Box,
  Table,
  Alert,
  Stat,
  Input,
  Switch,
  Icon,
  Separator,
  Field,
  Dialog,
  Portal,
} from '@chakra-ui/react';
import { toaster } from './ui/toaster';
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
      toaster.create({
        title: 'No content',
        description: 'Please paste CSV content or upload a file',
        type: 'warning',
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
      toaster.create({
        title: 'Preview failed',
        description: message,
        type: 'error',
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

      toaster.create({
        title: 'Import successful',
        description: `Imported ${result.imported} figures${result.skipped > 0 ? `, skipped ${result.skipped} duplicates` : ''}`,
        type: 'success',
        duration: 5000,
      });

      if (result.imported > 0) {
        onImportComplete();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Import failed';
      toaster.create({
        title: 'Import failed',
        description: message,
        type: 'error',
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
        return <Badge colorPalette="green">New</Badge>;
      case 'catalog_exists':
        return <Badge colorPalette="blue">In Catalog</Badge>;
      case 'duplicate':
        return <Badge colorPalette="orange">Already Owned</Badge>;
    }
  };

  const renderUploadStep = () => (
    <VStack gap={4} align="stretch">
      <Alert.Root status="info">
        <Alert.Indicator />
        <Text fontSize="sm">
          Export your collection from MyFigureCollection.net and paste the CSV content below,
          or upload the CSV file directly.
        </Text>
      </Alert.Root>

      <Field.Root>
        <Field.Label>Upload CSV File</Field.Label>
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          p={1}
        />
      </Field.Root>

      <Text textAlign="center" color="gray.500">- OR -</Text>

      <Field.Root>
        <Field.Label>Paste CSV Content</Field.Label>
        <Textarea
          placeholder="Paste your MFC CSV export here..."
          value={csvContent}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCsvContent(e.target.value)}
          minH="200px"
          fontFamily="mono"
          fontSize="sm"
        />
      </Field.Root>
    </VStack>
  );

  const renderPreviewStep = () => (
    <VStack gap={4} align="stretch">
      {previewData && (
        <>
          <Stat.Root>
            <Stat.Root>
              <Stat.Label>New Items</Stat.Label>
              <Stat.ValueText color="green.500">{previewData.summary.new}</Stat.ValueText>
            </Stat.Root>
            <Stat.Root>
              <Stat.Label>In Catalog</Stat.Label>
              <Stat.ValueText color="blue.500">{previewData.summary.catalogExists}</Stat.ValueText>
            </Stat.Root>
            <Stat.Root>
              <Stat.Label>Already Owned</Stat.Label>
              <Stat.ValueText color="orange.500">{previewData.summary.duplicates}</Stat.ValueText>
            </Stat.Root>
            <Stat.Root>
              <Stat.Label>Total</Stat.Label>
              <Stat.ValueText>{previewData.totalItems}</Stat.ValueText>
            </Stat.Root>
          </Stat.Root>

          <Separator />

          <Field.Root display="flex" alignItems="center">
            <Field.Label mb="0">Skip duplicates (already owned items)</Field.Label>
            <Switch.Root
              checked={skipDuplicates}
              onCheckedChange={(e) => setSkipDuplicates(e.checked)}
              colorPalette="green"
            >
              <Switch.HiddenInput />
              <Switch.Control />
            </Switch.Root>
          </Field.Root>

          {previewData.summary.duplicates > 0 && skipDuplicates && (
            <Alert.Root status="info" size="sm">
              <Alert.Indicator />
              <Text fontSize="sm">
                {previewData.summary.duplicates} duplicate(s) will be skipped during import.
              </Text>
            </Alert.Root>
          )}

          <Box maxH="300px" overflowY="auto" borderWidth={1} borderRadius="md" borderColor={borderColor}>
            <Table.ScrollArea>
              <Table.Root size="sm">
                <Table.Header position="sticky" top={0} bg={bgColor}>
                  <Table.Row>
                    <Table.ColumnHeader>MFC ID</Table.ColumnHeader>
                    <Table.ColumnHeader>Title</Table.ColumnHeader>
                    <Table.ColumnHeader>Manufacturer</Table.ColumnHeader>
                    <Table.ColumnHeader>Scale</Table.ColumnHeader>
                    <Table.ColumnHeader>Status</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {previewData.items.slice(0, 50).map((item) => (
                    <Table.Row key={item.mfcId} opacity={item.status === 'duplicate' && skipDuplicates ? 0.5 : 1}>
                      <Table.Cell>
                        <a
                          href={`https://myfigurecollection.net/item/${item.mfcId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--chakra-colors-blue-500)' }}
                        >
                          {item.mfcId}
                        </a>
                      </Table.Cell>
                      <Table.Cell maxW="200px" truncate title={item.cleanTitle}>
                        {item.cleanTitle}
                      </Table.Cell>
                      <Table.Cell>{item.manufacturers.join(', ') || '-'}</Table.Cell>
                      <Table.Cell>{item.scale || '-'}</Table.Cell>
                      <Table.Cell>{getStatusBadge(item.status)}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Table.ScrollArea>
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
    <VStack gap={4} py={8}>
      <Progress.Root size="lg" value={null} w="100%" colorPalette="green">
        <Progress.Track>
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>
      <Text>Importing figures...</Text>
    </VStack>
  );

  const renderCompleteStep = () => (
    <VStack gap={4} align="stretch">
      {importResult && (
        <>
          <Alert.Root status={importResult.errors.length > 0 ? 'warning' : 'success'}>
            <Alert.Indicator as={importResult.errors.length > 0 ? FaExclamationTriangle : FaCheckCircle} />
            <Box>
              <Text fontWeight="bold">Import Complete</Text>
              <Text fontSize="sm">
                Successfully imported {importResult.imported} figure(s)
                {importResult.skipped > 0 && `, skipped ${importResult.skipped} duplicate(s)`}
              </Text>
            </Box>
          </Alert.Root>

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
          <HStack gap={3}>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button colorPalette="blue" onClick={handlePreview} loading={isLoading}><Icon as={FaFileImport} />Preview Import
                          </Button>
          </HStack>
        );
      case 'preview':
        return (
          <HStack gap={3}>
            <Button variant="ghost" onClick={() => setStep('upload')}>
              Back
            </Button>
            <Button
              colorPalette="green"
              onClick={handleImport}
              loading={isLoading}
              disabled={!previewData || (previewData.summary.new + previewData.summary.catalogExists === 0)}><Icon as={FaUpload} />Import {previewData ? (skipDuplicates
                  ? previewData.summary.new + previewData.summary.catalogExists
                  : previewData.totalItems) : 0}Figures
                          </Button>
          </HStack>
        );
      case 'importing':
        return null;
      case 'complete':
        return (
          <Button colorPalette="blue" onClick={handleClose}>Close
                      </Button>
        );
    }
  };

  return (
    <Dialog.Root open={isOpen} size='xl' scrollBehavior="inside" onOpenChange={e => {
      if (!e.open) {
        handleClose();
      }
    }}>
      <Portal>

        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg={bgColor}>
            <Dialog.Header>
              <HStack>
                <Icon as={FaFileImport} />
                <Text>Import from MyFigureCollection</Text>
              </HStack>
            </Dialog.Header>
            <Dialog.CloseTrigger />
            <Dialog.Body>{renderStepContent()}</Dialog.Body>
            <Dialog.Footer>{renderFooter()}</Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>

      </Portal>
    </Dialog.Root>
  );
};

export default BulkImportModal;
