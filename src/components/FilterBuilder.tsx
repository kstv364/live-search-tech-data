"use client";

import React, { useState, useCallback, useMemo } from "react";
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
  
  // Debug log to see current filter state
  console.log("FilterBuilder value.filters:", value.filters);
  
  // Create a reset key based on the filters to reset multi-value components when filters are cleared
  // or when the structure changes significantly (like when loading a query)
  const resetKey = useMemo(() => {
    if (value.filters.conditions.length === 0) {
      return 'reset';
    }
    // Create a key based on the structure of conditions to detect major changes
    const structureKey = value.filters.conditions.map(condition => {
      if ('field' in condition) {
        return `${condition.field}-${condition.operator}`;
      }
      if ('conditions' in condition) {
        return condition.conditions.map(c => 
          'field' in c ? `${c.field}-${c.operator}` : 'group'
        ).join('|');
      }
      return 'unknown';
    }).join(';;');
    return structureKey;
  }, [value.filters.conditions]);

  // Count advanced filter conditions (only individual FilterCondition objects, not normal filter groups)
  const advancedFilterCount = value.filters.conditions.filter(condition => {
    // Count only individual FilterCondition objects (advanced filters)
    if ('field' in condition) {
      return true; // This is an individual condition, count it as advanced
    }
    // For FilterGroup objects, check if they're advanced filter groups (not normal filter groups)
    if ('conditions' in condition && condition.conditions.length > 0) {
      const firstCondition = condition.conditions[0];
      if ('field' in firstCondition) {
        // Check if this is a normal filter group (tech fields with IN/NOT IN/LIKE)
        const isNormalFilterGroup = ['tech_name', 'tech_category'].includes(firstCondition.field) &&
                                  condition.conditions.every(cond => 
                                    'field' in cond && 
                                    ['tech_name', 'tech_category'].includes(cond.field) && 
                                    ['IN', 'NOT IN', 'LIKE'].includes(cond.operator)
                                  );
        return !isNormalFilterGroup; // Don't count normal filter groups
      }
    }
    return true; // Count other filter groups as advanced
  }).length;

  const handleFilterGroupChange = useCallback((updatedFilterGroup: FilterGroup) => {
    console.log("handleFilterGroupChange called with:", updatedFilterGroup);
    onChange({
      ...value,
      filters: updatedFilterGroup
    });
  }, [value, onChange]);

  const handleMultiValueFilterChange = useCallback((field: string, filters: MultiValueFilter[]) => {
    // Convert multi-value filters to filter conditions
    const activeFilters = filters.filter(f => f.enabled && f.values.length > 0);
    
    // Remove any existing normal filter group for this field
    const existingConditions = value.filters.conditions.filter(condition => {
      // Keep all advanced filter conditions (individual FilterCondition objects)
      if ('field' in condition) {
        return true; // Keep all individual conditions (these are advanced filters)
      }
      // For FilterGroup objects, check if they're normal filter groups for this field
      if ('conditions' in condition && condition.conditions.length > 0) {
        // Check if this is a normal filter group for the current field
        const firstCondition = condition.conditions[0];
        if ('field' in firstCondition && firstCondition.field === field) {
          // Check if all conditions in this group are normal filter conditions (IN/NOT IN/LIKE)
          const isNormalFilterGroup = condition.conditions.every(cond => 
            'field' in cond && 
            cond.field === field && 
            ['IN', 'NOT IN', 'LIKE'].includes(cond.operator)
          );
          return !isNormalFilterGroup; // Remove normal filter groups for this field
        }
      }
      return true; // Keep other filter groups
    });

    // Create new normal filter conditions for the current field
    const newNormalConditions: FilterCondition[] = [];
    
    activeFilters.forEach(filter => {
      let operator: FilterCondition['operator'];
      switch (filter.type) {
        case "ANY_OF":
          operator = "IN";
          newNormalConditions.push({
            field: field as any,
            operator,
            value: filter.values
          });
          break;
        case "ALL_OF":
          // For ALL_OF, we need to create multiple conditions with AND
          filter.values.forEach(val => {
            newNormalConditions.push({
              field: field as any,
              operator: "LIKE",
              value: `%${val}%`
            });
          });
          break;
        case "NONE_OF":
          operator = "NOT IN";
          newNormalConditions.push({
            field: field as any,
            operator,
            value: filter.values
          });
          break;
      }
    });

    // If we have normal filter conditions, wrap them in a FilterGroup
    const allConditions = [...existingConditions];
    if (newNormalConditions.length > 0) {
      const normalFilterGroup: FilterGroup = {
        operator: "AND",
        conditions: newNormalConditions
      };
      allConditions.push(normalFilterGroup);
    }

    const updatedFilterGroup: FilterGroup = {
      ...value.filters,
      conditions: allConditions
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
              currentFilters={value.filters}
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
              currentFilters={value.filters}
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
                    
                    <div className="bg-white rounded-lg border border-purple-200 p-4 overflow-visible">
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
