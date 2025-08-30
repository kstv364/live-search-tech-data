"use client";

import React, { useState, useEffect } from "react";
import { SearchObject, FilterGroup, FilterCondition } from "@/lib/types";
import { Button } from "@/components/ui/button";
import FilterGroupComponent from "./FilterGroupComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FilterBuilderProps {
  onChange: (filter: SearchObject) => void;
}

const FilterBuilder: React.FC<FilterBuilderProps> = ({ onChange }) => {
  const [searchObject, setSearchObject] = useState<SearchObject>({
    filters: {
      operator: "AND",
      conditions: [],
    },
  });

  // Call onChange whenever searchObject changes
  useEffect(() => {
    onChange(searchObject);
  }, [searchObject, onChange]);

  const handleFilterGroupChange = (updatedFilterGroup: FilterGroup) => {
    setSearchObject((prev) => ({
      ...prev,
      filters: updatedFilterGroup
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Builder</CardTitle>
      </CardHeader>
      <CardContent>
        <FilterGroupComponent
          filterGroup={searchObject.filters}
          onChange={handleFilterGroupChange}
        />
      </CardContent>
    </Card>
  );
};

export default FilterBuilder;
