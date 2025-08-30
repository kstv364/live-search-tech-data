"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchObject } from "@/lib/types";
import { Save, FolderOpen, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SavedQueriesProps {
  onLoad: (query: SearchObject) => void;
  currentQuery: SearchObject;
}

const STORAGE_KEY = "saved_search_queries";

interface SavedQuery {
  name: string;
  query: SearchObject;
}

export function SavedQueries({ onLoad, currentQuery }: SavedQueriesProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [queryName, setQueryName] = React.useState("");
  const [savedQueries, setSavedQueries] = React.useState<SavedQuery[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const saveQueries = (queries: SavedQuery[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queries));
    setSavedQueries(queries);
  };

  const handleSave = () => {
    if (!queryName) return;
    
    const newQueries = [...savedQueries, { name: queryName, query: currentQuery }];
    saveQueries(newQueries);
    setQueryName("");
    setIsOpen(false);
  };

  const handleLoad = (query: SearchObject) => {
    onLoad(query);
  };

  const handleDelete = (name: string) => {
    const newQueries = savedQueries.filter(q => q.name !== name);
    saveQueries(newQueries);
  };

  return (
    <div className="flex gap-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save Query
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current Query</DialogTitle>
            <DialogDescription>
              Give your query a name to save it for later use.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={queryName}
              onChange={(e) => setQueryName(e.target.value)}
              placeholder="Query name"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleSave}
              disabled={!queryName}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderOpen className="h-4 w-4 mr-2" />
            Load Query
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Saved Queries</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {savedQueries.length === 0 ? (
            <DropdownMenuItem disabled>No saved queries</DropdownMenuItem>
          ) : (
            savedQueries.map((saved) => (
              <DropdownMenuItem
                key={saved.name}
                className="flex items-center justify-between"
              >
                <span
                  className="flex-1 cursor-pointer"
                  onClick={() => handleLoad(saved.query)}
                >
                  {saved.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(saved.name);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default SavedQueries;
