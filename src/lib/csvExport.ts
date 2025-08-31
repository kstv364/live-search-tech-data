/**
 * Utility functions for CSV export functionality
 */

export interface CSVColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

export const DEFAULT_COLUMNS: CSVColumn[] = [
  { key: 'company_name', label: 'Company Name' },
  { key: 'root_domain', label: 'Domain' },
  { key: 'company_category', label: 'Category' },
  { key: 'country', label: 'Country' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'postal_code', label: 'Postal Code' },
  { key: 'spend', label: 'Spend', format: (value) => value ? `$${value.toLocaleString()}` : '' },
  { key: 'tech_name', label: 'Technology Name' },
  { key: 'tech_category', label: 'Technology Category' },
  { key: 'parent_tech_name', label: 'Parent Technology' },
  { key: 'premium', label: 'Premium', format: (value) => value ? 'Yes' : 'No' },
  { key: 'first_indexed', label: 'First Detected' },
  { key: 'last_indexed', label: 'Last Detected' },
  { key: 'description', label: 'Description' },
];

/**
 * Converts an array of objects to CSV format
 */
export function convertToCSV(data: any[], columns: CSVColumn[] = DEFAULT_COLUMNS): string {
  if (!data || data.length === 0) {
    return '';
  }

  // Create header row
  const headers = columns.map(col => `"${col.label}"`).join(',');
  
  // Create data rows
  const rows = data.map(row => {
    return columns.map(col => {
      let value = row[col.key];
      
      // Apply formatting if specified
      if (col.format && value !== null && value !== undefined) {
        value = col.format(value);
      }
      
      // Handle null/undefined values
      if (value === null || value === undefined) {
        value = '';
      }
      
      // Convert to string and escape quotes
      const stringValue = String(value).replace(/"/g, '""');
      
      return `"${stringValue}"`;
    }).join(',');
  });

  return [headers, ...rows].join('\n');
}

/**
 * Downloads CSV data as a file
 */
export function downloadCSV(csvContent: string, filename: string = 'export.csv'): void {
  // Add BOM for better Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Generates a filename with timestamp
 */
export function generateFilename(prefix: string = 'company-search'): string {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[:.]/g, '-');
  return `${prefix}-${timestamp}.csv`;
}

/**
 * Estimates CSV file size in bytes
 */
export function estimateCSVSize(data: any[], columns: CSVColumn[] = DEFAULT_COLUMNS): number {
  if (!data || data.length === 0) return 0;
  
  // Rough estimation: average length of values plus separators and quotes
  const avgRowLength = columns.reduce((sum, col) => {
    const avgValueLength = data.slice(0, Math.min(100, data.length))
      .reduce((valSum, row) => {
        const value = row[col.key];
        return valSum + (value ? String(value).length : 0);
      }, 0) / Math.min(100, data.length);
    
    return sum + avgValueLength + 3; // +3 for quotes and comma
  }, 0);
  
  const headerLength = columns.reduce((sum, col) => sum + col.label.length + 3, 0);
  
  return Math.ceil((headerLength + (avgRowLength * data.length)) * 1.1); // 10% buffer
}
