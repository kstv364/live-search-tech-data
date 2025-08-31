import { useState, useCallback } from 'react';
import { SearchObject } from '@/lib/types';
import { downloadCSV } from '@/lib/csvExport';

interface UseCSVExportOptions {
  defaultLimit?: number;
  onSuccess?: (data: { recordsExported: number; totalAvailable: number; truncated: boolean }) => void;
  onError?: (error: string) => void;
}

interface ExportResult {
  recordsExported: number;
  totalAvailable: number;
  truncated: boolean;
}

export function useCSVExport(options: UseCSVExportOptions = {}) {
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportResult, setLastExportResult] = useState<ExportResult | null>(null);
  
  const { defaultLimit = 1000, onSuccess, onError } = options;

  const exportToCSV = useCallback(async (searchObject: SearchObject, limit: number = defaultLimit) => {
    if (isExporting) {
      return; // Prevent multiple simultaneous exports
    }

    setIsExporting(true);
    
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchObject,
          limit,
        }),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Download the CSV file
      downloadCSV(data.csvContent, data.filename);
      
      const result: ExportResult = {
        recordsExported: data.recordsExported,
        totalAvailable: data.totalAvailable,
        truncated: data.truncated,
      };
      
      setLastExportResult(result);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      console.error('CSV Export error:', error);
      
      if (onError) {
        onError(errorMessage);
      }
      
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, defaultLimit, onSuccess, onError]);

  const canExport = useCallback((searchObject: SearchObject) => {
    // Check if there are any filters applied
    return searchObject.filters.conditions.length > 0;
  }, []);

  return {
    exportToCSV,
    isExporting,
    lastExportResult,
    canExport,
  };
}
