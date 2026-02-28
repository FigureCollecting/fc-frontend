import React from 'react';
import { Box, Heading, SimpleGrid, Code, Button, VStack, Alert, AlertIcon, useClipboard } from '@chakra-ui/react';

interface BackupCodesDisplayProps {
  codes: string[];
}

const BackupCodesDisplay: React.FC<BackupCodesDisplayProps> = ({ codes }) => {
  const codeText = codes.join('\n');
  const { hasCopied, onCopy } = useClipboard(codeText);

  const handleDownload = () => {
    const blob = new Blob([`FigureCollecting Backup Codes\n${'='.repeat(30)}\n\n${codeText}\n\nStore these codes in a safe place.\nEach code can only be used once.`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'figurecollecting-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <VStack spacing={4} align="stretch">
      <Heading size="sm">Backup Codes</Heading>
      <Alert status="warning" borderRadius="md">
        <AlertIcon />
        Save these codes in a safe place. Each code can only be used once.
      </Alert>
      <SimpleGrid columns={2} spacing={2}>
        {codes.map((code, i) => (
          <Code key={i} p={2} textAlign="center" fontSize="md">
            {code}
          </Code>
        ))}
      </SimpleGrid>
      <Box>
        <Button size="sm" mr={2} onClick={onCopy}>
          {hasCopied ? 'Copied!' : 'Copy All'}
        </Button>
        <Button size="sm" variant="outline" onClick={handleDownload}>
          Download
        </Button>
      </Box>
    </VStack>
  );
};

export default BackupCodesDisplay;
