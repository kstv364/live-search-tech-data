import React, { useState } from "react";
import { SearchObject } from "@/lib/types";
import { useCSVExport } from "@/lib/hooks/useCSVExport";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  FileDown,
  Info
} from "lucide-react";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchObject: SearchObject;
  totalResults: number;
}

const EXPORT_LIMITS = [
  { value: 1000, label: "1,000 records" },
  { value: 5000, label: "5,000 records" },
  { value: 10000, label: "10,000 records" },
  { value: 25000, label: "25,000 records" },
  { value: 50000, label: "50,000 records (max)" },
];

export function ExportDialog({ open, onOpenChange, searchObject, totalResults }: ExportDialogProps) {
  const [exportLimit, setExportLimit] = useState(Math.min(1000, totalResults));
  const [showSuccess, setShowSuccess] = useState(false);
  const [exportResult, setExportResult] = useState<{
    recordsExported: number;
    totalAvailable: number;
    truncated: boolean;
  } | null>(null);

  const { exportToCSV, isExporting } = useCSVExport({
    onSuccess: (result) => {
      setExportResult(result);
      setShowSuccess(true);
      // Auto-close success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        onOpenChange(false);
      }, 3000);
    },
    onError: (error) => {
      console.error('Export failed:', error);
      // Handle error state if needed
    }
  });

  const handleExport = async () => {
    try {
      await exportToCSV(searchObject, exportLimit);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleLimitChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setExportLimit(Math.min(numValue, 50000, totalResults));
    }
  };

  const estimatedFileSize = Math.ceil((exportLimit * 200) / 1024); // Rough estimate: 200 bytes per row

  if (showSuccess && exportResult) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Export Successful!</span>
            </DialogTitle>
            <DialogDescription>
              Your CSV file has been downloaded successfully.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm text-green-800">
                <p className="font-medium">Export Details:</p>
                <ul className="mt-1 space-y-1">
                  <li>• {exportResult.recordsExported.toLocaleString()} records exported</li>
                  <li>• {exportResult.totalAvailable.toLocaleString()} total records available</li>
                  {exportResult.truncated && (
                    <li className="text-amber-700 font-medium">
                      • Results were limited to {exportResult.recordsExported.toLocaleString()} records
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileDown className="w-5 h-5 text-blue-600" />
            <span>Export to CSV</span>
          </DialogTitle>
          <DialogDescription>
            Download your search results as a CSV file for analysis in Excel or other tools.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Export Limit Selection */}
          <div className="space-y-2">
            <Label htmlFor="export-limit">Number of records to export</Label>
            <div className="flex space-x-2">
              <Input
                id="export-limit"
                type="number"
                value={exportLimit}
                onChange={(e) => handleLimitChange(e.target.value)}
                min={1}
                max={Math.min(50000, totalResults)}
                className="flex-1"
              />
              <div className="text-sm text-gray-500 self-center">
                of {totalResults.toLocaleString()} total
              </div>
            </div>
            
            {/* Quick selection buttons */}
            <div className="flex flex-wrap gap-2 mt-2">
              {EXPORT_LIMITS
                .filter(limit => limit.value <= totalResults)
                .map((limit) => (
                <Button
                  key={limit.value}
                  variant="outline"
                  size="sm"
                  onClick={() => setExportLimit(limit.value)}
                  className={exportLimit === limit.value ? "bg-blue-50 border-blue-300" : ""}
                >
                  {limit.label}
                </Button>
              ))}
            </div>
          </div>

          {/* File Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Export Information:</p>
                <ul className="mt-1 space-y-1">
                  <li>• Estimated file size: ~{estimatedFileSize} KB</li>
                  <li>• Format: CSV (comma-separated values)</li>
                  <li>• Includes all available company and technology data</li>
                  <li>• Compatible with Excel, Google Sheets, and other tools</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Warning for large exports */}
          {exportLimit > 10000 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Large Export Warning:</p>
                  <p>
                    You're about to export {exportLimit.toLocaleString()} records. 
                    This may take a moment to process and result in a large file.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || exportLimit <= 0}
            className="min-w-[120px]"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
