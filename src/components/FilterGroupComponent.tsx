import React, { useCallback } from "react";
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
  setOpen: (open: boolean) => void;
}

const FilterGroupComponent: React.FC<FilterGroupComponentProps> = ({ 
  filterGroup, 
  onChange, 
  onRemove,
  depth = 0,
  setOpen
}) => {
  const handleAddCondition = useCallback(() => {
    onChange({
      ...filterGroup,
      conditions: [...(filterGroup.conditions || []), { field: "company_name", operator: "=", value: "" }],
    });
  }, [filterGroup, onChange]);

  const handleAddGroup = useCallback(() => {
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
  }, [filterGroup, onChange]);

  const handleOperatorChange = useCallback((operator: "AND" | "OR" | "NOT") => {
    onChange({ ...filterGroup, operator });
  }, [filterGroup, onChange]);

  const handleConditionChange = useCallback((index: number, updatedCondition: FilterCondition | FilterGroup) => {
    const newConditions = [...(filterGroup.conditions || [])];
    newConditions[index] = updatedCondition;
    onChange({ ...filterGroup, conditions: newConditions });
  }, [filterGroup, onChange]);

  const handleRemoveCondition = useCallback((index: number) => {
    const newConditions = filterGroup.conditions.filter((_, i) => i !== index);
    onChange({ ...filterGroup, conditions: newConditions });
  }, [filterGroup, onChange]);

  return (
    <Card className={`p-3 ${depth > 0 ? 'mt-2' : ''}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <Select 
            defaultValue={filterGroup.operator} 
            onValueChange={handleOperatorChange}
          >
            <SelectTrigger className="w-[80px] h-8 text-xs">
              <SelectValue>
                {filterGroup.operator}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND" className="text-xs">AND</SelectItem>
              <SelectItem value="OR" className="text-xs">OR</SelectItem>
              <SelectItem value="NOT" className="text-xs">NOT</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleAddCondition} variant="outline" size="sm" className="flex-shrink-0 h-8 text-xs px-2">
              <Plus className="h-3 w-3 mr-1" />
              Add Condition
            </Button>
            {depth < 2 && (
              <Button onClick={handleAddGroup} variant="outline" size="sm" className="flex-shrink-0 h-8 text-xs px-2">
                <Plus className="h-3 w-3 mr-1" />
                Add Group
              </Button>
            )}
          </div>
        </div>
        {onRemove && (
          <Button onClick={onRemove} variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
            <X className="h-3 w-3" />
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
              setOpen={setOpen}   // ✅ forward down
            />

            ) : (
              // This is a filter condition
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="w-full sm:flex-1">
                  <FilterConditionComponent
                    filterCondition={condition as FilterCondition}
                    onChange={(updated) => handleConditionChange(index, updated)}
                    setOpen={setOpen}
                  />
                </div>
                <Button 
                  onClick={() => handleRemoveCondition(index)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 mt-1 sm:mt-0"
                >
                  <X className="h-3 w-3" />
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
