from pydantic import BaseModel, Field


class LocationOut(BaseModel):
    name: str
    lat: float
    lon: float
    timezone: str
    country: str | None = None
    admin1: str | None = None


class CurrentWeather(BaseModel):
    temperature: float | None = None
    apparent_temperature: float | None = None
    humidity: float | None = None
    wind_speed: float | None = None
    weather_code: int | None = None
    summary: str


class DailyForecast(BaseModel):
    date: str
    temp_max: float | None = None
    temp_min: float | None = None
    precip_sum: float | None = None
    weather_code: int | None = None
    summary: str


class HourlyForecast(BaseModel):
    time: str
    temperature: float | None = None
    precipitation: float | None = None
    weather_code: int | None = None


class HistorySection(BaseModel):
    start: str
    end: str
    daily: list[DailyForecast]


class WeatherReport(BaseModel):
    location: dict
    generated_at: str
    units: dict
    current: CurrentWeather
    daily: list[DailyForecast]
    hourly: list[HourlyForecast]
    history: HistorySection | None = None


class WatchlistCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    lat: float
    lon: float
    timezone: str = "auto"


class WatchlistItem(BaseModel):
    id: int
    name: str
    lat: float
    lon: float
    timezone: str
    sort_order: int
