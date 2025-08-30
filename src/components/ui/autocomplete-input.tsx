"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"

interface AutocompleteInputProps {
  field: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
}

export function AutocompleteInput({ field, value, onChange, onSelect }: AutocompleteInputProps) {
  const [open, setOpen] = React.useState(false)
  const [suggestions, setSuggestions] = React.useState<string[]>([])

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
    <Command className="relative">
      <div className="flex items-center border rounded-md">
        <CommandInput
          value={value}
          onValueChange={(newValue) => {
            onChange(newValue);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="flex h-10 w-full rounded-md bg-background px-3 py-2 text-sm ring-offset-background"
          placeholder="Type to search..."
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("")
              setOpen(false)
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && value && suggestions.length > 0 && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          <CommandGroup>
            {suggestions.map((suggestion) => (
              <CommandItem
                key={suggestion}
                onSelect={() => {
                  onSelect(suggestion)
                  setOpen(false)
                }}
              >
                {suggestion}
              </CommandItem>
            ))}
          </CommandGroup>
        </div>
      )}
    </Command>
  )
}
