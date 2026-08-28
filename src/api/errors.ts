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
