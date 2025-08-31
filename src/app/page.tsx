"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SearchObject } from "@/lib/types";
import FilterBuilder from "@/components/FilterBuilder";
import SearchResults from "@/components/SearchResults";
import QueryPreview from "@/components/QueryPreview";
import SavedQueries from "@/components/SavedQueries";
import { ExportDialog } from "@/components/ExportDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Users, 
  UserX, 
  Code, 
  Download, 
  Building, 
  Mail, 
  Inbox, 
  Megaphone, 
  MousePointer, 
  Eye,
  BarChart3,
  Search,
  Filter,
  FileText,
  Copy,
  ExternalLink
} from "lucide-react";

export default function Home() {
  const [searchObject, setSearchObject] = useState<SearchObject>({
    filters: {
      operator: "AND",
      conditions: [],
    },
    limit: 10,
    offset: 0,
  });
  
  // Reset offset when filters change
  const handleFilterChange = useCallback((newSearchObject: SearchObject) => {
    setSearchObject({
      ...newSearchObject,
      offset: 0 // Reset to first page when filters change
    });
    // Reset search state when filters change to avoid showing "no results" prematurely
    if (JSON.stringify(newSearchObject.filters) !== JSON.stringify(searchObject.filters)) {
      setHasPerformedSearch(false);
      setResults([]);
      setTotalResults(0);
    }
  }, [searchObject.filters]);

  const handleClearFilters = useCallback(() => {
    setSearchObject({
      filters: {
        operator: "AND",
        conditions: [],
      },
      limit: 10,
      offset: 0,
    });
    setResults([]);
    setTotalResults(0);
    setHasPerformedSearch(false);
  }, []);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [hasPerformedSearch, setHasPerformedSearch] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const search = useCallback(async (params: SearchObject) => {
    setLoading(true);
    setHasPerformedSearch(true);
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      if (data.error) {
        console.error("Search error:", data.error);
        setResults([]);
        setTotalResults(0);
      } else {
        setResults(data.results || []);
        setTotalResults(data.total || 0);
      }
    } catch (error) {
      console.error("Search failed:", error);
    }
    setLoading(false);
  }, []);

  const handleSearch = useCallback(() => {
    search(searchObject);
  }, [search, searchObject]);

  const handlePageChange = useCallback((newOffset: number) => {
    const newSearchObject = {
      ...searchObject,
      offset: newOffset,
    };
    setSearchObject(newSearchObject);
    search(newSearchObject);
  }, [search, searchObject]);

  // Check if any filters are applied
  const hasActiveFilters = searchObject.filters.conditions.length > 0;
  
  // Check if search has been performed AND we have results or performed search with no results
  const hasSearchedWithNoResults = hasPerformedSearch && results.length === 0 && !loading;

  const sidebarItems = [
    { icon: Users, label: "Audiences", active: true },
    { icon: UserX, label: "Exclusions" },
    { icon: Code, label: "Advanced Scrapes" },
    { icon: Download, label: "Exports" },
    { icon: Building, label: "Organization" },
    { icon: FileText, label: "API" },
    { icon: BarChart3, label: "Usage" },
  ];

  const adminItems = [
    { icon: Mail, label: "Email Dashboard" },
    { icon: Inbox, label: "Inbox" },
    { icon: Megaphone, label: "Campaigns" },
    { icon: MousePointer, label: "Pixel Script" },
    { icon: Eye, label: "Visitors" },
    { icon: BarChart3, label: "Playbook" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-semibold text-gray-900">fiber.ai</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item, index) => (
            <div
              key={index}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                item.active
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}

          {/* Admin Section */}
          <div className="pt-6">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Admin
            </div>
            {adminItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-gray-600 hover:bg-gray-100"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">1. Choose companies to target</h1>
              <p className="text-sm text-gray-500 mt-1">
                fiber ai test audience → Add filters to find the right companies.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setExportDialogOpen(true)}
                disabled={!hasActiveFilters || totalResults === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
              <Button variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                Copy Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Filters Section - Horizontal Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Main Filters Panel */}
              <div className="xl:col-span-3">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                      <Filter className="w-5 h-5 text-gray-500" />
                      <span className="font-medium text-gray-900">Filters</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                        Clear
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleSearch} 
                        disabled={loading || !hasActiveFilters}
                        className={!hasActiveFilters ? "opacity-50" : ""}
                      >
                        <Search className="w-4 h-4 mr-2" />
                        {loading ? "Searching..." : "Search"}
                      </Button>
                    </div>
                  </div>

                  <FilterBuilder
                    value={searchObject}
                    onChange={handleFilterChange}
                    loading={loading}
                  />

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    {!hasActiveFilters ? (
                      <div className="flex items-center text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>Add at least one filter above to start searching for companies!</span>
                      </div>
                    ) : !hasPerformedSearch ? (
                      <div className="flex items-center text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <Search className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>Filters applied! Click Search to find matching companies.</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
                        <Search className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>Search completed. {results.length > 0 ? `Found ${totalResults} companies.` : 'No companies matched your criteria.'}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Right Panel - Query Preview */}
              <div className="xl:col-span-1">
                <QueryPreview searchObject={searchObject} />
                <div className="mt-4">
                  <SavedQueries
                    onLoad={setSearchObject}
                    currentQuery={searchObject}
                  />
                </div>
              </div>
            </div>

            {/* Results Section - Aligned with Filters */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <div className="xl:col-span-3">
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <Building className="w-5 h-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">Company</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="w-5 h-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">Industry</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">Description</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Building className="w-5 h-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">Headquarters</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <ExternalLink className="w-5 h-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">Social Links</span>
                        </div>
                      </div>
                    </div>
                  </div>
                
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="text-gray-400 mb-2">
                      <Search className="w-12 h-12 mx-auto mb-4 animate-spin" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Searching Fiber's database...
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Please wait while we find companies matching your criteria.
                    </p>
                  </div>
                ) : results.length > 0 ? (
                  <div className="overflow-hidden">
                    <SearchResults
                      results={results}
                      loading={loading}
                      totalResults={totalResults}
                      currentOffset={searchObject.offset || 0}
                      limit={searchObject.limit || 10}
                      onPageChange={handlePageChange}
                      onSortChange={(sort) => setSearchObject(prev => ({ ...prev, sort }))}
                      onExport={() => setExportDialogOpen(true)}
                    />
                  </div>
                ) : hasSearchedWithNoResults ? (
                  <div className="p-12 text-center">
                    <div className="text-gray-400 mb-4">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No companies found
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-4">
                      We couldn't find any companies matching your current search criteria.
                    </p>
                    <div className="text-sm text-gray-600 space-y-2">
                      <p>Try adjusting your filters by:</p>
                      <ul className="list-disc list-inside space-y-1 text-left max-w-sm mx-auto">
                        <li>Using broader technology names or categories</li>
                        <li>Removing some filters to expand your search</li>
                        <li>Checking for typos in your search terms</li>
                      </ul>
                    </div>
                  </div>
                ) : !hasActiveFilters ? (
                  <div className="p-12 text-center">
                    <div className="text-purple-400 mb-4">
                      <div className="w-16 h-16 mx-auto mb-4 bg-purple-50 rounded-full flex items-center justify-center">
                        <Filter className="w-8 h-8 text-purple-500" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Ready to search 35M+ companies
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      Add at least one filter to start discovering companies that match your criteria.
                    </p>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 max-w-lg mx-auto">
                      <h4 className="font-medium text-purple-900 mb-2">Quick start:</h4>
                      <div className="text-sm text-purple-700 space-y-1 text-left">
                        <p>• Search by <strong>Technology Names</strong> (e.g., React, Salesforce, AWS)</p>
                        <p>• Filter by <strong>Technology Categories</strong> (e.g., CRM, Analytics)</p>
                        <p>• Use <strong>Advanced Filters</strong> for precise targeting</p>
                      </div>
                    </div>
                  </div>
                ) : hasActiveFilters && !hasPerformedSearch ? (
                  <div className="p-12 text-center">
                    <div className="text-blue-400 mb-4">
                      <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                        <Search className="w-8 h-8 text-blue-500" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Ready to search with your filters
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      You've applied filters. Click the <strong>Search</strong> button above to find companies matching your criteria.
                    </p>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="text-gray-400 mb-2">
                      <Search className="w-12 h-12 mx-auto mb-4" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Ready to search
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Click the Search button to find companies matching your filters.
                    </p>
                  </div>
                  )}
                </div>
              </div>
              
              {/* Right column for results section remains empty or could contain summary */}
              <div className="xl:col-span-1">
                {/* This space can be used for result summaries, export options, etc. */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        searchObject={searchObject}
        totalResults={totalResults}
      />
    </div>
  );
}