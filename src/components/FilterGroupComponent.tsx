import React from "react";
import { FilterGroup, FilterCondition, SearchField } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FilterConditionComponent } from "./FilterConditionComponent";
import { Card } from "@/components/ui/card";
import { X, Plus } from "lucide-react";

interface FilterGroupComponentProps {
  filterGroup: FilterGroup;
  onChange: (updatedFilterGroup: FilterGroup) => void;
  onRemove?: () => void;
  depth?: number;
}

const FilterGroupComponent: React.FC<FilterGroupComponentProps> = ({ 
  filterGroup, 
  onChange, 
  onRemove,
  depth = 0 
}) => {
  const handleAddCondition = () => {
    onChange({
      ...filterGroup,
      conditions: [...(filterGroup.conditions || []), { field: "company_name", operator: "=", value: "" }],
    });
  };

  const handleAddGroup = () => {
    onChange({
      ...filterGroup,
      conditions: [
        ...(filterGroup.conditions || []),
        {
          operator: "AND",
          conditions: []
        }
      ]
    });
  };

  const handleOperatorChange = (operator: "AND" | "OR" | "NOT") => {
    onChange({ ...filterGroup, operator });
  };

  const handleConditionChange = (index: number, updatedCondition: FilterCondition | FilterGroup) => {
    const newConditions = [...(filterGroup.conditions || [])];
    newConditions[index] = updatedCondition;
    onChange({ ...filterGroup, conditions: newConditions });
  };

  const handleRemoveCondition = (index: number) => {
    const newConditions = filterGroup.conditions.filter((_, i) => i !== index);
    onChange({ ...filterGroup, conditions: newConditions });
  };

  return (
    <Card className={`p-4 ${depth > 0 ? 'mt-2' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Select onValueChange={handleOperatorChange} value={filterGroup.operator}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Operator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">AND</SelectItem>
              <SelectItem value="OR">OR</SelectItem>
              <SelectItem value="NOT">NOT</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button onClick={handleAddCondition} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Condition
            </Button>
            {depth < 2 && (
              <Button onClick={handleAddGroup} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Group
              </Button>
            )}
          </div>
        </div>
        {onRemove && (
          <Button onClick={onRemove} variant="ghost" size="icon">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        {filterGroup.conditions?.map((condition, index) => (
          <div key={index} className="relative">
            {'conditions' in condition ? (
              // This is a nested filter group
              <FilterGroupComponent
                filterGroup={condition as FilterGroup}
                onChange={(updated) => handleConditionChange(index, updated)}
                onRemove={() => handleRemoveCondition(index)}
                depth={depth + 1}
              />
            ) : (
              // This is a filter condition
              <div className="flex items-center gap-2">
                <FilterConditionComponent
                  filterCondition={condition as FilterCondition}
                  onChange={(updated) => handleConditionChange(index, updated)}
                />
                <Button 
                  onClick={() => handleRemoveCondition(index)} 
                  variant="ghost" 
                  size="icon"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default FilterGroupComponent;
