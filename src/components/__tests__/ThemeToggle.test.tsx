import React from 'react';
import { render, screen, waitFor } from '../../test-utils';
import { fireEvent } from '@testing-library/react';
import ThemeToggle from '../ThemeToggle';
import { ChakraProvider } from '@chakra-ui/react';
import system from '../../theme';
import { act } from 'react-dom/test-utils';

// Mock scrollTo for Chakra Menu
beforeAll(() => {
  Element.prototype.scrollTo = jest.fn();
});

// Wrapper with Chakra provider for proper theme context
const ThemeWrapper = ({ children }: { children: React.ReactNode }) => (
  <ChakraProvider value={system}>{children}</ChakraProvider>
);

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should render theme selector button', () => {
    render(
      <ThemeWrapper>
        <ThemeToggle />
      </ThemeWrapper>
    );

    // Should have a menu button showing current theme
    const menuButton = screen.getByRole('button');
    expect(menuButton).toBeInTheDocument();
  });

  it('should display current theme label in button', () => {
    render(
      <ThemeWrapper>
        <ThemeToggle />
      </ThemeWrapper>
    );

    // Default theme is 'light' - the button should contain the text
    const menuButton = screen.getByRole('button');
    expect(menuButton).toHaveTextContent('Light');
  });

  it('should open menu when button is clicked', async () => {
    render(
      <ThemeWrapper>
        <ThemeToggle />
      </ThemeWrapper>
    );

    const menuButton = screen.getByRole('button');

    act(() => {
      fireEvent.click(menuButton);
    });

    // Menu should show all theme options
    await waitFor(() => {
      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByText('Terminal')).toBeInTheDocument();
      expect(screen.getByText('Tokyo Night')).toBeInTheDocument();
      expect(screen.getByText('Nord')).toBeInTheDocument();
      expect(screen.getByText('Dracula')).toBeInTheDocument();
      expect(screen.getByText('Solarized')).toBeInTheDocument();
      expect(screen.getByText('Cyberpunk')).toBeInTheDocument();
    });
  });

  it('should show theme descriptions in menu', async () => {
    render(
      <ThemeWrapper>
        <ThemeToggle />
      </ThemeWrapper>
    );

    const menuButton = screen.getByRole('button');

    act(() => {
      fireEvent.click(menuButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Easy on the eyes')).toBeInTheDocument();
      expect(screen.getByText('Downtown Tokyo at night')).toBeInTheDocument();
    });
  });

  it('should switch to dark mode when selected from menu', async () => {
    render(
      <ThemeWrapper>
        <ThemeToggle />
      </ThemeWrapper>
    );

    const menuButton = screen.getByRole('button');

    act(() => {
      fireEvent.click(menuButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Easy on the eyes')).toBeInTheDocument();
    });

    // Find and click the Dark menu item
    const darkOption = screen.getByText('Dark').closest('button');
    expect(darkOption).toBeInTheDocument();

    await act(async () => {
      if (darkOption) fireEvent.click(darkOption);
    });

    // localStorage should have been called to save preference
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('should switch to terminal mode when selected from menu', async () => {
    render(
      <ThemeWrapper>
        <ThemeToggle />
      </ThemeWrapper>
    );

    const menuButton = screen.getByRole('button');

    act(() => {
      fireEvent.click(menuButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Retro CRT with scanlines')).toBeInTheDocument();
    });

    // Find and click the Terminal menu item
    const terminalOption = screen.getByText('Terminal').closest('button');
    expect(terminalOption).toBeInTheDocument();

    await act(async () => {
      if (terminalOption) fireEvent.click(terminalOption);
    });

    // localStorage should have been called to save preference
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('should be keyboard accessible', () => {
    render(
      <ThemeWrapper>
        <ThemeToggle />
      </ThemeWrapper>
    );

    const menuButton = screen.getByRole('button');
    expect(menuButton).toHaveAttribute('type', 'button');
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes on menu button', () => {
      render(
        <ThemeWrapper>
          <ThemeToggle />
        </ThemeWrapper>
      );

      const menuButton = screen.getByRole('button');
      expect(menuButton).toHaveAttribute('type', 'button');
      expect(menuButton).toHaveAttribute('aria-expanded');
    });

    it('should be focusable', () => {
      render(
        <ThemeWrapper>
          <ThemeToggle />
        </ThemeWrapper>
      );

      const menuButton = screen.getByRole('button');
      menuButton.focus();
      expect(menuButton).toHaveFocus();
    });

    it('should have all 8 theme options', async () => {
      render(
        <ThemeWrapper>
          <ThemeToggle />
        </ThemeWrapper>
      );

      const menuButton = screen.getByRole('button');

      act(() => {
        fireEvent.click(menuButton);
      });

      await waitFor(() => {
        // Verify all 8 themes are available
        const menuItems = screen.getAllByRole('menuitem');
        expect(menuItems).toHaveLength(8);
      });
    });
  });
});
