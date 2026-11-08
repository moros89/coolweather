export interface LocationResult {
  name: string;
  lat: number;
  lon: number;
  timezone: string;
  country?: string | null;
  admin1?: string | null;
}

export interface WeatherReport {
  location: {
    name: string;
    lat: number;
    lon: number;
    timezone: string;
  };
  generated_at: string;
  units: {
    temperature?: string;
    wind_speed?: string;
  };
  current: {
    temperature: number | null;
    apparent_temperature: number | null;
    humidity: number | null;
    wind_speed: number | null;
    weather_code: number | null;
    summary: string;
  };
  daily: DailyRow[];
  hourly: HourlyRow[];
  history: {
    start: string;
    end: string;
    daily: DailyRow[];
  } | null;
}

export interface DailyRow {
  date: string;
  temp_max: number | null;
  temp_min: number | null;
  precip_sum: number | null;
  weather_code: number | null;
  summary: string;
}

export interface HourlyRow {
  time: string;
  temperature: number | null;
  precipitation: number | null;
  weather_code: number | null;
}

export interface HistoryResponse {
  location: WeatherReport["location"];
  history: {
    start: string | null;
    end: string | null;
    daily: DailyRow[];
  };
}
