"use client";

import React, { useState } from "react";
import { SearchObject, FilterGroup, FilterCondition } from "@/lib/types";
import { Button } from "@/components/ui/button";
import FilterGroupComponent from "./FilterGroupComponent";

interface FilterBuilderProps {
  onChange: (filter: SearchObject) => void;
}

const FilterBuilder: React.FC<FilterBuilderProps> = ({ onChange }) => {
  const [searchObject, setSearchObject] = useState<SearchObject>({
    filters: {
      operator: "AND",
      conditions: [],
    },
  });

  const handleAddFilterGroup = () => {
    setSearchObject((prevSearchObject) => ({
      ...prevSearchObject,
      filters: {
        ...prevSearchObject.filters,
        conditions: [
          ...(prevSearchObject.filters.conditions || []),
          {
            operator: "AND",
            conditions: [],
          },
        ],
      },
    }));
  };

  const handleFilterGroupChange = (index: number, updatedFilterGroup: FilterGroup) => {
    setSearchObject((prevSearchObject) => {
      const newConditions = [...prevSearchObject.filters.conditions];
      newConditions[index] = updatedFilterGroup;
      return {
        ...prevSearchObject,
        filters: {
          ...prevSearchObject.filters,
          conditions: newConditions,
        },
      };
    });
  };

  const handleConditionChange = (groupIndex: number, conditionIndex: number, updatedCondition: FilterCondition) => {
    setSearchObject((prevSearchObject) => {
      const newFilterGroups = [...(prevSearchObject.filters.conditions || [])];
      const currentGroup = newFilterGroups[groupIndex] as FilterGroup;
      const newConditions = [...(currentGroup.conditions || [])];
      newConditions[conditionIndex] = updatedCondition;
      
      const updatedGroup = { ...currentGroup, conditions: newConditions };
      newFilterGroups[groupIndex] = updatedGroup;

      return {
        ...prevSearchObject,
        filters: {
          ...prevSearchObject.filters,
          conditions: newFilterGroups,
        },
      };
    });
  };

  return (
    <div>
      <h2>Filter Builder</h2>
      <Button onClick={handleAddFilterGroup}>Add Filter Group</Button>
      {searchObject.filters.conditions
        ?.filter((condition): condition is FilterGroup => condition && condition.hasOwnProperty("operator"))
        .map((filterGroup, index) => (
          <FilterGroupComponent
            key={index}
            filterGroup={filterGroup}
            onChange={(updatedFilterGroup) => handleFilterGroupChange(index, updatedFilterGroup)}
            onConditionChange={(conditionIndex: number, updatedCondition: FilterCondition) => handleConditionChange(index, conditionIndex, updatedCondition)}
          />
        ))}
      <pre>{JSON.stringify(searchObject, null, 2)}</pre>
    </div>
  );
};

export default FilterBuilder;
