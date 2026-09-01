export function CatalogGridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="6" height="6" rx="1.167" fill="#fff" stroke="#fff" />
      <rect x="0.5" y="9.5" width="6" height="6" rx="1.167" fill="#fff" stroke="#fff" />
      <rect x="9.5" y="0.5" width="6" height="6" rx="1.167" fill="#fff" stroke="#fff" />
      <rect x="9.5" y="9.5" width="6" height="6" rx="1.167" fill="#fff" stroke="#fff" />
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
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M9.16667 15.8333C12.8486 15.8333 15.8333 12.8486 15.8333 9.16667C15.8333 5.48477 12.8486 2.5 9.16667 2.5C5.48477 2.5 2.5 5.48477 2.5 9.16667C2.5 12.8486 5.48477 15.8333 9.16667 15.8333Z"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.4974 17.5003L13.9141 13.917"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Heart icon inside 32×32 chip. */
export function HeartIcon() {
  return (
    <svg width="14" height="13" viewBox="1365 33 14 13" fill="none" aria-hidden="true">
      <path
        d="M1368.53 33.0059C1369.63 32.9519 1370.49 33.3034 1371.38 34.0013C1371.6 34.1772 1371.8 34.3844 1372.01 34.5501C1373.02 33.5618 1374.05 32.9295 1375.46 33.0063C1376.44 33.0535 1377.36 33.5224 1378.01 34.3075C1378.69 35.122 1379.05 36.2738 1378.99 37.364C1378.86 39.9331 1376.72 42.3731 1375.04 44.0036C1374.68 44.3684 1374.23 44.7515 1373.84 45.0884C1373.61 45.2961 1373.25 45.598 1372.99 45.7436C1372.74 45.882 1372.46 45.9663 1372.18 45.9918C1371.32 46.0614 1370.85 45.6781 1370.22 45.1409C1369.89 44.8622 1369.56 44.5747 1369.25 44.2787C1367.53 42.6844 1365.19 40.0523 1365.01 37.4995C1364.93 36.353 1365.27 35.2167 1365.96 34.3418C1366.63 33.5067 1367.52 33.0811 1368.53 33.0059Z"
        fill="#76829B"
      />
    </svg>
  );
}

/** Profile glyph in 44×44 button. */
export function ProfileIcon() {
  return (
    <svg width="20" height="20" viewBox="1531.5 31.8 13.1 16" fill="none" aria-hidden="true">
      <path
        d="M1536.1 40.6352C1536.2 40.6318 1536.3 40.63 1536.4 40.6297L1538.67 40.629C1539.13 40.629 1539.73 40.6126 1540.17 40.6562C1541.26 40.77 1542.27 41.2545 1543.05 42.0285C1543.94 42.9159 1544.45 44.1195 1544.46 45.3781C1544.46 46.2597 1544.02 46.9954 1543.26 47.4307C1542.66 47.7751 1542.1 47.7177 1541.43 47.7178L1539.92 47.7176L1535.6 47.718L1534.42 47.7185C1534.1 47.7186 1533.71 47.7314 1533.4 47.6716C1533 47.595 1532.62 47.4126 1532.32 47.1433C1531.86 46.7439 1531.58 46.1789 1531.55 45.5738C1531.47 44.4078 1531.97 43.1025 1532.74 42.2417C1533.64 41.2412 1534.77 40.7208 1536.1 40.6352Z"
        fill="#76829B"
      />
      <path
        d="M1537.77 31.8806C1539.95 31.7558 1541.82 33.4233 1541.95 35.6056C1542.08 37.7879 1540.41 39.6591 1538.23 39.7855C1536.04 39.9119 1534.17 38.2441 1534.05 36.0606C1533.92 33.8772 1535.59 32.0055 1537.77 31.8806Z"
        fill="#76829B"
      />
    </svg>
  );
}
