"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import { SearchField } from "@/lib/types";

interface FilterMultiValueInputProps {
  values: (string | number)[];
  onChange: (values: (string | number)[]) => void;
  placeholder?: string;
  field?: SearchField;
  useTypeahead?: boolean;
  disabled?: boolean;
  type?: "text" | "number";
}

export const FilterMultiValueInput: React.FC<FilterMultiValueInputProps> = ({
  values,
  onChange,
  placeholder = "Add value...",
  field,
  useTypeahead = false,
  disabled = false,
  type = "text",
}) => {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch typeahead suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!useTypeahead || !field || !inputValue.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/typeahead?field=${field}&q=${encodeURIComponent(inputValue)}`
        );
        const data = await response.json();
        
        if (Array.isArray(data)) {
          // Filter out values that are already selected
          const filteredSuggestions = data.filter(suggestion => 
            !values.some(value => String(value).toLowerCase() === suggestion.toLowerCase())
          );
          setSuggestions(filteredSuggestions);
          setShowSuggestions(filteredSuggestions.length > 0);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [inputValue, field, useTypeahead, values]);

  const addValue = (value: string | number) => {
    let processedValue: string | number;
    
    if (type === "number") {
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(numValue)) return;
      processedValue = numValue;
    } else {
      processedValue = String(value).trim();
      if (!processedValue) return;
    }

    // Check if value already exists
    const exists = values.some(existingValue => {
      if (type === "number") {
        return Number(existingValue) === Number(processedValue);
      }
      return String(existingValue).toLowerCase() === String(processedValue).toLowerCase();
    });

    if (!exists) {
      onChange([...values, processedValue]);
    }
    
    setInputValue("");
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const removeValue = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        return;
      }
      
      if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
        e.preventDefault();
        addValue(suggestions[selectedSuggestionIndex]);
        return;
      }
      
      if (e.key === "Escape") {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        return;
      }
    }

    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addValue(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && values.length > 0) {
      removeValue(values.length - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setSelectedSuggestionIndex(-1);
  };

  const handleSuggestionClick = (suggestion: string) => {
    addValue(suggestion);
  };

  const handleInputFocus = () => {
    if (useTypeahead && inputValue.trim()) {
      setShowSuggestions(suggestions.length > 0);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 200);
  };

  return (
    <div className="relative">
      <div className={`flex flex-wrap gap-1 p-1 border rounded-md bg-background min-h-[32px] focus-within:ring-2 focus-within:ring-ring ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {values.map((value, index) => (
          <div
            key={index}
            className="flex items-center gap-1 px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs"
          >
            <span>{String(value)}</span>
            <button
              type="button"
              onClick={() => removeValue(index)}
              disabled={disabled}
              className="hover:bg-secondary-foreground/20 rounded p-0.5 disabled:cursor-not-allowed"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
        
        <div className="flex-1 min-w-[80px]">
          <Input
            ref={inputRef}
            type={type}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={values.length === 0 ? placeholder : "Add more..."}
            disabled={disabled}
            className="border-0 shadow-none focus-visible:ring-0 p-0 h-6 text-xs"
          />
        </div>
        
        {inputValue && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => addValue(inputValue)}
            className="h-5 px-1"
          >
            <Plus className="w-2.5 h-2.5" />
          </Button>
        )}
      </div>

      {/* Typeahead suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-input rounded-md shadow-md max-h-32 overflow-y-auto mt-1">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-muted ${
                index === selectedSuggestionIndex ? 'bg-muted' : ''
              }`}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent input blur
                handleSuggestionClick(suggestion);
              }}
              onMouseEnter={() => setSelectedSuggestionIndex(index)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
