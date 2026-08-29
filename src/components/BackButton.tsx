import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  fallback: string;
  label?: string;
}

// Prefers real browser history so it lands exactly where the user came from;
// falls back to a sensible route when there's nothing behind this entry in our
// own history (e.g. someone opened the page from a direct link).
export function BackButton({ fallback, label }: BackButtonProps) {
  const navigate = useNavigate();

  function handleClick() {
    const idx = (window.history.state as { idx?: number } | null)?.idx;
    if (typeof idx === 'number' && idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  }

  return (
    <button
      type="button"
      className="back-button"
      onClick={handleClick}
      aria-label={label ? `Back to ${label}` : 'Back'}
    >
      <span className="back-button__arrow" aria-hidden="true">
        ←
      </span>
      {label && <span className="back-button__label">{label}</span>}
    </button>
  );
}
