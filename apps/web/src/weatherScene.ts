export type WeatherScene =
  | "default"
  | "clear"
  | "partly-cloudy"
  | "overcast"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunderstorm";

export function sceneForCode(code: number | null | undefined): WeatherScene {
  if (code == null) return "default";
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly-cloudy";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code >= 61 && code <= 67) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 80 && code <= 82) return "rain";
  if (code >= 95) return "thunderstorm";
  return "default";
}

export type RainIntensity = "light" | "medium" | "heavy";

/** Scenes with a light sky behind the UI — needs stronger panel contrast. */
export function isBrightSkyScene(scene: WeatherScene): boolean {
  return scene === "clear" || scene === "partly-cloudy" || scene === "snow";
}

export function rainIntensityForScene(scene: WeatherScene): RainIntensity | null {
  if (scene === "drizzle") return "light";
  if (scene === "rain") return "medium";
  if (scene === "thunderstorm") return "heavy";
  return null;
}
