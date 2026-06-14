/**
 * Comprehensive tests for Layout component
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import Layout from '../Layout';

// Mock package.json to have consistent test data
jest.mock('../../../package.json', () => ({
  name: 'fc-frontend',
  version: '2.1.0-test'
}));

// Mock child components
jest.mock('../Navbar', () => {
  return function Navbar() {
    return <div data-testid="mock-navbar">Navbar</div>;
  };
});

jest.mock('../Sidebar', () => {
  return function Sidebar() {
    return <div data-testid="mock-sidebar">Sidebar</div>;
  };
});

// Mock Outlet from react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Outlet: () => <div data-testid="mock-outlet">Page Content</div>,
}));

// Mock fetch
global.fetch = jest.fn();

const renderLayout = () => {
  return render(
    <ChakraProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </ChakraProvider>
  );
};

describe('Layout Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Basic rendering', () => {
    it('should render basic layout structure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          services: {
            backend: { service: 'backend', version: '2.1.0', status: 'healthy' },
            scraper: { service: 'scraper', version: '2.0.3', status: 'healthy' }
          }
        }),
        ok: true
      });

      renderLayout();

      expect(screen.getByTestId('layout')).toBeInTheDocument();
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Version fetching', () => {
    it('should fetch version info on mount', async () => {
      const mockVersionData = {
        services: {
          backend: { service: 'backend', version: '2.1.0', status: 'healthy' },
          scraper: { service: 'scraper', version: '2.0.3', status: 'healthy' }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockVersionData,
        ok: true
      });

      renderLayout();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/version');
      });
    });

    it('should add frontend version to fetched data', async () => {
      const mockVersionData = {
        services: {
          backend: { service: 'backend', version: '2.1.0', status: 'healthy' },
          scraper: { service: 'scraper', version: '2.0.3', status: 'healthy' }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockVersionData,
        ok: true
      });

      renderLayout();

      await waitFor(() => {
        expect(screen.getByText('FigureCollecting')).toBeInTheDocument();
      });
    });

    it('should handle version fetch failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      renderLayout();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/version');
      });

      // Layout should still render even if version fetch fails
      expect(screen.getByTestId('layout')).toBeInTheDocument();
    });

    it('should handle HTTP error responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      renderLayout();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/version');
      });

      // Layout should still render
      expect(screen.getByTestId('layout')).toBeInTheDocument();
    });
  });

  describe('Version display', () => {
    it('should display version popover on hover', async () => {
      const mockVersionData = {
        services: {
          backend: { service: 'backend', version: '2.1.0', status: 'healthy' },
          scraper: { service: 'scraper', version: '2.0.3', status: 'healthy' }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockVersionData,
        ok: true
      });

      renderLayout();

      await waitFor(() => {
        expect(screen.getByText('FigureCollecting')).toBeInTheDocument();
      });

      const versionTrigger = screen.getByText('FigureCollecting');
      fireEvent.mouseEnter(versionTrigger);

      await waitFor(() => {
        expect(screen.getByText('Service Versions')).toBeInTheDocument();
      });
    });

    it('should display service status badges', async () => {
      const mockVersionData = {
        services: {
          backend: { service: 'backend', version: '2.1.0', status: 'healthy' },
          scraper: { service: 'scraper', version: 'unknown', status: 'unavailable' }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockVersionData,
        ok: true
      });

      renderLayout();

      await waitFor(() => {
        const versionTrigger = screen.getByText('FigureCollecting');
        fireEvent.mouseEnter(versionTrigger);
      });

      await waitFor(() => {
        expect(screen.getByText('Frontend:')).toBeInTheDocument();
        expect(screen.getByText('Backend:')).toBeInTheDocument();
        expect(screen.getByText('Scraper:')).toBeInTheDocument();
      });
    });
  });

  describe('Child components rendering', () => {
    it('should render navbar, sidebar, and outlet', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ services: {} }),
        ok: true
      });

      renderLayout();

      expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
      expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('mock-outlet')).toBeInTheDocument();
    });
  });
});
