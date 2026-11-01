const WEATHER_CODES = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Freezing fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow",
  80: "Rain showers", 81: "Rain showers", 82: "Violent rain showers",
  95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with hail",
};

async function getCoordinates(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not look up that city. Try again.");
  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`No city found for "${city}".`);
  }
  const { latitude, longitude, name, country } = data.results[0];
  return { latitude, longitude, label: `${name}, ${country}` };
}

async function getWeather(latitude, longitude) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Weather service is unavailable. Try again later.");
  return response.json();
}

const form = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const searchBtn = form.querySelector("button");

function showLoading() {
  statusEl.textContent = "Loading...";
  statusEl.className = "status loading";
  resultEl.hidden = true;
  searchBtn.disabled = true;
}

function showError(message) {
  statusEl.textContent = message;
  statusEl.className = "status error";
  resultEl.hidden = true;
}

function showResult(label, weather) {
  const { current, daily } = weather;
  document.getElementById("cityName").textContent = label;
  document.getElementById("temp").textContent = `${Math.round(current.temperature_2m)}°C`;
  document.getElementById("condition").textContent =
    WEATHER_CODES[current.weather_code] || "Unknown conditions";
  document.getElementById("humidity").textContent = `${current.relative_humidity_2m}%`;
  document.getElementById("wind").textContent = `${current.wind_speed_10m} km/h`;
  document.getElementById("range").textContent =
    `${Math.round(daily.temperature_2m_max[0])}° / ${Math.round(daily.temperature_2m_min[0])}°`;
  statusEl.textContent = "";
  statusEl.className = "status";
  resultEl.hidden = false;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;

  showLoading();
  try {
    const place = await getCoordinates(city);
    const weather = await getWeather(place.latitude, place.longitude);
    showResult(place.label, weather);
  } catch (error) {
    showError(error.message || "Something went wrong.");
  } finally {
    searchBtn.disabled = false;
  }
});