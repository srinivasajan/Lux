import { describe, it, expect } from 'vitest';
import { CsvExportService } from '../../src/features/tracker/csv.export';
import { ApplicationStatus, ApplicationPlatform, type Application } from '../../src/core/types/application';

describe('CsvExportService', () => {
  it('should properly escape commas', () => {
    const escaped = CsvExportService.escapeCsvValue('Tech Corp, Inc');
    expect(escaped).toBe('"Tech Corp, Inc"');
  });

  it('should properly escape quotes by doubling them', () => {
    const escaped = CsvExportService.escapeCsvValue('The "Great" Company');
    expect(escaped).toBe('"The ""Great"" Company"');
  });

  it('should properly escape newlines', () => {
    const escaped = CsvExportService.escapeCsvValue('Line 1\nLine 2');
    expect(escaped).toBe('"Line 1\nLine 2"');
  });

  it('should return plain string if no special chars', () => {
    const escaped = CsvExportService.escapeCsvValue('Developer');
    expect(escaped).toBe('Developer');
  });

  it('should generate valid CSV from applications', () => {
    const apps: Application[] = [
      {
        id: 1,
        company: 'Apple, Inc',
        role: 'iOS "Dev"',
        platform: ApplicationPlatform.LinkedIn,
        jobUrl: 'https://apple.com',
        status: ApplicationStatus.Applied,
        matchScore: 99,
        appliedAt: '2023-01-01T12:00:00Z'
      }
    ];

    const csv = CsvExportService.generateCsv(apps);
    const lines = csv.split('\n');
    
    expect(lines[0]).toBe('Company,Role,Platform,Status,MatchScore,AppliedAt,JobUrl');
    expect(lines[1]).toBe('"Apple, Inc","iOS ""Dev""",LinkedIn,Applied,99,2023-01-01T12:00:00Z,https://apple.com');
  });
});
