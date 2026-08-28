export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="skeleton-list" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <li key={index} className="skeleton-row" />
      ))}
    </ul>
  );
}
