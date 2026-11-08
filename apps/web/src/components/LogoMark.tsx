interface Props {
  size?: number;
  className?: string;
  title?: string;
}

/**
 * CoolWeather logomark — sun rising behind a cloud (forecast at a glance).
 */
export function LogoMark({ size = 44, className, title = "CoolWeather" }: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="cw-logo-sky" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5eb8ff" />
          <stop offset="100%" stopColor="#2f6fd4" />
        </linearGradient>
        <linearGradient id="cw-logo-sun" x1="30%" y1="20%" x2="80%" y2="90%">
          <stop offset="0%" stopColor="#fff8e8" />
          <stop offset="45%" stopColor="#ffd666" />
          <stop offset="100%" stopColor="#f5a623" />
        </linearGradient>
        <linearGradient id="cw-logo-cloud" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d8e8f8" />
        </linearGradient>
        <filter id="cw-logo-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#061018" floodOpacity="0.35" />
        </filter>
      </defs>
      <rect width="48" height="48" rx="13" fill="url(#cw-logo-sky)" />
      <circle cx="36" cy="14" r="9" fill="url(#cw-logo-sun)" filter="url(#cw-logo-shadow)" />
      <g filter="url(#cw-logo-shadow)">
        <ellipse cx="22" cy="30" rx="14" ry="9" fill="url(#cw-logo-cloud)" />
        <circle cx="12" cy="28" r="7" fill="url(#cw-logo-cloud)" />
        <circle cx="24" cy="25" r="8" fill="url(#cw-logo-cloud)" />
        <circle cx="34" cy="28" r="6.5" fill="url(#cw-logo-cloud)" />
      </g>
      {/* Accent arc — subtle "cool" breeze line */}
      <path
        d="M10 38 Q18 35 26 37"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
