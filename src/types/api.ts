// Shape returned by every non-2xx CodeArena API response. See API_REFERENCE.md.
export interface ApiErrorBody {
  status: number;
  message: string;
}
