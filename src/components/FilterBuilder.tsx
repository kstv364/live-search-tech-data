"use client";

import React, { useState } from "react";
import { SearchObject, FilterGroup, FilterCondition } from "@/lib/types";
import FilterGroupComponent from "./FilterGroupComponent";
import { MultiValueFilterSection } from "./MultiValueFilterSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FilterBuilderProps {
  value: SearchObject;
  onChange: (filter: SearchObject) => void;
}

interface MultiValueFilter {
  id: string;
  type: "ANY_OF" | "ALL_OF" | "NONE_OF";
  values: string[];
  enabled: boolean;
}

const FilterBuilder: React.FC<FilterBuilderProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [multiValueFilters, setMultiValueFilters] = useState<MultiValueFilter[]>([]);

  const handleFilterGroupChange = (updatedFilterGroup: FilterGroup) => {
    onChange({
      ...value,
      filters: updatedFilterGroup
    });
  };

  const handleMultiValueFilterChange = (field: string, filters: MultiValueFilter[]) => {
    // Convert multi-value filters to filter conditions
    const activeFilters = filters.filter(f => f.enabled && f.values.length > 0);
    
    // Remove existing multi-value conditions for this field from the filter group
    const existingConditions = value.filters.conditions.filter(condition => {
      if ('field' in condition) {
        return condition.field !== field;
      }
      return true;
    });

    // Add new conditions for active multi-value filters
    const newConditions: (FilterCondition | FilterGroup)[] = [...existingConditions];
    
    activeFilters.forEach(filter => {
      let operator: FilterCondition['operator'];
      switch (filter.type) {
        case "ANY_OF":
          operator = "IN";
          newConditions.push({
            field: field as any,
            operator,
            value: filter.values
          });
          break;
        case "ALL_OF":
          // For ALL_OF, we need to create multiple conditions with AND
          filter.values.forEach(val => {
            newConditions.push({
              field: field as any,
              operator: "LIKE",
              value: `%${val}%`
            });
          });
          break;
        case "NONE_OF":
          operator = "NOT IN";
          newConditions.push({
            field: field as any,
            operator,
            value: filter.values
          });
          break;
      }
    });

    const updatedFilterGroup: FilterGroup = {
      ...value.filters,
      conditions: newConditions
    };

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
          onChange={(filters: MultiValueFilter[]) => handleMultiValueFilterChange("tech_name", filters)}
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
          onChange={(filters: MultiValueFilter[]) => handleMultiValueFilterChange("tech_category", filters)}
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
