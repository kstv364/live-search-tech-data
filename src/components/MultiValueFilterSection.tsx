"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MultiValueInput } from "@/components/ui/multi-value-input";
import { SearchField, FilterGroup, FilterCondition } from "@/lib/types";
import { X, Plus } from "lucide-react";

interface MultiValueFilterSectionProps {
  title: string;
  field: SearchField;
  useTypeahead?: boolean;
  placeholder?: string;
  onChange?: (filters: FilterOption[]) => void;
  disabled?: boolean;
  resetKey?: string | number; // Add this to force reset when needed
  currentFilters?: FilterGroup; // Add this to sync with loaded queries
}

interface FilterOption {
  id: string;
  type: "ALL_OF" | "ANY_OF" | "NONE_OF";
  values: string[];
  enabled: boolean;
}

export const MultiValueFilterSection: React.FC<MultiValueFilterSectionProps> = ({
  title,
  field,
  useTypeahead = false,
  placeholder = "Add value...",
  onChange,
  disabled = false,
  resetKey,
  currentFilters,
}) => {
  const [filters, setFilters] = useState<FilterOption[]>([
    { id: `${field}_contains_any`, type: "ANY_OF", values: [], enabled: false },
    { id: `${field}_contains_all`, type: "ALL_OF", values: [], enabled: false },
    { id: `${field}_contains_none`, type: "NONE_OF", values: [], enabled: false },
  ]);
  
  // Keep track of the last resetKey to detect changes
  const [lastResetKey, setLastResetKey] = useState(resetKey);

  // Function to extract filter state from current filters
  const extractFiltersFromQuery = useCallback((filters: FilterGroup): FilterOption[] => {
    const extractedFilters: FilterOption[] = [
      { id: `${field}_contains_any`, type: "ANY_OF" as const, values: [] as string[], enabled: false },
      { id: `${field}_contains_all`, type: "ALL_OF" as const, values: [] as string[], enabled: false },
      { id: `${field}_contains_none`, type: "NONE_OF" as const, values: [] as string[], enabled: false },
    ];

    // Find filter groups that match our field
    const findMatchingConditions = (group: FilterGroup): FilterCondition[] => {
      const matchingConditions: FilterCondition[] = [];
      
      group.conditions.forEach(condition => {
        if ('field' in condition && condition.field === field) {
          matchingConditions.push(condition);
        } else if ('conditions' in condition) {
          // Check if this is a filter group for our field
          const isFieldGroup = condition.conditions.every(cond => 
            'field' in cond && cond.field === field
          );
          if (isFieldGroup) {
            condition.conditions.forEach(cond => {
              if ('field' in cond) {
                matchingConditions.push(cond);
              }
            });
          }
        }
      });
      
      return matchingConditions;
    };

    const matchingConditions = findMatchingConditions(filters);
    
    matchingConditions.forEach(condition => {
      if (condition.operator === "IN") {
        // ANY_OF (IN operator)
        const anyFilter = extractedFilters.find(f => f.type === "ANY_OF");
        if (anyFilter && Array.isArray(condition.value)) {
          anyFilter.values = condition.value.map(String);
          anyFilter.enabled = anyFilter.values.length > 0;
        }
      } else if (condition.operator === "NOT IN") {
        // NONE_OF (NOT IN operator)
        const noneFilter = extractedFilters.find(f => f.type === "NONE_OF");
        if (noneFilter && Array.isArray(condition.value)) {
          noneFilter.values = condition.value.map(String);
          noneFilter.enabled = noneFilter.values.length > 0;
        }
      } else if (condition.operator === "LIKE") {
        // ALL_OF (LIKE operator with % wrapping)
        const allFilter = extractedFilters.find(f => f.type === "ALL_OF");
        if (allFilter && typeof condition.value === 'string') {
          const cleanValue = condition.value.replace(/^%|%$/g, '');
          if (!allFilter.values.includes(cleanValue)) {
            allFilter.values.push(cleanValue);
            allFilter.enabled = true;
          }
        }
      }
    });

    return extractedFilters;
  }, [field]);

  // Reset filters when resetKey changes or sync with currentFilters
  useEffect(() => {
    if (resetKey !== lastResetKey) {
      if (currentFilters && currentFilters.conditions.length > 0) {
        // Sync with loaded query
        const syncedFilters = extractFiltersFromQuery(currentFilters);
        setFilters(syncedFilters);
      } else {
        // Reset to empty state
        const resetFilters = [
          { id: `${field}_contains_any`, type: "ANY_OF" as const, values: [], enabled: false },
          { id: `${field}_contains_all`, type: "ALL_OF" as const, values: [], enabled: false },
          { id: `${field}_contains_none`, type: "NONE_OF" as const, values: [], enabled: false },
        ];
        setFilters(resetFilters);
      }
      setLastResetKey(resetKey);
    }
  }, [resetKey, lastResetKey, field, currentFilters, extractFiltersFromQuery]);

  const updateFilter = (id: string, updates: Partial<FilterOption>) => {
    const newFilters = filters.map(filter => 
      filter.id === id ? { ...filter, ...updates } : filter
    );
    setFilters(newFilters);
    onChange?.(newFilters);
  };

  const toggleFilter = (id: string) => {
    const newFilters = filters.map(filter => 
      filter.id === id ? { ...filter, enabled: !filter.enabled } : filter
    );
    setFilters(newFilters);
    onChange?.(newFilters);
  };

  const getFilterLabel = (type: FilterOption["type"]) => {
    switch (type) {
      case "ANY_OF": return "Contains Any";
      case "ALL_OF": return "Contains All";
      case "NONE_OF": return "Contains None";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">{title}</h3>
      </div>

      {filters.map((filter) => (
        <div key={filter.id} className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={filter.id}
              checked={filter.enabled}
              onChange={() => toggleFilter(filter.id)}
              disabled={disabled}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 disabled:opacity-50"
            />
            <label htmlFor={filter.id} className="text-sm font-medium text-gray-700">
              {getFilterLabel(filter.type)}
            </label>
          </div>

          {filter.enabled && (
            <div className="ml-6">
              <MultiValueInput
                values={filter.values}
                onChange={(values) => updateFilter(filter.id, { values })}
                placeholder={placeholder}
                field={field}
                useTypeahead={useTypeahead}
                disabled={disabled}
              />
            </div>
          )}
        </div>
      ))}

      {/* Suggested values section */}
      <div className="pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500 mb-2">
          {disabled ? 'Loading suggestions...' : `Suggested ${title.toLowerCase()}`}
        </div>
        <div className="flex flex-wrap gap-2">
          {getSuggestedValues(field).map((suggestion) => (
            <Button
              key={suggestion}
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={disabled}
              onClick={() => {
                // Add to the first enabled filter, or enable "Contains Any" if none are enabled
                const enabledFilter = filters.find(f => f.enabled);
                let newFilters;
                if (enabledFilter) {
                  if (!enabledFilter.values.includes(suggestion)) {
                    newFilters = filters.map(filter => 
                      filter.id === enabledFilter.id 
                        ? { ...filter, values: [...filter.values, suggestion] }
                        : filter
                    );
                  } else {
                    newFilters = filters;
                  }
                } else {
                  // Enable "Contains Any" and add the suggestion
                  newFilters = filters.map(filter => 
                    filter.type === "ANY_OF" 
                      ? { ...filter, enabled: true, values: [suggestion] }
                      : filter
                  );
                }
                setFilters(newFilters);
                onChange?.(newFilters);
              }}
            >
              {suggestion} <Plus className="w-3 h-3 ml-1" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

function getSuggestedValues(field: SearchField): string[] {
  switch (field) {
    case "tech_category":
      return ["Analytics", "CRM", "E-commerce", "Marketing Automation", "Cloud Services", "Security"];
    case "tech_name":
      return ["React", "Salesforce", "AWS", "Google Analytics", "Shopify", "Stripe"];
    case "company_category":
      return ["SaaS", "E-commerce", "Fintech", "Healthcare", "Education", "Marketing"];
    default:
      return [];
  }
}
