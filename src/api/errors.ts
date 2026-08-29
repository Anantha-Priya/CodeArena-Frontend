const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

// Every catch block in this app needs to turn "whatever got thrown" into one display
// string: the backend's own {status, message} (ApiError extends Error, so this covers it
// too) when there is one, and a single consistent fallback otherwise — instead of each
// page repeating this ternary itself.
export function getErrorMessage(err: unknown, fallback: string = DEFAULT_ERROR_MESSAGE): string {
  return err instanceof Error ? err.message : fallback;
}

// The backend joins @Valid field errors into one string, e.g.
// "username: must not be blank; email: must be a well-formed email address"
// (see API_REFERENCE.md). There's no structured field map, so split it back apart
// on a best-effort basis. Segments without a recognizable "field: message" shape
// (e.g. a plain 409 "already exists" message) land under `_general`.
export function parseFieldErrors(message: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const part of message.split(';').map((p) => p.trim()).filter(Boolean)) {
    const separatorIndex = part.indexOf(':');
    if (separatorIndex > 0) {
      const field = part.slice(0, separatorIndex).trim();
      const detail = part.slice(separatorIndex + 1).trim();
      result[field] = detail;
    } else {
      result._general = result._general ? `${result._general}; ${part}` : part;
    }
  }

  return result;
}
