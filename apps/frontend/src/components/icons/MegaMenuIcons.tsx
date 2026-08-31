export function CatalogGridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="6.5" height="6.5" fill="#fff" stroke="#fff" />
      <rect x="2.5" y="11" width="6.5" height="6.5" fill="#fff" stroke="#fff" />
      <rect x="11" y="2.5" width="6.5" height="6.5" fill="#fff" stroke="#fff" />
      <rect x="11" y="11" width="6.5" height="6.5" fill="#fff" stroke="#fff" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M6.75 4.5L11.25 9L6.75 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" stroke="#fff" strokeWidth="2" />
      <path d="M10.5 10.5L13.5 13.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function HeartIcon() {
  return (
    <svg width="14" height="13" viewBox="0 0 14 13" fill="none" aria-hidden="true">
      <path d="M7 12.1L1.2 6.9C-0.5 5.3 -0.3 2.6 1.6 1.2C3.1 0.1 5 0.5 6.2 1.7L7 2.5L7.8 1.7C9 0.5 10.9 0.1 12.4 1.2C14.3 2.6 14.5 5.3 12.8 6.9L7 12.1Z" fill="#76829B" />
    </svg>
  );
}

export function ProfileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="7" r="3.5" fill="#76829B" />
      <path d="M4 17.5C4.8 14.5 7.2 12.5 10 12.5C12.8 12.5 15.2 14.5 16 17.5" fill="#76829B" />
    </svg>
  );
}

export function EmptyBoxIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <path
        d="M36 8L8 22V46L36 60L64 46V22L36 8Z"
        stroke="#B8C0D0"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M8 22L36 36L64 22"
        stroke="#B8C0D0"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M36 36V60"
        stroke="#B8C0D0"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M22 28C24 31 28 32 36 32C44 32 48 31 50 28"
        stroke="#76829B"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="28" cy="38" r="1.5" fill="#76829B" />
      <circle cx="44" cy="38" r="1.5" fill="#76829B" />
    </svg>
  );
}
