/** Decorative clear-sky sun (SVG + CSS layers). */
export function SunGraphic() {
  return (
    <div className="weather-sun-scene">
      <div className="weather-sun-ambient" />
      <div className="weather-sun-halo" />
      <svg
        className="weather-sun-svg"
        viewBox="0 0 240 240"
        role="presentation"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="cw-sun-core" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="18%" stopColor="#fff9e8" />
            <stop offset="45%" stopColor="#ffe066" />
            <stop offset="78%" stopColor="#ffb830" />
            <stop offset="100%" stopColor="#f59a18" />
          </radialGradient>
          <linearGradient id="cw-sun-ray" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 248, 210, 0)" />
            <stop offset="35%" stopColor="rgba(255, 236, 170, 0.55)" />
            <stop offset="100%" stopColor="rgba(255, 210, 90, 0)" />
          </linearGradient>
          <filter id="cw-sun-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g className="weather-sun-rays-spin" filter="url(#cw-sun-soft)">
          {Array.from({ length: 16 }).map((_, i) => (
            <ellipse
              key={i}
              cx="120"
              cy="120"
              rx="14"
              ry="95"
              fill="url(#cw-sun-ray)"
              transform={`rotate(${i * 22.5} 120 120)`}
              opacity={0.85}
            />
          ))}
        </g>
        <circle className="weather-sun-disk" cx="120" cy="120" r="52" fill="url(#cw-sun-core)" />
        <circle
          cx="120"
          cy="120"
          r="52"
          fill="none"
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth="2"
        />
      </svg>
      <span className="weather-sun-lens" aria-hidden />
    </div>
  );
}
