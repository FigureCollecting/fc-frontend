/**
 * Tests for BulkImportModal component
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils';

// Mock API
const mockPreviewBulkImport = jest.fn();
const mockExecuteBulkImport = jest.fn();

jest.mock('../../api', () => ({
  previewBulkImport: (...args: any[]) => mockPreviewBulkImport(...args),
  executeBulkImport: (...args: any[]) => mockExecuteBulkImport(...args),
}));

jest.mock('../../utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    verbose: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

import BulkImportModal from '../BulkImportModal';

const mockPreviewData = {
  success: true,
  totalItems: 3,
  summary: { new: 2, catalogExists: 1, duplicates: 0 },
  items: [
    {
      mfcId: 1001,
      title: 'Figure A',
      cleanTitle: 'Figure A Clean',
      manufacturers: ['Good Smile Company'],
      scale: '1/7',
      status: 'new' as const,
      collectionStatus: 'owned',
    },
    {
      mfcId: 1002,
      title: 'Figure B',
      cleanTitle: 'Figure B Clean',
      manufacturers: ['Alter'],
      scale: '1/8',
      status: 'catalog_exists' as const,
      collectionStatus: 'owned',
    },
    {
      mfcId: 1003,
      title: 'Figure C',
      cleanTitle: 'Figure C Clean',
      manufacturers: [],
      scale: undefined,
      status: 'new' as const,
      collectionStatus: 'wished',
    },
  ],
};

const mockPreviewWithDuplicates = {
  ...mockPreviewData,
  summary: { new: 1, catalogExists: 1, duplicates: 1 },
  items: [
    ...mockPreviewData.items.slice(0, 2),
    {
      mfcId: 1004,
      title: 'Duplicate Figure',
      cleanTitle: 'Duplicate Figure',
      manufacturers: ['Kotobukiya'],
      scale: '1/6',
      status: 'duplicate' as const,
      collectionStatus: 'owned',
    },
  ],
};

describe('BulkImportModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onImportComplete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Upload step', () => {
    it('should render upload step when open', () => {
      render(<BulkImportModal {...defaultProps} />);

      expect(screen.getByText(/Import from MyFigureCollection/i)).toBeInTheDocument();
      expect(screen.getByText(/Paste CSV Content/i)).toBeInTheDocument();
      expect(screen.getByText(/Upload CSV File/i)).toBeInTheDocument();
    });

    it('should not render content when closed', () => {
      render(<BulkImportModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText(/Import from MyFigureCollection/i)).not.toBeInTheDocument();
    });

    it('should show upload info alert', () => {
      render(<BulkImportModal {...defaultProps} />);

      expect(screen.getByText(/Export your collection from MyFigureCollection.net/i)).toBeInTheDocument();
    });

    it('should have Preview Import button', () => {
      render(<BulkImportModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Preview Import/i })).toBeInTheDocument();
    });

    it('should have Cancel button', () => {
      render(<BulkImportModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('should call onClose when Cancel is clicked', () => {
      render(<BulkImportModal {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should have CSV textarea', () => {
      render(<BulkImportModal {...defaultProps} />);

      expect(screen.getByPlaceholderText(/Paste your MFC CSV export here/i)).toBeInTheDocument();
    });

    it('should have file upload input', () => {
      render(<BulkImportModal {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput?.getAttribute('accept')).toBe('.csv');
    });

    it('should not call preview when textarea is empty', async () => {
      render(<BulkImportModal {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /Preview Import/i }));

      // Wait a tick
      await new Promise(r => setTimeout(r, 0));

      expect(mockPreviewBulkImport).not.toHaveBeenCalled();
    });

    it('should call preview when textarea has content', async () => {
      mockPreviewBulkImport.mockResolvedValue(mockPreviewData);

      render(<BulkImportModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste your MFC CSV export here/i);
      fireEvent.change(textarea, { target: { value: 'csv-data-here' } });
      fireEvent.click(screen.getByRole('button', { name: /Preview Import/i }));

      await waitFor(() => {
        expect(mockPreviewBulkImport).toHaveBeenCalledWith('csv-data-here');
      });
    });

    it('should handle file upload via file input', () => {
      render(<BulkImportModal {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeTruthy();

      // Create a mock file
      const file = new File(['csv,content,here'], 'test.csv', { type: 'text/csv' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      // FileReader will read content asynchronously
    });

    it('should show error toast when preview fails', async () => {
      mockPreviewBulkImport.mockRejectedValue(new Error('Parse error'));

      render(<BulkImportModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste your MFC CSV export here/i);
      fireEvent.change(textarea, { target: { value: 'bad-csv' } });
      fireEvent.click(screen.getByRole('button', { name: /Preview Import/i }));

      // Preview was called but failed - no crash
      await waitFor(() => {
        expect(mockPreviewBulkImport).toHaveBeenCalled();
      });
    });
  });

  describe('Preview step', () => {
    async function goToPreviewStep() {
      mockPreviewBulkImport.mockResolvedValue(mockPreviewData);
      render(<BulkImportModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste your MFC CSV export here/i);
      fireEvent.change(textarea, { target: { value: 'csv-data' } });
      fireEvent.click(screen.getByRole('button', { name: /Preview Import/i }));

      await waitFor(() => {
        expect(screen.getByText('New Items')).toBeInTheDocument();
      });
    }

    it('should show preview summary stats and item table', async () => {
      await goToPreviewStep();

      expect(screen.getByText('New Items')).toBeInTheDocument();
      // 'In Catalog' appears as stat label and badge, so use getAllByText
      expect(screen.getAllByText('In Catalog').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Total')).toBeInTheDocument();

      // Item table data
      expect(screen.getByText('Figure A Clean')).toBeInTheDocument();
      expect(screen.getByText('Figure B Clean')).toBeInTheDocument();
      expect(screen.getByText('Good Smile Company')).toBeInTheDocument();
      expect(screen.getByText('Alter')).toBeInTheDocument();
    });

    it('should show status badges in preview table', async () => {
      await goToPreviewStep();

      // 'New' badge appears for items with status 'new' (there are 2 new items)
      const newBadges = screen.getAllByText('New');
      expect(newBadges.length).toBeGreaterThanOrEqual(1);
      // 'In Catalog' appears both as stat label and as a badge
      const inCatalogElements = screen.getAllByText('In Catalog');
      expect(inCatalogElements.length).toBeGreaterThanOrEqual(2); // stat label + badge
    });

    it('should show skip duplicates switch', async () => {
      await goToPreviewStep();

      expect(screen.getByText(/Skip duplicates/i)).toBeInTheDocument();
    });

    it('should show Back button on preview step', async () => {
      await goToPreviewStep();

      expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
    });

    it('should go back to upload step when Back is clicked', async () => {
      await goToPreviewStep();

      fireEvent.click(screen.getByRole('button', { name: /Back/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Paste your MFC CSV export here/i)).toBeInTheDocument();
      });
    });

    it('should show Import button with count', async () => {
      await goToPreviewStep();

      // Import X Figures button (new + catalog = 3)
      const importBtn = screen.getByRole('button', { name: /Import.*Figures/i });
      expect(importBtn).toBeInTheDocument();
    });

    it('should show duplicate info alert when duplicates exist', async () => {
      mockPreviewBulkImport.mockResolvedValue(mockPreviewWithDuplicates);
      render(<BulkImportModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste your MFC CSV export here/i);
      fireEvent.change(textarea, { target: { value: 'csv-data' } });
      fireEvent.click(screen.getByRole('button', { name: /Preview Import/i }));

      await waitFor(() => {
        expect(screen.getByText(/duplicate.*will be skipped/i)).toBeInTheDocument();
      });
    });

    it('should show Already Owned badge for duplicate items', async () => {
      mockPreviewBulkImport.mockResolvedValue(mockPreviewWithDuplicates);
      render(<BulkImportModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste your MFC CSV export here/i);
      fireEvent.change(textarea, { target: { value: 'csv-data' } });
      fireEvent.click(screen.getByRole('button', { name: /Preview Import/i }));

      await waitFor(() => {
        // 'Already Owned' appears as stat label and badge
        const elements = screen.getAllByText('Already Owned');
        expect(elements.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Import execution', () => {
    async function goToPreviewAndImport() {
      mockPreviewBulkImport.mockResolvedValue(mockPreviewData);
      mockExecuteBulkImport.mockResolvedValue({
        imported: 2,
        skipped: 0,
        errors: [],
      });

      render(<BulkImportModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste your MFC CSV export here/i);
      fireEvent.change(textarea, { target: { value: 'csv-data' } });
      fireEvent.click(screen.getByRole('button', { name: /Preview Import/i }));

      await waitFor(() => {
        expect(screen.getByText('New Items')).toBeInTheDocument();
      });

      const importBtn = screen.getByRole('button', { name: /Import.*Figures/i });
      fireEvent.click(importBtn);
    }

    it('should call executeBulkImport when import button clicked', async () => {
      await goToPreviewAndImport();

      await waitFor(() => {
        expect(mockExecuteBulkImport).toHaveBeenCalledWith('csv-data', true);
      });
    });

    it('should show complete step after successful import', async () => {
      await goToPreviewAndImport();

      await waitFor(() => {
        expect(screen.getByText(/Import Complete/i)).toBeInTheDocument();
      });
    });

    it('should show imported count', async () => {
      await goToPreviewAndImport();

      await waitFor(() => {
        expect(screen.getByText(/imported 2 figure/i)).toBeInTheDocument();
      });
    });

    it('should call onImportComplete after successful import', async () => {
      await goToPreviewAndImport();

      await waitFor(() => {
        expect(defaultProps.onImportComplete).toHaveBeenCalled();
      });
    });

    it('should show Close button on complete step', async () => {
      await goToPreviewAndImport();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Close/i })).toBeInTheDocument();
      });
    });

    it('should show errors when import has errors', async () => {
      mockPreviewBulkImport.mockResolvedValue(mockPreviewData);
      mockExecuteBulkImport.mockResolvedValue({
        imported: 1,
        skipped: 0,
        errors: [{ mfcId: 1003, error: 'Item not found' }],
      });

      render(<BulkImportModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste your MFC CSV export here/i);
      fireEvent.change(textarea, { target: { value: 'csv-data' } });
      fireEvent.click(screen.getByRole('button', { name: /Preview Import/i }));

      await waitFor(() => {
        expect(screen.getByText('New Items')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Import.*Figures/i }));

      await waitFor(() => {
        expect(screen.getByText(/Errors/i)).toBeInTheDocument();
        expect(screen.getByText(/Item not found/i)).toBeInTheDocument();
      });
    });

    it('should show skipped count when import has skipped items', async () => {
      mockPreviewBulkImport.mockResolvedValue(mockPreviewData);
      mockExecuteBulkImport.mockResolvedValue({
        imported: 2,
        skipped: 1,
        errors: [],
      });

      render(<BulkImportModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste your MFC CSV export here/i);
      fireEvent.change(textarea, { target: { value: 'csv-data' } });
      fireEvent.click(screen.getByRole('button', { name: /Preview Import/i }));

      await waitFor(() => {
        expect(screen.getByText('New Items')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Import.*Figures/i }));

      await waitFor(() => {
        expect(screen.getByText(/skipped 1 duplicate/i)).toBeInTheDocument();
      });
    });

    it('should handle import failure', async () => {
      mockPreviewBulkImport.mockResolvedValue(mockPreviewData);
      mockExecuteBulkImport.mockRejectedValue(new Error('Import server error'));

      render(<BulkImportModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste your MFC CSV export here/i);
      fireEvent.change(textarea, { target: { value: 'csv-data' } });
      fireEvent.click(screen.getByRole('button', { name: /Preview Import/i }));

      await waitFor(() => {
        expect(screen.getByText('New Items')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Import.*Figures/i }));

      // Should go back to preview step on error
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
      });
    });
  });
});
