"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AutocompleteInputProps {
  field: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
  setOpen?: (open: boolean) => void; // allow parent to control popover if needed
}

export function AutocompleteInput({
  field,
  value,
  onChange,
  onSelect,
  setOpen: externalSetOpen,
}: AutocompleteInputProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const setOpen = externalSetOpen || setInternalOpen; // use parent if passed
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [inputValue, setInputValue] = React.useState(String(value || ''));

  React.useEffect(() => {
    setInputValue(String(value || ''));
  }, [value]);

  React.useEffect(() => {
    const fetchSuggestions = async () => {
      if (!inputValue) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/typeahead?field=${field}&q=${encodeURIComponent(inputValue)}`
        );
        const data = await response.json();
        
        // Ensure data is an array
        if (Array.isArray(data)) {
          setSuggestions(data);
        } else {
          console.warn("Typeahead API returned non-array data:", data);
          setSuggestions([]);
        }
        setOpen(true);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [inputValue, field, setOpen]);

  return (
    <Popover open={internalOpen} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex items-center relative w-full">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              onChange(e.target.value);
            }}
            onFocus={() => setOpen(true)}
            onClick={(e) => e.stopPropagation()} 
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            placeholder="Type to search..."
          />
          {value && (
            <div className="absolute right-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-transparent"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setInputValue("");
                  onChange("");
                  setOpen(false);
                }}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Clear</span>
              </Button>
            </div>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 z-50"
        align="start"
        sideOffset={4}
        side="bottom"
        style={{ pointerEvents: "auto" }}
        data-autocomplete="true"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <Command 
          className="w-full" 
          data-command-root
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <CommandInput
            value={inputValue}
            onValueChange={(val) => {
              setInputValue(val);
              onChange(val);
            }}
            className="h-8 text-xs"
            placeholder="Type to search..."
          />
          <CommandEmpty className="py-2 px-4 text-sm text-muted-foreground">
            No results found.
          </CommandEmpty>

          <CommandGroup>
            {Array.isArray(suggestions) && suggestions.map((suggestion) => (
              <CommandItem
                key={suggestion}
                value={suggestion}
                onSelect={(value) => {
                  setInputValue(value);
                  onChange(value);
                  onSelect(value);
                  setOpen(false);
                }}
                className="px-4 py-2 text-sm cursor-pointer"
                style={{ pointerEvents: "auto" }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setInputValue(suggestion);
                  onChange(suggestion);
                  onSelect(suggestion);
                  setOpen(false);
                }}
              >
                {suggestion}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
