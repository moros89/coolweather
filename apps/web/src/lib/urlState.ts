export interface UrlLocation {
  lat: number;
  lon: number;
  name?: string;
  timezone?: string;
}

export function parseLocationFromUrl(search = window.location.search): UrlLocation | null {
  const sp = new URLSearchParams(search);
  const lat = Number(sp.get("lat"));
  const lon = Number(sp.get("lon"));
  if (Number.isNaN(lat) || Number.isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return null;
  }
  const name = sp.get("name")?.trim();
  const timezone = sp.get("tz")?.trim();
  return {
    lat,
    lon,
    name: name || undefined,
    timezone: timezone || undefined,
  };
}

export function writeLocationToUrl(loc: UrlLocation): void {
  const sp = new URLSearchParams();
  sp.set("lat", loc.lat.toFixed(4));
  sp.set("lon", loc.lon.toFixed(4));
  if (loc.name) sp.set("name", loc.name);
  if (loc.timezone && loc.timezone !== "auto") sp.set("tz", loc.timezone);
  const url = `${window.location.pathname}?${sp.toString()}`;
  window.history.replaceState(null, "", url);
}
