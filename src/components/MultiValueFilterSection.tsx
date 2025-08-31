"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MultiValueInput } from "@/components/ui/multi-value-input";
import { SearchField } from "@/lib/types";
import { X, Plus } from "lucide-react";

interface MultiValueFilterSectionProps {
  title: string;
  field: SearchField;
  useTypeahead?: boolean;
  placeholder?: string;
  onChange?: (filters: FilterOption[]) => void;
  disabled?: boolean;
  resetKey?: string | number; // Add this to force reset when needed
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
}) => {
  const [filters, setFilters] = useState<FilterOption[]>([
    { id: "contains_any", type: "ANY_OF", values: [], enabled: false },
    { id: "contains_all", type: "ALL_OF", values: [], enabled: false },
    { id: "contains_none", type: "NONE_OF", values: [], enabled: false },
  ]);

  // Reset filters when resetKey changes
  useEffect(() => {
    if (resetKey === 'reset') {
      const resetFilters = [
        { id: "contains_any", type: "ANY_OF" as const, values: [], enabled: false },
        { id: "contains_all", type: "ALL_OF" as const, values: [], enabled: false },
        { id: "contains_none", type: "NONE_OF" as const, values: [], enabled: false },
      ];
      setFilters(resetFilters);
    }
  }, [resetKey, field]);

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
