/**
 * Tests for FigureForm barrel exports
 */
import FigureFormMain, {
  CoreFieldsSection,
  CollectionDetailsSection,
  CatalogPurchaseSection,
  CompanyRolesSection,
  ArtistRolesSection,
  ReleasesSection,
} from '../index';

describe('FigureForm barrel exports', () => {
  it('should export FigureFormMain as default', () => {
    expect(FigureFormMain).toBeDefined();
  });

  it('should export CoreFieldsSection', () => {
    expect(CoreFieldsSection).toBeDefined();
  });

  it('should export CollectionDetailsSection', () => {
    expect(CollectionDetailsSection).toBeDefined();
  });

  it('should export CatalogPurchaseSection', () => {
    expect(CatalogPurchaseSection).toBeDefined();
  });

  it('should export CompanyRolesSection', () => {
    expect(CompanyRolesSection).toBeDefined();
  });

  it('should export ArtistRolesSection', () => {
    expect(ArtistRolesSection).toBeDefined();
  });

  it('should export ReleasesSection', () => {
    expect(ReleasesSection).toBeDefined();
  });
});
