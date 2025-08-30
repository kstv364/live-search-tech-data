import React from "react";
import { FilterGroup, FilterCondition, SearchField } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import FilterConditionComponent from "./FilterConditionComponent";

interface FilterGroupComponentProps {
  filterGroup: FilterGroup;
  onChange: (updatedFilterGroup: FilterGroup) => void;
}

const FilterGroupComponent: React.FC<FilterGroupComponentProps> = ({ filterGroup, onChange }) => {
  const handleAddCondition = () => {
    onChange({
      ...filterGroup,
      conditions: [...(filterGroup.conditions || []), { field: "company_name", operator: "=", value: "" }],
    });
  };

  const handleOperatorChange = (operator: "AND" | "OR" | "NOT") => {
    onChange({ ...filterGroup, operator });
  };

  const handleConditionChange = (index: number, updatedFilterCondition: FilterCondition) => {
    const newConditions = [...(filterGroup.conditions || [])];
    newConditions[index] = updatedFilterCondition;
    onChange({ ...filterGroup, conditions: newConditions });
  };

  return (
    <div className="border p-4 rounded-md">
      <div className="flex items-center mb-2">
        <Select onValueChange={handleOperatorChange} defaultValue={filterGroup.operator}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select operator" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND">AND</SelectItem>
            <SelectItem value="OR">OR</SelectItem>
            <SelectItem value="NOT">NOT</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleAddCondition} className="ml-2">Add Condition</Button>
      </div>
      <div>
        {filterGroup.conditions?.filter(Boolean).map((condition, index) => (
          <FilterConditionComponent
            key={index}
            filterCondition={condition as FilterCondition}
            onChange={(updatedFilterCondition) => handleConditionChange(index, updatedFilterCondition)}
          />
        ))}
      </div>
    </div>
  );
};

export default FilterGroupComponent;
