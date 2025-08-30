"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchObject } from "@/lib/types";

interface QueryPreviewProps {
  searchObject: SearchObject;
}

const QueryPreview: React.FC<QueryPreviewProps> = ({ searchObject }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Query Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-[400px]">
          {JSON.stringify(searchObject, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
};

export default QueryPreview;
