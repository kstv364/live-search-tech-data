"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SearchObject } from "@/lib/types";
import FilterBuilder from "@/components/FilterBuilder";
import SearchResults from "@/components/SearchResults";
import QueryPreview from "@/components/QueryPreview";
import SavedQueries from "@/components/SavedQueries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
  const handleFilterChange = (newSearchObject: SearchObject) => {
    setSearchObject({
      ...newSearchObject,
      offset: 0 // Reset to first page when filters change
    });
  };
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const search = useCallback(async (params: SearchObject) => {
    setLoading(true);
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

  return (
    <main className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Company Technology Search</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className="p-4">
            <FilterBuilder
              value={searchObject}
              onChange={handleFilterChange}
            />
            <div className="mt-4 flex justify-between items-center">
              <Button 
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </Button>
              <SavedQueries
                onLoad={setSearchObject}
                currentQuery={searchObject}
              />
            </div>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <QueryPreview searchObject={searchObject} />
        </div>
      </div>

      <SearchResults
        results={results}
        loading={loading}
        totalResults={totalResults}
        currentOffset={searchObject.offset || 0}
        limit={searchObject.limit || 10}
        onPageChange={handlePageChange}
        onSortChange={(sort) => setSearchObject(prev => ({ ...prev, sort }))}
      />
    </main>
  );
}