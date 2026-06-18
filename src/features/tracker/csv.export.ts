import type { Application } from '../../core/types/application';

export class CsvExportService {
  /**
   * Safely escapes a string for CSV, enclosing in double quotes if necessary.
   */
  static escapeCsvValue(val: string | number | undefined | null): string {
    if (val === null || val === undefined) {
      return '';
    }
    const str = String(val);
    
    // If it contains a quote, comma, or newline, it must be enclosed in quotes 
    // and inner quotes must be escaped by doubling them.
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      const escaped = str.replace(/"/g, '""');
      return `"${escaped}"`;
    }
    
    return str;
  }

  /**
   * Generates a CSV string from an array of Applications.
   */
  static generateCsv(applications: Application[]): string {
    const headers = ['Company', 'Role', 'Platform', 'Status', 'MatchScore', 'AppliedAt', 'JobUrl'];
    
    const rows = applications.map(app => [
      app.company,
      app.role,
      app.platform,
      app.status,
      app.matchScore ?? '',
      app.appliedAt,
      app.jobUrl
    ].map(this.escapeCsvValue).join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Triggers a browser download of the CSV string.
   */
  static downloadCsv(csvString: string, filename: string = 'lux_applications.csv') {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
