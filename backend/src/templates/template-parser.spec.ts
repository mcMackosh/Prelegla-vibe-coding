import * as fs from 'fs';
import * as path from 'path';
import { parseTemplate } from './template-parser';

const TEMPLATES_DIR = path.resolve(__dirname, '../../../templates');

const ALL_TEMPLATE_FILES = [
  'AI-Addendum.md',
  'BAA.md',
  'CSA.md',
  'Design-Partner-Agreement.md',
  'DPA.md',
  'Mutual-NDA.md',
  'Partnership-Agreement.md',
  'Pilot-Agreement.md',
  'PSA.md',
  'SLA.md',
  'Software-License-Agreement.md',
];

function countClauses(clauses: { children: unknown[] }[]): number {
  return clauses.reduce(
    (total, clause) =>
      total + 1 + countClauses(clause.children as { children: unknown[] }[]),
    0,
  );
}

describe('parseTemplate against every real template file', () => {
  it.each(ALL_TEMPLATE_FILES)(
    'parses %s without throwing and produces clauses + fields',
    (file) => {
      const raw = fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf-8');

      const result = parseTemplate(raw);

      expect(result.clauses.length).toBeGreaterThan(0);
      expect(countClauses(result.clauses)).toBeGreaterThan(0);
      expect(result.fields.length).toBeGreaterThan(0);
      // Every field must have a non-empty label and a valid identifier-like key.
      for (const field of result.fields) {
        expect(field.label.length).toBeGreaterThan(0);
        expect(field.key).toMatch(/^[a-z][a-zA-Z0-9]*$/);
      }
    },
  );

  // Only Mutual-NDA.md has a standalone trailing attribution paragraph outside the
  // numbered list (see its dedicated describe block below). The other 10 templates
  // fold the same "Common Paper ... Version X.Y ... CC BY 4.0" reference into an
  // ordinary "Standard Terms" definition clause instead — which still renders a real
  // hyperlink, just via the normal clause body rather than a separate attribution field.
  it('has no separate attribution paragraph for templates other than Mutual-NDA', () => {
    for (const file of ALL_TEMPLATE_FILES.filter(
      (f) => f !== 'Mutual-NDA.md',
    )) {
      const raw = fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf-8');
      const result = parseTemplate(raw);
      expect(result.attribution).toEqual([]);
    }
  });
});

describe('parseTemplate against Mutual-NDA.md specifically', () => {
  const raw = fs.readFileSync(
    path.join(TEMPLATES_DIR, 'Mutual-NDA.md'),
    'utf-8',
  );
  const result = parseTemplate(raw);

  it('parses exactly the 11 flat top-level clauses with no nested children', () => {
    expect(result.clauses).toHaveLength(11);
    for (const clause of result.clauses) {
      expect(clause.children).toHaveLength(0);
    }
  });

  it('extracts a bold-leading title for each clause (no header spans in this doc)', () => {
    expect(result.clauses[0].title).toBe('Introduction');
    expect(result.clauses[4].title).toBe('Term and Termination');
    expect(result.clauses[8].title).toBe('Governing Law and Jurisdiction');
  });

  it('extracts exactly the six known coverpage_link fields', () => {
    const keys = result.fields.map((f) => f.key).sort();
    expect(keys).toEqual(
      [
        'purpose',
        'effectiveDate',
        'mndaTerm',
        'termOfConfidentiality',
        'governingLaw',
        'jurisdiction',
      ].sort(),
    );
  });

  it('renders the Introduction clause body with field segments for purpose', () => {
    const introBody = result.clauses[0].body;
    const fieldSegments = introBody.filter((s) => s.type === 'field');
    expect(
      fieldSegments.some((s) => s.type === 'field' && s.key === 'purpose'),
    ).toBe(true);
  });

  it('does not turn quoted defined terms like "MNDA" into fields', () => {
    expect(result.fields.some((f) => f.label === 'MNDA')).toBe(false);
    expect(result.fields.some((f) => f.label === 'Disclosing Party')).toBe(
      false,
    );
  });

  it('extracts the CC BY attribution with a real hyperlink', () => {
    const linkSegment = result.attribution.find((s) => s.type === 'link');
    expect(linkSegment).toBeDefined();
  });
});

describe('parseTemplate against a document with nested nested lists (PSA.md)', () => {
  const raw = fs.readFileSync(path.join(TEMPLATES_DIR, 'PSA.md'), 'utf-8');
  const result = parseTemplate(raw);

  it('builds a nested clause tree (top-level sections containing sub-clauses)', () => {
    expect(result.clauses.length).toBeGreaterThan(0);
    const withChildren = result.clauses.filter((c) => c.children.length > 0);
    expect(withChildren.length).toBeGreaterThan(0);
  });

  it('extracts party fields shared across sow_link and keyterms_link spans', () => {
    const labels = result.fields.map((f) => f.label);
    expect(labels).toContain('Customer');
    expect(labels).toContain('Provider');
  });
});
