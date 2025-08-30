"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
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
}

export function AutocompleteInput({ field, value, onChange, onSelect }: AutocompleteInputProps) {
  const [open, setOpen] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [inputValue, setInputValue] = React.useState(value);

  React.useEffect(() => {
    const fetchSuggestions = async () => {
      if (!inputValue) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await fetch(`/api/typeahead?field=${field}&q=${encodeURIComponent(inputValue)}`);
        const data = await response.json();
        setSuggestions(data);
        setOpen(true);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [inputValue, field]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            placeholder="Type to search..."
          />
          {value && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 h-8 w-8 p-0 hover:bg-transparent"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setInputValue("");
                onChange("");
                setOpen(false);
              }}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear</span>
            </Button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command className="w-full">
          <CommandInput
            value={inputValue}
            onValueChange={(value) => {
              setInputValue(value);
              onChange(value);
            }}
            className="h-9"
            placeholder="Type to search..."
          />
          <CommandEmpty className="py-2 px-4 text-sm text-muted-foreground">No results found.</CommandEmpty>
          <CommandGroup>
            {suggestions.map((suggestion) => (
              <CommandItem
                key={suggestion}
                value={suggestion}
                onSelect={() => {
                  setInputValue(suggestion);
                  onSelect(suggestion);
                  setOpen(false);
                }}
                className="px-4 py-2 text-sm cursor-pointer"
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
