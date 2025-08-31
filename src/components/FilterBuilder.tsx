"use client";

import React, { useState } from "react";
import { SearchObject, FilterGroup } from "@/lib/types";
import FilterGroupComponent from "./FilterGroupComponent";
import { MultiValueFilterSection } from "./MultiValueFilterSection";
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
    <div className="space-y-6">
      {/* Keywords Section */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Keywords</h3>
        
        <MultiValueFilterSection
          title="Keyword Search"
          field="tech_name"
          useTypeahead={true}
          placeholder="Search for technologies..."
        />
      </div>

      {/* Unified Industry Search Section */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Unified Industry Search</h3>
        
        <MultiValueFilterSection
          title="Industry Categories"
          field="tech_category"
          useTypeahead={true}
          placeholder="Search for categories..."
        />
      </div>

      {/* Advanced Filters Section */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Advanced Filters</h3>
        
        <Card>
          <CardContent className="pt-6">
            <FilterGroupComponent
              filterGroup={value.filters}
              onChange={handleFilterGroupChange}
              setOpen={setOpen}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FilterBuilder;
