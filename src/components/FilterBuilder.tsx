"use client";

import React, { useState } from "react";
import { SearchObject, FilterGroup } from "@/lib/types";
import FilterGroupComponent from "./FilterGroupComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FilterBuilderProps {
  value: SearchObject;
  onChange: (filter: SearchObject) => void;
}

const FilterBuilder: React.FC<FilterBuilderProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);

  const handleFilterGroupChange = (updatedFilterGroup: FilterGroup) => {
    onChange({
      ...value,
      filters: updatedFilterGroup
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Builder</CardTitle>
      </CardHeader>
      <CardContent>
        <FilterGroupComponent
          filterGroup={value.filters}
          onChange={handleFilterGroupChange}
          setOpen={setOpen}   // ✅ pass down
        />
      </CardContent>
    </Card>
  );
};

export default FilterBuilder;
