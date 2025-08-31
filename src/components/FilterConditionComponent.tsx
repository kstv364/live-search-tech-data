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

const FIELDS: Array<{ value: SearchField; label: string }> = [
  { value: "company_name", label: "Company Name" },
  { value: "root_domain", label: "Root Domain" },
  { value: "company_category", label: "Company Category" },
  { value: "country", label: "Country" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
  { value: "postal_code", label: "Postal Code" },
  { value: "spend", label: "Spend" },
  { value: "first_indexed", label: "First Indexed" },
  { value: "last_indexed", label: "Last Indexed" },
  { value: "tech_name", label: "Tech Name" },
  { value: "tech_category", label: "Tech Category" },
  { value: "parent_tech_name", label: "Parent Tech Name" },
  { value: "premium", label: "Premium" },
  { value: "description", label: "Description" },
  { value: "tech_count_in_category", label: "Tech Count In Category" },
];

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

// Fields that should use typeahead
const TYPEAHEAD_FIELDS: SearchField[] = [
  "company_name",
  "root_domain",
  "tech_name",
  "tech_category",
  "company_category",
  "country"
];

// Fields that should use date input
const DATE_FIELDS: SearchField[] = [
  "first_indexed",
  "last_indexed"
];

// Fields that should use number input
const NUMBER_FIELDS: SearchField[] = [
  "spend",
  "tech_count_in_category"
];

export const FilterConditionComponent: React.FC<FilterConditionComponentProps> = ({ 
  filterCondition, 
  onChange,
  setOpen
}) => {
  const handleFieldChange = (field: SearchField) => {
    onChange({ ...filterCondition, field, value: "" });
  };

  const handleOperatorChange = (operator: FilterCondition["operator"]) => {
    onChange({ ...filterCondition, operator });
  };

  const handleValueChange = (value: string | number | (string | number)[]) => {
    onChange({ ...filterCondition, value });
  };

  const renderValueInput = () => {
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
      const stringValue = typeof filterCondition.value === 'string' ? filterCondition.value : '';
      return (
        <Input
          type="date"
          value={stringValue}
          onChange={(e) => handleValueChange(e.target.value)}
        />
      );
    }

    if (NUMBER_FIELDS.includes(filterCondition.field)) {
      const numberValue = typeof filterCondition.value === 'number' ? filterCondition.value : 0;
      return (
        <Input
          type="number"
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
          placeholder="Comma-separated values"
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
            placeholder="Start"
            value={start}
            onChange={(e) => handleValueChange([e.target.value, end])}
          />
          <Input
            placeholder="End"
            value={end}
            onChange={(e) => handleValueChange([start, e.target.value])}
          />
        </div>
      );
    }

    const stringValue = typeof filterCondition.value === 'string' ? filterCondition.value : String(filterCondition.value || '');
    return (
      <Input
        type="text"
        value={stringValue}
        onChange={(e) => handleValueChange(e.target.value)}
      />
    );
  };

  return (
    <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
      <Select value={filterCondition.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select field" />
        </SelectTrigger>
        <SelectContent>
          {FIELDS.map(field => (
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
          {OPERATORS.map(op => (
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
