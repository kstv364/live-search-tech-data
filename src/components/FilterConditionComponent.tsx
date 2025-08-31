import React, { useState } from "react";
import { FilterCondition, SearchField } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { MultiValueInput } from "@/components/ui/multi-value-input";
import { FilterMultiValueInput } from "@/components/ui/filter-multi-value-input";

interface FilterConditionComponentProps {
  filterCondition: FilterCondition;
  onChange: (updatedFilterCondition: FilterCondition) => void;
  setOpen?: (open: boolean) => void;
}

const FIELDS: Array<{ value: SearchField; label: string; category: string }> = [
  // Company Information
  { value: "company_name", label: "Company Name", category: "Company" },
  { value: "root_domain", label: "Root Domain", category: "Company" },
  { value: "company_category", label: "Company Category", category: "Company" },
  { value: "country", label: "Country", category: "Company" },
  { value: "city", label: "City", category: "Company" },
  { value: "state", label: "State/Province", category: "Company" },
  { value: "postal_code", label: "Postal Code", category: "Company" },
  { value: "spend", label: "Company Spend ($)", category: "Company" },
  { value: "first_indexed", label: "First Indexed Date", category: "Company" },
  { value: "last_indexed", label: "Last Indexed Date", category: "Company" },
  
  // Technology Information
  { value: "tech_name", label: "Technology Name", category: "Technology" },
  { value: "tech_category", label: "Technology Category", category: "Technology" },
  { value: "parent_tech_name", label: "Parent Technology", category: "Technology" },
  { value: "premium", label: "Premium Technology", category: "Technology" },
  { value: "description", label: "Technology Description", category: "Technology" },
];

// Field type definitions based on database schema
const FIELD_TYPES = {
  // TEXT fields - support all text operations
  TEXT: ["company_name", "root_domain", "company_category", "country", "city", "state", "postal_code", "tech_name", "tech_category", "parent_tech_name", "description"] as SearchField[],
  // INTEGER/NUMBER fields - support numerical operations
  INTEGER: ["spend"] as SearchField[],
  // DATE fields - support date operations
  DATE: ["first_indexed", "last_indexed"] as SearchField[],
  // BOOLEAN-like fields (premium is Yes/No in the data)
  BOOLEAN: ["premium"] as SearchField[],
} as const;

// Get operators available for a specific field type
const getOperatorsForField = (field: SearchField): Array<{ value: FilterCondition["operator"]; label: string }> => {
  if (FIELD_TYPES.TEXT.includes(field)) {
    return [
      { value: "=", label: "equals" },
      { value: "!=", label: "not equals" },
      { value: "LIKE", label: "contains" },
      { value: "IN", label: "in list" },
      { value: "NOT IN", label: "not in list" },
    ];
  }
  
  if (FIELD_TYPES.INTEGER.includes(field)) {
    return [
      { value: "=", label: "equals" },
      { value: "!=", label: "not equals" },
      { value: ">", label: "greater than" },
      { value: "<", label: "less than" },
      { value: ">=", label: "greater than or equal" },
      { value: "<=", label: "less than or equal" },
      { value: "BETWEEN", label: "between" },
      { value: "IN", label: "in list" },
      { value: "NOT IN", label: "not in list" },
    ];
  }
  
  if (FIELD_TYPES.DATE.includes(field)) {
    return [
      { value: "=", label: "equals" },
      { value: "!=", label: "not equals" },
      { value: ">", label: "after" },
      { value: "<", label: "before" },
      { value: ">=", label: "on or after" },
      { value: "<=", label: "on or before" },
      { value: "BETWEEN", label: "between dates" },
    ];
  }
  
  if (FIELD_TYPES.BOOLEAN.includes(field)) {
    return [
      { value: "=", label: "is" },
      { value: "!=", label: "is not" },
    ];
  }
  
  // Default fallback
  return [
    { value: "=", label: "equals" },
    { value: "!=", label: "not equals" },
    { value: "LIKE", label: "contains" },
  ];
};

const OPERATORS: Array<{ value: FilterCondition["operator"]; label: string }> = [
  { value: "=", label: "equals" },
  { value: "!=", label: "not equals" },
  { value: "IN", label: "in list" },
  { value: "NOT IN", label: "not in list" },
  { value: "LIKE", label: "contains" },
  { value: ">", label: "greater than" },
  { value: "<", label: "less than" },
  { value: ">=", label: "greater than or equal" },
  { value: "<=", label: "less than or equal" },
  { value: "BETWEEN", label: "between" },
];

// Fields that should use typeahead (all TEXT fields)
const TYPEAHEAD_FIELDS: SearchField[] = [
  "company_name",
  "root_domain", 
  "company_category",
  "country",
  "city",
  "state",
  "postal_code",
  "tech_name",
  "tech_category",
  "parent_tech_name",
  "description"
];

// Fields that should use date input
const DATE_FIELDS: SearchField[] = [
  "first_indexed",
  "last_indexed"
];

// Fields that should use number input
const NUMBER_FIELDS: SearchField[] = [
  "spend"
];

export const FilterConditionComponent: React.FC<FilterConditionComponentProps> = ({ 
  filterCondition, 
  onChange,
  setOpen
}) => {
  const handleFieldChange = (field: SearchField) => {
    // Reset operator to first available for the new field type
    const availableOperators = getOperatorsForField(field);
    const newOperator = availableOperators.length > 0 ? availableOperators[0].value : "=";
    onChange({ ...filterCondition, field, operator: newOperator, value: "" });
  };

  const handleOperatorChange = (operator: FilterCondition["operator"]) => {
    let newValue = filterCondition.value;
    
    // When switching to IN/NOT IN, ensure value is an array
    if ((operator === "IN" || operator === "NOT IN")) {
      if (!Array.isArray(newValue)) {
        newValue = newValue ? [newValue] : [];
      }
    }
    // When switching from IN/NOT IN to other operators, convert array to single value
    else if ((filterCondition.operator === "IN" || filterCondition.operator === "NOT IN") && Array.isArray(newValue)) {
      newValue = newValue.length > 0 ? newValue[0] : "";
    }
    
    onChange({ ...filterCondition, operator, value: newValue });
  };

  const handleValueChange = (value: string | number | (string | number)[]) => {
    console.log("handleValueChange called with:", value, "operator:", filterCondition.operator);
    onChange({ ...filterCondition, value });
  };

  const renderValueInput = () => {
    // Special handling for premium field (boolean-like)
    if (filterCondition.field === "premium") {
      return (
        <Select 
          value={typeof filterCondition.value === 'string' ? filterCondition.value : ''} 
          onValueChange={handleValueChange}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes" className="text-xs">Yes (Premium)</SelectItem>
            <SelectItem value="No" className="text-xs">No (Free)</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    // Handle IN/NOT IN operators first (before field-specific logic)
    if (["IN", "NOT IN"].includes(filterCondition.operator)) {
      // Ensure we always have an array for IN/NOT IN operations
      let currentValues: (string | number)[];
      if (Array.isArray(filterCondition.value)) {
        currentValues = filterCondition.value;
      } else if (filterCondition.value !== null && filterCondition.value !== undefined && filterCondition.value !== "") {
        currentValues = [filterCondition.value];
      } else {
        currentValues = [];
      }
      
      const useTypeahead = TYPEAHEAD_FIELDS.includes(filterCondition.field);
      const isNumberField = NUMBER_FIELDS.includes(filterCondition.field);
      
      return (
        <FilterMultiValueInput
          values={currentValues}
          onChange={handleValueChange}
          placeholder="Add multiple values..."
          field={filterCondition.field}
          useTypeahead={useTypeahead}
          type={isNumberField ? "number" : "text"}
        />
      );
    }
    
    if (TYPEAHEAD_FIELDS.includes(filterCondition.field)) {
      // Ensure value is always a string for AutocompleteInput
      const stringValue = typeof filterCondition.value === 'string' ? filterCondition.value : '';
      
      const Autocomplete = (
        <AutocompleteInput
          field={filterCondition.field}
          value={stringValue}
          onChange={handleValueChange}
          onSelect={(val) => {
            handleValueChange(val);
            if (setOpen) setOpen(false);
          }}
        />
      );
      return Autocomplete;
    }

    if (DATE_FIELDS.includes(filterCondition.field)) {
      if (filterCondition.operator === "BETWEEN") {
        const [start, end] = Array.isArray(filterCondition.value) ? filterCondition.value : [filterCondition.value, ""];
        return (
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="date"
              placeholder="Start date"
              value={start}
              onChange={(e) => handleValueChange([e.target.value, end])}
              className="h-8 text-xs"
            />
            <Input
              type="date"
              placeholder="End date"
              value={end}
              onChange={(e) => handleValueChange([start, e.target.value])}
              className="h-8 text-xs"
            />
          </div>
        );
      }
      
      const stringValue = typeof filterCondition.value === 'string' ? filterCondition.value : '';
      return (
        <Input
          type="date"
          value={stringValue}
          placeholder="Select date"
          onChange={(e) => handleValueChange(e.target.value)}
          className="h-8 text-xs"
        />
      );
    }

    if (NUMBER_FIELDS.includes(filterCondition.field)) {
      if (filterCondition.operator === "BETWEEN") {
        const [start, end] = Array.isArray(filterCondition.value) ? filterCondition.value : [filterCondition.value, ""];
        const isSpendField = filterCondition.field === "spend";
        return (
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="number"
              placeholder={isSpendField ? "Min ($)" : "Min"}
              value={start}
              onChange={(e) => handleValueChange([Number(e.target.value), end])}
              className="h-8 text-xs"
            />
            <Input
              type="number"
              placeholder={isSpendField ? "Max ($)" : "Max"}
              value={end}
              onChange={(e) => handleValueChange([start, Number(e.target.value)])}
              className="h-8 text-xs"
            />
          </div>
        );
      }
      
      const numberValue = typeof filterCondition.value === 'number' ? filterCondition.value : 0;
      const isSpendField = filterCondition.field === "spend";
      return (
        <Input
          type="number"
          placeholder={isSpendField ? "Amount ($)" : "Number"}
          value={numberValue}
          onChange={(e) => handleValueChange(Number(e.target.value))}
          className="h-8 text-xs"
        />
      );
    }

    if (filterCondition.operator === "BETWEEN") {
      const [start, end] = Array.isArray(filterCondition.value) ? filterCondition.value : [filterCondition.value, ""];
      return (
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Start"
            value={start}
            onChange={(e) => handleValueChange([e.target.value, end])}
            className="h-8 text-xs"
          />
          <Input
            placeholder="End"
            value={end}
            onChange={(e) => handleValueChange([start, e.target.value])}
            className="h-8 text-xs"
          />
        </div>
      );
    }

    const stringValue = typeof filterCondition.value === 'string' ? filterCondition.value : String(filterCondition.value || '');
    
    // Get appropriate placeholder based on field
    let placeholder = "Enter value";
    if (filterCondition.field === "company_name") placeholder = "e.g., Google";
    else if (filterCondition.field === "root_domain") placeholder = "e.g., google.com";
    else if (filterCondition.field === "tech_name") placeholder = "e.g., React";
    else if (filterCondition.field === "description") placeholder = "Search description";
    else if (filterCondition.operator === "LIKE") placeholder = "Search text";
    
    return (
      <Input
        type="text"
        placeholder={placeholder}
        value={stringValue}
        onChange={(e) => handleValueChange(e.target.value)}
        className="h-8 text-xs"
      />
    );
  };

  // Get available operators for current field
  const availableOperators = getOperatorsForField(filterCondition.field);

  return (
    <div className="flex flex-col gap-2 bg-muted/50 p-2 rounded-md text-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="w-full sm:w-auto sm:min-w-[140px] sm:max-w-[160px]">
          <Select value={filterCondition.field} onValueChange={handleFieldChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              <div className="text-xs font-medium text-muted-foreground px-2 py-1">Company Fields</div>
              {FIELDS.filter(field => field.category === "Company").map(field => (
                <SelectItem key={field.value} value={field.value} className="text-xs">
                  {field.label}
                </SelectItem>
              ))}
              <div className="text-xs font-medium text-muted-foreground px-2 py-1 border-t mt-1 pt-1">Technology Fields</div>
              {FIELDS.filter(field => field.category === "Technology").map(field => (
                <SelectItem key={field.value} value={field.value} className="text-xs">
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-auto sm:min-w-[100px] sm:max-w-[120px]">
          <Select value={filterCondition.operator} onValueChange={handleOperatorChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent>
              {availableOperators.map(op => (
                <SelectItem key={op.value} value={op.value} className="text-xs">
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="w-full relative z-10">
        {renderValueInput()}
      </div>
    </div>
  );
};
