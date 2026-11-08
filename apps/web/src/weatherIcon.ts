const WMO_SUMMARY: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

export function summaryForCode(code: number | null | undefined): string {
  if (code == null) return "Unknown";
  return WMO_SUMMARY[code] ?? "Unknown";
}

export function iconForCode(code: number | null | undefined): string {
  if (code == null) return "◌";
  if (code === 0) return "☀";
  if (code <= 2) return "⛅";
  if (code === 3) return "☁";
  if (code === 45 || code === 48) return "🌫";
  if (code >= 51 && code <= 57) return "🌦";
  if (code >= 61 && code <= 67) return "🌧";
  if (code >= 71 && code <= 77) return "❄";
  if (code >= 80 && code <= 82) return "🌧";
  if (code >= 95) return "⛈";
  return "◌";
}

export function formatTemp(value: number | null | undefined, unit = "°C"): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.round(value)}${unit}`;
}

export function locationLabel(loc: {
  name: string;
  country?: string | null;
  admin1?: string | null;
}): string {
  const parts = [loc.name];
  if (loc.admin1 && loc.admin1 !== loc.name) parts.push(loc.admin1);
  if (loc.country) parts.push(loc.country);
  return parts.join(", ");
}

export function shortDate(iso: string): string {
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function shortTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
