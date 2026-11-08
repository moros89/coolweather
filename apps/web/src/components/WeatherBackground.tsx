import { useMemo } from "react";
import {
  rainIntensityForScene,
  sceneForCode,
  type RainIntensity,
  type WeatherScene,
} from "../weatherScene";
import { SunGraphic } from "./SunGraphic";
import "./weather-background.css";

interface DropSpec {
  id: number;
  left: number;
  delay: number;
  duration: number;
  opacity: number;
}

interface FlakeSpec {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
}

function buildDrops(count: number, seed: number): DropSpec[] {
  return Array.from({ length: count }, (_, id) => {
    const r = pseudo(seed + id * 17.23);
    return {
      id,
      left: r() * 100,
      delay: r() * 2.5,
      duration: 0.55 + r() * 0.65,
      opacity: 0.35 + r() * 0.45,
    };
  });
}

function buildFlakes(count: number, seed: number): FlakeSpec[] {
  return Array.from({ length: count }, (_, id) => {
    const r = pseudo(seed + id * 11.07);
    return {
      id,
      left: r() * 100,
      delay: r() * 4,
      duration: 4 + r() * 5,
      size: 3 + r() * 4,
    };
  });
}

/** Small deterministic PRNG so drops don't jump on re-render. */
function pseudo(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function dropCount(intensity: RainIntensity): number {
  if (intensity === "light") return 40;
  if (intensity === "medium") return 72;
  return 100;
}

const cloudScenes = new Set<WeatherScene>([
  "partly-cloudy",
  "overcast",
  "drizzle",
  "rain",
  "thunderstorm",
]);

interface Props {
  weatherCode: number | null | undefined;
}

export function WeatherBackground({ weatherCode }: Props) {
  const scene = sceneForCode(weatherCode);
  const rainIntensity = rainIntensityForScene(scene);

  const drops = useMemo(
    () => (rainIntensity ? buildDrops(dropCount(rainIntensity), weatherCode ?? 0) : []),
    [rainIntensity, weatherCode],
  );

  const flakes = useMemo(
    () => (scene === "snow" ? buildFlakes(55, (weatherCode ?? 0) + 99) : []),
    [scene, weatherCode],
  );

  const showClouds = cloudScenes.has(scene);

  return (
    <div className={`weather-bg weather-bg--${scene}`} aria-hidden data-weather-scene={scene}>
      {scene === "clear" && <SunGraphic />}

      {showClouds && <CloudLayer scene={scene} />}

      {rainIntensity && (
        <div className={`weather-rain weather-rain--${rainIntensity}`}>
          {drops.map((d) => (
            <span
              key={d.id}
              className="weather-raindrop"
              style={{
                left: `${d.left}%`,
                animationDelay: `${d.delay}s`,
                animationDuration: `${d.duration}s`,
                opacity: d.opacity,
              }}
            />
          ))}
        </div>
      )}

      {scene === "snow" && (
        <div className="weather-snow">
          {flakes.map((f) => (
            <span
              key={f.id}
              className="weather-flake"
              style={{
                left: `${f.left}%`,
                width: f.size,
                height: f.size,
                animationDelay: `${f.delay}s`,
                animationDuration: `${f.duration}s`,
              }}
            />
          ))}
        </div>
      )}

      {scene === "fog" && (
        <>
          <div className="weather-fog weather-fog--a" />
          <div className="weather-fog weather-fog--b" />
          <div className="weather-fog weather-fog--c" />
        </>
      )}

      {scene === "thunderstorm" && <div className="weather-lightning" />}
    </div>
  );
}

function CloudLayer({ scene }: { scene: WeatherScene }) {
  const heavy = scene === "overcast" || scene === "rain" || scene === "thunderstorm";
  return (
    <div className={`weather-clouds${heavy ? " weather-clouds--heavy" : ""}`}>
      <div className="weather-cloud weather-cloud--1" />
      <div className="weather-cloud weather-cloud--2" />
      <div className="weather-cloud weather-cloud--3" />
      {(heavy || scene === "drizzle") && <div className="weather-cloud weather-cloud--4" />}
    </div>
  );
}
