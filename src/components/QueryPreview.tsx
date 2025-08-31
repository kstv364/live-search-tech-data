"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchObject } from "@/lib/types";

interface QueryPreviewProps {
  searchObject: SearchObject;
}

const QueryPreview: React.FC<QueryPreviewProps> = ({ searchObject }) => {
  const hasFilters = searchObject.filters.conditions.length > 0;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Query Preview</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasFilters ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014.846 21H9.154a3.374 3.374 0 00-2.849-1.007L6.568 19.9z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">
              Add filters to see query preview
            </p>
          </div>
        ) : (
          <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-[400px]">
            {JSON.stringify(searchObject, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
};

export default QueryPreview;
