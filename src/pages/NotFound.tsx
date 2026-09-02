import React from 'react';
import { Link as RouterLink } from 'react-router';
import { Box, Heading, Text, Button, VStack, Icon } from '@chakra-ui/react';
import { FaExclamationTriangle, FaHome } from 'react-icons/fa';

const NotFound: React.FC = () => {
  return (
    <Box textAlign="center" py={10} px={6} minH="70vh" display="flex" alignItems="center" justifyContent="center">
      <VStack gap={6}>
        <Icon boxSize={20} color="orange.400" asChild><FaExclamationTriangle /></Icon>
        
        <Heading as="h1" size="2xl" mt={6} mb={2}>
          Page Not Found
        </Heading>
        
        <Text color="gray.600" fontSize="lg">
          The page you're looking for doesn't exist or has been moved.
        </Text>
        
        <Button colorPalette="brand" size="lg" mt={4} asChild><RouterLink to="/"><FaHome />Go to Dashboard
                              </RouterLink></Button>
      </VStack>
    </Box>
  );
};

export default NotFound;
