export interface SearchObject {
  filters: FilterGroup;
  sort?: SortOption[];
  limit?: number;
  offset?: number;
}

export interface FilterGroup {
  operator: "AND" | "OR" | "NOT";
  conditions: (FilterCondition | FilterGroup)[];
}

export interface FilterCondition {
  field: SearchField;
  operator:
    | "="
    | "!="
    | "IN"
    | "NOT IN"
    | "LIKE"
    | ">"
    | "<"
    | ">="
    | "<="
    | "BETWEEN";
  value: string | number | (string | number)[];
}

export interface SortOption {
  field: SearchField;
  direction: "asc" | "desc";
}

export type SearchField =
  | "company_name"
  | "root_domain"
  | "company_category"
  | "country"
  | "city"
  | "state"
  | "postal_code"
  | "spend"
  | "first_indexed"
  | "last_indexed"
  | "tech_name"
  | "tech_category"
  | "parent_tech_name"
  | "premium"
  | "description";
