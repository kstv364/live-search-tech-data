"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import { AutocompleteInput } from "./autocomplete-input";
import { SearchField } from "@/lib/types";

interface MultiValueInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  field?: SearchField;
  useTypeahead?: boolean;
  disabled?: boolean;
}

export const MultiValueInput: React.FC<MultiValueInputProps> = ({
  values,
  onChange,
  placeholder = "Add value...",
  field,
  useTypeahead = false,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addValue = (value: string) => {
    const trimmedValue = value.trim();
    if (trimmedValue && !values.includes(trimmedValue)) {
      onChange([...values, trimmedValue]);
    }
    setInputValue("");
  };

  const removeValue = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addValue(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && values.length > 0) {
      removeValue(values.length - 1);
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  const handleAutocompleteSelect = (value: string) => {
    addValue(value);
  };

  return (
    <div className={`flex flex-wrap gap-1 p-2 border rounded-md bg-background min-h-[40px] focus-within:ring-2 focus-within:ring-ring ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {values.map((value, index) => (
        <div
          key={index}
          className="flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm"
        >
          <span>{value}</span>
          <button
            type="button"
            onClick={() => removeValue(index)}
            disabled={disabled}
            className="hover:bg-secondary-foreground/20 rounded p-0.5 disabled:cursor-not-allowed"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      
      <div className="flex-1 min-w-[120px]">
        {useTypeahead && field ? (
          <AutocompleteInput
            field={field}
            value={inputValue}
            onChange={handleInputChange}
            onSelect={handleAutocompleteSelect}
          />
        ) : (
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
          />
        )}
      </div>
      
      {inputValue && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => addValue(inputValue)}
          className="h-6 px-2"
        >
          <Plus className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
};
