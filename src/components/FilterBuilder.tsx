"use client";

import React, { useState, useCallback } from "react";
import { SearchObject, FilterGroup, FilterCondition } from "@/lib/types";
import FilterGroupComponent from "./FilterGroupComponent";
import { MultiValueFilterSection } from "./MultiValueFilterSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FilterBuilderProps {
  value: SearchObject;
  onChange: (filter: SearchObject) => void;
  loading?: boolean;
}

interface MultiValueFilter {
  id: string;
  type: "ANY_OF" | "ALL_OF" | "NONE_OF";
  values: string[];
  enabled: boolean;
}

const FilterBuilder: React.FC<FilterBuilderProps> = ({ value, onChange, loading = false }) => {
  const [open, setOpen] = useState(false);
  const [multiValueFilters, setMultiValueFilters] = useState<MultiValueFilter[]>([]);
  
  // Create a reset key based on the filters to reset multi-value components when filters are cleared
  // Only reset when conditions array is actually empty and different from before
  const resetKey = value.filters.conditions.length === 0 ? 'reset' : 'active';

  const handleFilterGroupChange = useCallback((updatedFilterGroup: FilterGroup) => {
    onChange({
      ...value,
      filters: updatedFilterGroup
    });
  }, [value, onChange]);

  const handleMultiValueFilterChange = useCallback((field: string, filters: MultiValueFilter[]) => {
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
  }, [value, onChange]);

  // Create stable references for the callbacks
  const handleTechNameChange = useCallback((filters: MultiValueFilter[]) => 
    handleMultiValueFilterChange("tech_name", filters), [handleMultiValueFilterChange]);
  
  const handleTechCategoryChange = useCallback((filters: MultiValueFilter[]) => 
    handleMultiValueFilterChange("tech_category", filters), [handleMultiValueFilterChange]);

  return (
    <div className="space-y-6">
      {/* Keywords Section */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Technology Search</h3>
        
        <MultiValueFilterSection
          title="Technology Names"
          field="tech_name"
          useTypeahead={true}
          placeholder="Search for technologies (e.g., React, Salesforce, AWS)..."
          onChange={handleTechNameChange}
          disabled={loading}
          resetKey={resetKey}
        />
      </div>

      {/* Unified Industry Search Section */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Category Search</h3>
        
        <MultiValueFilterSection
          title="Technology Categories"
          field="tech_category"
          useTypeahead={true}
          placeholder="Search for categories (e.g., CRM, Analytics, E-commerce)..."
          onChange={handleTechCategoryChange}
          disabled={loading}
          resetKey={resetKey}
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
