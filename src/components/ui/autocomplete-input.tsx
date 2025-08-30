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
  const [inputValue, setInputValue] = React.useState(value);

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
        setSuggestions(data);
        setOpen(true);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
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
            autoComplete="off"
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            placeholder="Type to search..."
          />
          {value && (
            <div className="absolute right-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-transparent"
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
            </div>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        sideOffset={4}
        style={{ pointerEvents: "auto" }}
        data-autocomplete="true"
        onInteractOutside={(e) => {
          // ✅ Prevents Radix from closing popover when clicking inside Command
          if (
            e.target instanceof HTMLElement &&
            e.target.closest("[data-command-root]")
          ) {
            e.preventDefault();
          }
        }}
      >
        <Command className="w-full" data-command-root>
          <CommandInput
            value={inputValue}
            onValueChange={(val) => {
              setInputValue(val);
              onChange(val);
            }}
            className="h-9"
            placeholder="Type to search..."
          />
          <CommandEmpty className="py-2 px-4 text-sm text-muted-foreground">
            No results found.
          </CommandEmpty>

          <CommandGroup>
            {suggestions.map((suggestion) => (
              <CommandItem
                key={suggestion}
                value={suggestion}
                // ✅ intercept pointerdown so Radix outside click handler doesn't close too early
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const native = (e as any).nativeEvent as Event | undefined;
                  if (
                    native &&
                    typeof (native as any).stopImmediatePropagation === "function"
                  ) {
                    (native as any).stopImmediatePropagation();
                  }
                }}
                onSelect={() => {
                  setInputValue(suggestion);
                  onChange(suggestion);
                  onSelect(suggestion);
                  setOpen(false);
                }}
                className="px-4 py-2 text-sm cursor-pointer"
                style={{ pointerEvents: "auto" }}
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
