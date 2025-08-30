"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface AutocompleteInputProps {
  field: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
}

export function AutocompleteInput({ field, value, onChange, onSelect }: AutocompleteInputProps) {
  const [open, setOpen] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const inputRef = React.useRef<React.ElementRef<typeof CommandPrimitive.Input>>(null);

  React.useEffect(() => {
    const fetchSuggestions = async () => {
      if (!value) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await fetch(`/api/typeahead?field=${field}&q=${encodeURIComponent(value)}`);
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [value, field]);

  return (
    <div className="relative">
      <Command className="relative">
        <div className="relative">
          <CommandInput
            ref={inputRef}
            value={value}
            onValueChange={(newValue) => {
              onChange(newValue);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="h-10 pr-8 w-full"
            placeholder="Type to search..."
          />
          {value && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => {
                onChange("");
                setOpen(false);
                inputRef.current?.focus();
              }}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear</span>
            </Button>
          )}
        </div>
        {open && suggestions.length > 0 && (
          <div className="absolute top-[100%] z-50 w-full bg-white rounded-md border shadow-md mt-1">
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {suggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion}
                    onSelect={() => {
                      onSelect(suggestion);
                      setOpen(false);
                    }}
                  >
                    {suggestion}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </div>
        )}
      </Command>
    </div>
  );
}
