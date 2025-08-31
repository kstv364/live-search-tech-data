import React, { useState } from "react";
import { FilterCondition, SearchField } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { MultiValueInput } from "@/components/ui/multi-value-input";

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
    onChange({ ...filterCondition, operator });
  };

  const handleValueChange = (value: string | number | (string | number)[]) => {
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
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes (Premium)</SelectItem>
            <SelectItem value="No">No (Free)</SelectItem>
          </SelectContent>
        </Select>
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
          <div className="flex gap-2">
            <Input
              type="date"
              placeholder="Start date"
              value={start}
              onChange={(e) => handleValueChange([e.target.value, end])}
            />
            <Input
              type="date"
              placeholder="End date"
              value={end}
              onChange={(e) => handleValueChange([start, e.target.value])}
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
        />
      );
    }

    if (NUMBER_FIELDS.includes(filterCondition.field)) {
      if (filterCondition.operator === "BETWEEN") {
        const [start, end] = Array.isArray(filterCondition.value) ? filterCondition.value : [filterCondition.value, ""];
        const isSpendField = filterCondition.field === "spend";
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder={isSpendField ? "Min amount ($)" : "Minimum"}
              value={start}
              onChange={(e) => handleValueChange([Number(e.target.value), end])}
            />
            <Input
              type="number"
              placeholder={isSpendField ? "Max amount ($)" : "Maximum"}
              value={end}
              onChange={(e) => handleValueChange([start, Number(e.target.value)])}
            />
          </div>
        );
      }
      
      if (["IN", "NOT IN"].includes(filterCondition.operator)) {
        const displayValue = Array.isArray(filterCondition.value) 
          ? filterCondition.value.join(", ") 
          : typeof filterCondition.value === 'string' 
            ? filterCondition.value 
            : String(filterCondition.value);
        
        const isSpendField = filterCondition.field === "spend";
        return (
          <Input
            placeholder={isSpendField ? "e.g., 1000, 5000, 10000" : "e.g., 1, 2, 3"}
            value={displayValue}
            onChange={(e) => handleValueChange(e.target.value.split(",").map(v => Number(v.trim())).filter(n => !isNaN(n)))}
          />
        );
      }
      
      const numberValue = typeof filterCondition.value === 'number' ? filterCondition.value : 0;
      const isSpendField = filterCondition.field === "spend";
      return (
        <Input
          type="number"
          placeholder={isSpendField ? "Amount in USD" : "Enter number"}
          value={numberValue}
          onChange={(e) => handleValueChange(Number(e.target.value))}
        />
      );
    }

    if (["IN", "NOT IN"].includes(filterCondition.operator)) {
      const displayValue = Array.isArray(filterCondition.value) 
        ? filterCondition.value.join(", ") 
        : typeof filterCondition.value === 'string' 
          ? filterCondition.value 
          : String(filterCondition.value);
      
      return (
        <Input
          placeholder="Separate multiple values with commas"
          value={displayValue}
          onChange={(e) => handleValueChange(e.target.value.split(",").map(v => v.trim()))}
        />
      );
    }

    if (filterCondition.operator === "BETWEEN") {
      const [start, end] = Array.isArray(filterCondition.value) ? filterCondition.value : [filterCondition.value, ""];
      return (
        <div className="flex gap-2">
          <Input
            placeholder="Start value"
            value={start}
            onChange={(e) => handleValueChange([e.target.value, end])}
          />
          <Input
            placeholder="End value"
            value={end}
            onChange={(e) => handleValueChange([start, e.target.value])}
          />
        </div>
      );
    }

    const stringValue = typeof filterCondition.value === 'string' ? filterCondition.value : String(filterCondition.value || '');
    
    // Get appropriate placeholder based on field
    let placeholder = "Enter value";
    if (filterCondition.field === "company_name") placeholder = "e.g., Google, Microsoft";
    else if (filterCondition.field === "root_domain") placeholder = "e.g., google.com";
    else if (filterCondition.field === "tech_name") placeholder = "e.g., React, jQuery";
    else if (filterCondition.field === "description") placeholder = "Search in technology description";
    else if (filterCondition.operator === "LIKE") placeholder = "Enter text to search";
    
    return (
      <Input
        type="text"
        placeholder={placeholder}
        value={stringValue}
        onChange={(e) => handleValueChange(e.target.value)}
      />
    );
  };

  // Get available operators for current field
  const availableOperators = getOperatorsForField(filterCondition.field);

  return (
    <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
      <Select value={filterCondition.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select field" />
        </SelectTrigger>
        <SelectContent>
          <div className="text-xs font-medium text-muted-foreground px-2 py-1">Company Fields</div>
          {FIELDS.filter(field => field.category === "Company").map(field => (
            <SelectItem key={field.value} value={field.value}>
              {field.label}
            </SelectItem>
          ))}
          <div className="text-xs font-medium text-muted-foreground px-2 py-1 border-t mt-1 pt-1">Technology Fields</div>
          {FIELDS.filter(field => field.category === "Technology").map(field => (
            <SelectItem key={field.value} value={field.value}>
              {field.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filterCondition.operator} onValueChange={handleOperatorChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Select operator" />
        </SelectTrigger>
        <SelectContent>
          {availableOperators.map(op => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex-1">
        {renderValueInput()}
      </div>
    </div>
  );
};
