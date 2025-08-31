"use client";

import React, { useState, useCallback } from "react";
import { SearchObject, FilterGroup, FilterCondition } from "@/lib/types";
import FilterGroupComponent from "./FilterGroupComponent";
import { MultiValueFilterSection } from "./MultiValueFilterSection";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  ChevronUp, 
  Settings, 
  Filter,
  Code,
  Building
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [multiValueFilters, setMultiValueFilters] = useState<MultiValueFilter[]>([]);
  
  // Create a reset key based on the filters to reset multi-value components when filters are cleared
  // Only reset when conditions array is actually empty and different from before
  const resetKey = value.filters.conditions.length === 0 ? 'reset' : 'active';

  // Count advanced filter conditions
  const advancedFilterCount = value.filters.conditions.filter(condition => {
    if ('field' in condition) {
      return !['tech_name', 'tech_category'].includes(condition.field);
    }
    return true;
  }).length;

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
      {/* Horizontal Layout: Normal Filters + Advanced Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Primary Filters */}
        <div className="space-y-6">
          {/* Technology Search */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Code className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Technology Search</h3>
                <p className="text-sm text-gray-500">Find companies using specific technologies</p>
              </div>
            </div>
            
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

          {/* Category Search */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Building className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Category Search</h3>
                <p className="text-sm text-gray-500">Filter by technology categories and company types</p>
              </div>
            </div>
            
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
        </div>

        {/* Right Side - Advanced Filters */}
        <div className="space-y-4">
          <Collapsible open={advancedFiltersOpen} onOpenChange={setAdvancedFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between h-12 px-4 py-2 border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900 flex items-center space-x-2">
                      <span>Advanced Filters</span>
                      {advancedFilterCount > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {advancedFilterCount} active
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {advancedFiltersOpen ? 'Click to hide' : 'Company details, dates, spending, and more'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {advancedFiltersOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-4 space-y-4 overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
              <Card className="border-purple-200 bg-purple-50/30">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Filter className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-purple-900">Custom Filter Rules</span>
                      </div>
                      <div className="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded-md">
                        Fields • Operators • Values
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-purple-200 p-4 overflow-hidden">
                      <div className="space-y-4">
                        <FilterGroupComponent
                          filterGroup={value.filters}
                          onChange={handleFilterGroupChange}
                          setOpen={setOpen}
                        />
                      </div>
                    </div>

                    <div className="text-xs text-purple-600 bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="font-medium mb-1">💡 Advanced Filter Tips:</p>
                      <ul className="space-y-1 text-purple-700">
                        <li>• Use <strong>Company Fields</strong> to filter by location, spending, or company details</li>
                        <li>• Use <strong>Technology Fields</strong> for premium vs free tech, descriptions, or parent technologies</li>
                        <li>• Combine multiple conditions with AND/OR logic for precise targeting</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
};

export default FilterBuilder;
