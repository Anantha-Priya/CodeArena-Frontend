import { useState } from 'react';

// Deliberately separate from AmbientBackground (Home's drifting-gradient effect) — a
// different visual language for a different context, not a variant of the same component.

const CHARS = '01{}[]()<>/\\;:=+-*&|!?$#@%^~'.split('');
const COLUMN_COUNT = 48;
const CHARS_PER_COLUMN = 60;

function randomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

interface ColumnSpec {
  left: string;
  text: string;
  duration: string;
  delay: string;
  opacity: number;
}

function generateColumns(): ColumnSpec[] {
  return Array.from({ length: COLUMN_COUNT }, (_, i) => {
    const duration = 5 + Math.random() * 6;
    return {
      left: `${(i / COLUMN_COUNT) * 100}%`,
      text: Array.from({ length: CHARS_PER_COLUMN }, randomChar).join('\n'),
      duration: `${duration}s`,
      // Negative delay starts each column already mid-fall instead of every column
      // beginning "fully above" in lockstep on mount.
      delay: `-${(Math.random() * duration).toFixed(2)}s`,
      opacity: 0.45 + Math.random() * 0.2,
    };
  });
}

export function MatrixRainBackground() {
  // Generated once per mount (lazy initializer) so re-renders from form typing in the
  // pages that use this don't reshuffle characters or restart the animation.
  const [columns] = useState(generateColumns);

  return (
    <div className="matrix-rain" aria-hidden="true">
      {columns.map((column, index) => (
        <div
          key={index}
          className="matrix-rain__column"
          style={{
            left: column.left,
            opacity: column.opacity,
            animationDuration: column.duration,
            animationDelay: column.delay,
          }}
        >
          {column.text}
        </div>
      ))}
    </div>
  );
}
