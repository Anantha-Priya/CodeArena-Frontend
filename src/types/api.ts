// Shape returned by every non-2xx CodeArena API response. See API_REFERENCE.md.
export interface ApiErrorBody {
  status: number;
  message: string;
}

// Spring Data's Page<T> shape. Only GET /api/problems is paginated like this — don't
// assume it for other list endpoints (see API_REFERENCE.md's gotchas section).
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
