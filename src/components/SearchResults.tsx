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
import { SortOption, SearchField } from "@/lib/types";
import { ArrowUpDown } from "lucide-react";

interface SearchResultsProps {
  results: any[];
  loading: boolean;
  totalResults: number;
  currentOffset: number;
  limit: number;
  onPageChange: (newOffset: number) => void;
  onSortChange: (sort: SortOption[]) => void;
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
}: SearchResultsProps) {
  const [sortField, setSortField] = React.useState<SearchField | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");

  const handleSort = (field: SearchField) => {
    const newDirection = field === sortField && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);
    onSortChange([{ field, direction: newDirection }]);
  };

  const totalPages = Math.max(1, Math.ceil((totalResults || 0) / limit));
  const currentPage = Math.min(totalPages, Math.max(1, Math.floor((currentOffset || 0) / limit) + 1));

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.field}>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort(column.field)}
                    className="h-8 p-0"
                  >
                    {column.label}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
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
            ) : results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results found
                </TableCell>
              </TableRow>
            ) : (
              results.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.field}>
                      {row[column.field]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {totalResults > 0 && (
            <>
              Showing {currentOffset + 1}-{Math.min(currentOffset + limit, totalResults)} of {totalResults} results
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
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
