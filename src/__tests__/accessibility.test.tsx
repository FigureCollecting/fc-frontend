import React from 'react';
import { render } from '../test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Box, Heading, Text } from '@chakra-ui/react';
import Navbar from '../components/Navbar';

// Extend Jest expect to include accessibility checks
expect.extend(toHaveNoViolations);

// Mock auth store to provide authenticated user
jest.mock('../stores/authStore', () => ({
  useAuthStore: () => ({
    user: { id: '1', email: 'test@example.com', username: 'testuser' },
    setUser: jest.fn(),
    clearUser: jest.fn(),
  }),
}));

// Simple test component that doesn't require complex mocks
const SimpleAccessibilityTestComponent = () => (
  <Box>
    <Navbar />
    <Box as="main" role="main" p={4}>
      <Heading as="h1">Test Page</Heading>
      <Text>This is a test page for accessibility validation.</Text>
    </Box>
  </Box>
);

describe('Application Accessibility', () => {
  it('should have no accessibility violations on core components', async () => {
    const { container } = render(<SimpleAccessibilityTestComponent />);
    const results = await axe(container);
    
    expect(results).toHaveNoViolations();
  });
});
