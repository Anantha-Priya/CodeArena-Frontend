// Decorative only — negative z-index, pointer-events:none via CSS, and no size that
// affects layout, so it can never intercept clicks or shift content. The host page just
// needs `position: relative; overflow: hidden;` for this to fill its box edge-to-edge.
export function AmbientBackground() {
  return (
    <div className="ambient-bg" aria-hidden="true">
      <div className="ambient-bg__blob ambient-bg__blob--1" />
      <div className="ambient-bg__blob ambient-bg__blob--2" />
      <div className="ambient-bg__blob ambient-bg__blob--3" />
      <div className="ambient-bg__grid" />
    </div>
  );
}
