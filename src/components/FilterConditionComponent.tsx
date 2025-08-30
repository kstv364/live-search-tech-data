import React from "react";
import { FilterCondition, SearchField } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";

interface FilterConditionComponentProps {
  filterCondition: FilterCondition;
  onChange: (updatedFilterCondition: FilterCondition) => void;
}

const FilterConditionComponent: React.FC<FilterConditionComponentProps> = ({ filterCondition, onChange }) => {
  const handleFieldChange = (field: SearchField) => {
    onChange({ ...filterCondition, field });
  };

  const handleOperatorChange = (operator: FilterCondition["operator"]) => {
    onChange({ ...filterCondition, operator });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filterCondition, value: e.target.value as string });
  };

  return (
    <div className="flex items-center mb-2">
      <Select onValueChange={handleFieldChange} defaultValue={filterCondition.field}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select field" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="company_name">Company Name</SelectItem>
          <SelectItem value="root_domain">Root Domain</SelectItem>
          <SelectItem value="company_category">Company Category</SelectItem>
          <SelectItem value="country">Country</SelectItem>
          <SelectItem value="city">City</SelectItem>
          <SelectItem value="state">State</SelectItem>
          <SelectItem value="postal_code">Postal Code</SelectItem>
          <SelectItem value="spend">Spend</SelectItem>
          <SelectItem value="first_indexed">First Indexed</SelectItem>
          <SelectItem value="last_indexed">Last Indexed</SelectItem>
          <SelectItem value="tech_name">Tech Name</SelectItem>
          <SelectItem value="tech_category">Tech Category</SelectItem>
          <SelectItem value="parent_tech_name">Parent Tech Name</SelectItem>
          <SelectItem value="premium">Premium</SelectItem>
          <SelectItem value="description">Description</SelectItem>
          <SelectItem value="tech_count_in_category">Tech Count In Category</SelectItem>
        </SelectContent>
      </Select>

      <Select onValueChange={handleOperatorChange} defaultValue={filterCondition.operator as string}>
        <SelectTrigger className="w-[120px] ml-2">
          <SelectValue placeholder="Select operator" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="=">=</SelectItem>
          <SelectItem value="!=">!=</SelectItem>
          <SelectItem value="IN">IN</SelectItem>
          <SelectItem value="NOT IN">NOT IN</SelectItem>
          <SelectItem value="LIKE">LIKE</SelectItem>
          <SelectItem value=">">greater than</SelectItem>
          <SelectItem value="<">less than</SelectItem>
          <SelectItem value=">=">greater than or equal to</SelectItem>
          <SelectItem value="<=">less than or equal to</SelectItem>
          <SelectItem value="BETWEEN">BETWEEN</SelectItem>
        </SelectContent>
      </Select>

      <div className="ml-2 w-[200px]">
        <AutocompleteInput
          field={filterCondition.field}
          value={filterCondition.value as string}
          onChange={(value) => onChange({ ...filterCondition, value })}
          onSelect={(value) => onChange({ ...filterCondition, value })}
        />
      </div>
    </div>
  );
};

export default FilterConditionComponent;
