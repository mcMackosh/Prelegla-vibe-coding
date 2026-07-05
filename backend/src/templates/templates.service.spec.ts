import { NotFoundException } from '@nestjs/common';
import { TemplatesService } from './templates.service';

describe('TemplatesService', () => {
  let service: TemplatesService;

  beforeEach(() => {
    service = new TemplatesService();
    service.onModuleInit();
  });

  it('lists all 11 document types from catalog.json', () => {
    const types = service.listDocumentTypes();
    expect(types).toHaveLength(11);
    expect(types.map((t) => t.id)).toContain('mutual-nda');
  });

  it('returns clauses and fields for a known document type', () => {
    const detail = service.getDocumentType('mutual-nda');
    expect(detail.id).toBe('mutual-nda');
    expect(detail.clauses.length).toBeGreaterThan(0);
    expect(detail.fields.length).toBeGreaterThan(0);
  });

  it('caches the parsed template across repeated calls', () => {
    const first = service.getDocumentType('mutual-nda');
    const second = service.getDocumentType('mutual-nda');
    expect(first.clauses).toBe(second.clauses);
  });

  it('throws NotFoundException for an unknown document type id', () => {
    expect(() => service.getDocumentType('not-a-real-type')).toThrow(
      NotFoundException,
    );
  });

  it('successfully parses every document type in the catalog', () => {
    for (const { id } of service.listDocumentTypes()) {
      const detail = service.getDocumentType(id);
      expect(detail.clauses.length).toBeGreaterThan(0);
      expect(detail.fields.length).toBeGreaterThan(0);
    }
  });
});
