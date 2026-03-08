import { describe, it, expect } from 'vitest';
import { submissionsApi, calculateEmissions } from '@/lib/submissions';
import type { Submission } from '@/lib/submissions';

describe('submissionsApi.exportCSV', () => {
  const mockSubmissions: Submission[] = [
    {
      id: '1', created_at: '2026-01-15T10:00:00Z', user_id: 'u1', organization_id: null,
      electricity: 1000, gas: 500, fuel: 200, waste: 100, water: 50,
      total_emissions: 2015, status: 'approved', file_url: null, audit_hash: null,
      verified_at: null, reviewed_by: null, revision_notes: null,
      period_start: '2026-01-01', period_end: '2026-01-31',
      supplier_name: 'Acme Corp',
    },
    {
      id: '2', created_at: '2026-02-10T10:00:00Z', user_id: 'u2', organization_id: null,
      electricity: 500, gas: 250, fuel: 100, waste: 50, water: 25,
      total_emissions: 1010, status: 'pending', file_url: null, audit_hash: null,
      verified_at: null, reviewed_by: null, revision_notes: null,
      period_start: null, period_end: null,
      supplier_name: undefined,
    },
  ];

  it('generates correct CSV headers', () => {
    const csv = submissionsApi.exportCSV(mockSubmissions);
    const headers = csv.split('\n')[0];
    expect(headers).toContain('Electricity (kWh)');
    expect(headers).toContain('Water (m³)');
    expect(headers).toContain('Status');
    expect(headers).toContain('Period Start');
  });

  it('generates correct number of rows', () => {
    const csv = submissionsApi.exportCSV(mockSubmissions);
    const lines = csv.split('\n');
    expect(lines.length).toBe(3); // header + 2 data rows
  });

  it('handles missing supplier name', () => {
    const csv = submissionsApi.exportCSV(mockSubmissions);
    const lines = csv.split('\n');
    expect(lines[2]).toContain('Unknown');
  });

  it('handles empty array', () => {
    const csv = submissionsApi.exportCSV([]);
    const lines = csv.split('\n');
    expect(lines.length).toBe(1); // header only
  });

  it('includes period data when available', () => {
    const csv = submissionsApi.exportCSV(mockSubmissions);
    expect(csv).toContain('2026-01-01');
    expect(csv).toContain('2026-01-31');
  });
});

describe('calculateEmissions (dynamic factors)', () => {
  const defaultFactors = { electricity: 0.256, gas: 1.93, fuel: 2.51, waste: 0.47, water: 0.149 };

  it('calculates total emissions with default factors', () => {
    const data = { electricity: 1000, gas: 500, fuel: 200, waste: 100, water: 50 };
    // 500 + 1000 + 500 + 30 + 5 = 2035
    expect(calculateEmissions(data, defaultFactors)).toBe(2035);
  });

  it('handles zero input', () => {
    const data = { electricity: 0, gas: 0, fuel: 0, waste: 0, water: 0 };
    expect(calculateEmissions(data, defaultFactors)).toBe(0);
  });

  it('handles large values without overflow', () => {
    const data = { electricity: 1000000, gas: 100000, fuel: 50000, waste: 10000, water: 100000 };
    const total = calculateEmissions(data, defaultFactors);
    expect(total).toBeGreaterThan(0);
    expect(Number.isFinite(total)).toBe(true);
  });

  it('uses custom factors correctly', () => {
    const customFactors = { electricity: 0.3, gas: 1.5, fuel: 2.0, waste: 0.2, water: 0.05 };
    const data = { electricity: 100, gas: 100, fuel: 100, waste: 100, water: 100 };
    // 30 + 150 + 200 + 20 + 5 = 405
    expect(calculateEmissions(data, customFactors)).toBe(405);
  });
});
