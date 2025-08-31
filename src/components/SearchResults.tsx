"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SortOption, SearchField } from "@/lib/types";
import { ArrowUpDown, ArrowUp, ArrowDown, Download, Filter, X } from "lucide-react";

interface SearchResultsProps {
  results: any[];
  loading: boolean;
  totalResults: number;
  currentOffset: number;
  limit: number;
  onPageChange: (newOffset: number) => void;
  onSortChange: (sort: SortOption[]) => void;
  onExport?: () => void;
  currentSort?: SortOption[]; // Add this to track current sort state
}

const columns: { label: string; field: SearchField }[] = [
  { label: "Company Name", field: "company_name" },
  { label: "Domain", field: "root_domain" },
  { label: "Category", field: "company_category" },
  { label: "Country", field: "country" },
  { label: "Spend", field: "spend" },
  { label: "Tech Name", field: "tech_name" },
  { label: "Tech Category", field: "tech_category" },
  { label: "First Detected", field: "first_indexed" },
  { label: "Last Detected", field: "last_indexed" },
];

export function SearchResults({
  results,
  loading,
  totalResults,
  currentOffset,
  limit,
  onPageChange,
  onSortChange,
  onExport,
  currentSort,
}: SearchResultsProps) {
  const [columnFilters, setColumnFilters] = React.useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = React.useState(false);

  // Derive sort state from currentSort prop instead of local state
  const currentSortOption = currentSort?.[0];
  const sortField = currentSortOption?.field || null;
  const sortDirection = currentSortOption?.direction || "asc";

  const handleSort = (field: SearchField) => {
    const newDirection = field === sortField && sortDirection === "asc" ? "desc" : "asc";
    onSortChange([{ field, direction: newDirection }]);
  };

  const handleColumnFilter = (field: SearchField, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearColumnFilter = (field: SearchField) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[field];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setColumnFilters({});
  };

  // Filter results based on column filters
  const filteredResults = React.useMemo(() => {
    if (Object.keys(columnFilters).length === 0) return results;
    
    return results.filter(row => {
      return Object.entries(columnFilters).every(([field, filterValue]) => {
        if (!filterValue) return true;
        const cellValue = row[field];
        if (cellValue == null) return false;
        return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
      });
    });
  }, [results, columnFilters]);

  const getSortIcon = (field: SearchField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === "asc" ? 
      <ArrowUp className="ml-2 h-4 w-4" /> : 
      <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const hasActiveFilters = Object.values(columnFilters).some(filter => filter.length > 0);

  const totalPages = Math.max(1, Math.ceil((totalResults || 0) / limit));
  const currentPage = Math.min(totalPages, Math.max(1, Math.floor((currentOffset || 0) / limit) + 1));

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-blue-50 border-blue-200" : ""}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-gray-600 hover:text-gray-900"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters ({Object.keys(columnFilters).length})
            </Button>
          )}
        </div>
        {hasActiveFilters && (
          <div className="text-sm text-gray-600">
            Showing {filteredResults.length} of {results.length} results
          </div>
        )}
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[1200px]">
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.field} className="relative">
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort(column.field)}
                      className="h-8 p-0 hover:bg-transparent"
                    >
                      <span className={sortField === column.field ? "font-semibold" : ""}>
                        {column.label}
                      </span>
                      {getSortIcon(column.field)}
                    </Button>
                    {showFilters && (
                      <div className="relative">
                        <Input
                          placeholder={`Filter ${column.label.toLowerCase()}...`}
                          value={columnFilters[column.field] || ""}
                          onChange={(e) => handleColumnFilter(column.field, e.target.value)}
                          className="h-8 text-xs"
                        />
                        {columnFilters[column.field] && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => clearColumnFilter(column.field)}
                            className="absolute right-1 top-0 h-8 w-8 p-0 hover:bg-gray-100"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredResults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {hasActiveFilters ? "No results match the current filters" : "No results found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredResults.map((row, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <TableCell key={column.field} className="max-w-xs">
                      <div className="truncate" title={row[column.field]}>
                        {row[column.field]}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-6 py-4">
        <div className="text-sm text-muted-foreground">
          {totalResults > 0 && (
            <>
              Showing {currentOffset + 1}-{Math.min(currentOffset + limit, totalResults)} of {totalResults} results
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {onExport && totalResults > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Export All
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onPageChange(Math.max(0, currentOffset - limit))}
            disabled={currentOffset === 0}
          >
            Previous
          </Button>
          <div className="text-sm">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            onClick={() => onPageChange(currentOffset + limit)}
            disabled={currentOffset + limit >= totalResults}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SearchResults;
