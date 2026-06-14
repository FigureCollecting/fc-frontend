/*
 MIGRATION NOTE: The following Chakra UI hooks have been removed.
 Please replace them with the suggested alternatives:

//   - useClipboard: Use react-use: useCopyToClipboard

 See: https://chakra-ui.com/docs/get-started/migration#hooks
*/
import React from 'react';
import { Steps, Box, Heading, SimpleGrid, Code, Button, VStack, Alert } from '@chakra-ui/react';

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
    <VStack gap={4} align="stretch">
      <Heading size="sm">Backup Codes</Heading>
      <Alert.Root status="warning" borderRadius="md">
        <Alert.Indicator />
        Save these codes in a safe place. Each code can only be used once.
      </Alert.Root>
      <SimpleGrid columns={2} gap={2}>
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
