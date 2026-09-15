export function ArrowVoltRight({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 30c22-16 48-22 76-18"
        stroke="#CCFF00"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M66 2c8 4 14 8 18 10-6 4-10 9-13 16"
        stroke="#CCFF00"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowVoltLeft({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M116 30c-22-16-48-22-76-18"
        stroke="#CCFF00"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M54 2c-8 4-14 8-18 10 6 4 10 9 13 16"
        stroke="#CCFF00"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowBlackDown({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 96" fill="none" className={className} aria-hidden="true">
      <path
        d="M24 6c6 26 2 48-6 74"
        stroke="#000000"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M6 62c6 10 10 18 12 26 6-8 14-14 22-18"
        stroke="#000000"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SquiggleUnderline({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 16" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 11c26-8 52 4 78-2s52-10 78-2 52 8 78 2"
        stroke="#CCFF00"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StopGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="26" stroke="#000000" strokeWidth="6" fill="#CCFF00" />
      <rect x="20" y="28" width="24" height="8" rx="2" fill="#000000" />
    </svg>
  );
}
