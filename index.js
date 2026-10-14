
const searchForm = document.querySelector("#searchForm");
const cityInput = document.querySelector("#cityInput");
const searchBtn = document.querySelector("#searchBtn");
const message = document.querySelector("#message");

const locationText = document.querySelector("#location");
const dateText = document.querySelector("#dateText");
const temperature = document.querySelector("#temperature");
const condition = document.querySelector("#condition");
const weatherIcon = document.querySelector("#weatherIcon");
const feelsLike = document.querySelector("#feelsLike");

const humidity = document.querySelector("#humidity");
const wind = document.querySelector("#wind");
const rain = document.querySelector("#rain");
const clouds = document.querySelector("#clouds");
const forecastList = document.querySelector("#forecastList");

const weatherDescriptions = {
    0: ["Clear sky", "☀️", "☀️"],
    1: ["Mainly clear", "🌤️", "🌙"],
    2: ["Partly cloudy", "⛅", "☁️"],
    3: ["Overcast", "☁️", "☁️"],
    45: ["Foggy", "🌫️", "🌫️"],
    48: ["Depositing rime fog", "🌫️", "🌫️"],
    51: ["Light drizzle", "🌦️", "🌧️"],
    53: ["Moderate drizzle", "🌦️", "🌧️"],
    55: ["Dense drizzle", "🌧️", "🌧️"],
    56: ["Light freezing drizzle", "🌧️", "🌧️"],
    57: ["Heavy freezing drizzle", "🌧️", "🌧️"],
    61: ["Slight rain", "🌦️", "🌧️"],
    63: ["Moderate rain", "🌧️", "🌧️"],
    65: ["Heavy rain", "🌧️", "🌧️"],
    66: ["Light freezing rain", "🌧️", "🌧️"],
    67: ["Heavy freezing rain", "🌧️", "🌧️"],
    71: ["Slight snowfall", "🌨️", "🌨️"],
    73: ["Moderate snowfall", "🌨️", "🌨️"],
    75: ["Heavy snowfall", "❄️", "❄️"],
    77: ["Snow grains", "❄️", "❄️"],
    80: ["Slight rain showers", "🌦️", "🌧️"],
    81: ["Moderate rain showers", "🌧️", "🌧️"],
    82: ["Violent rain showers", "⛈️", "⛈️"],
    85: ["Slight snow showers", "🌨️", "🌨️"],
    86: ["Heavy snow showers", "❄️", "❄️"],
    95: ["Thunderstorm", "⛈️", "⛈️"],
    96: ["Thunderstorm with hail", "⛈️", "⛈️"],
    99: ["Thunderstorm with heavy hail", "⛈️", "⛈️"]
};

function getWeatherInfo(code, isDay = true) {
    const info = weatherDescriptions[code] || [
        "Weather unavailable",
        "🌡️",
        "🌡️"
    ];

    return {
        description: info[0],
        icon: isDay ? info[1] : info[2]
    };
}

function formatDay(dateString) {
    return new Date(`${dateString}T12:00:00`).toLocaleDateString(
        "en",
        { weekday: "short" }
    );
}

function formatDate(dateString, timezone) {
    return new Intl.DateTimeFormat("en", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: timezone
    }).format(new Date(dateString));
}

async function getWeather(city) {
    const query = city.trim();

    if (!query) {
        message.textContent = "Please enter a city name.";
        return;
    }

    searchBtn.disabled = true;
    message.textContent = "Finding your city and fetching weather...";
    forecastList.replaceChildren();

    try {
        const geoURL = new URL(
            "https://geocoding-api.open-meteo.com/v1/search"
        );

        geoURL.search = new URLSearchParams({
            name: query,
            count: "10",
            language: "en",
            format: "json"
        });

        const geoResponse = await fetch(geoURL);

        if (!geoResponse.ok) {
            throw new Error("Could not search for this city.");
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found. Check the spelling and try again.");
        }

        const cityData = geoData.results.find(
            place => place.feature_code === "PPLC"
        ) || geoData.results[0];

        const weatherURL = new URL(
            "https://api.open-meteo.com/v1/forecast"
        );

        weatherURL.search = new URLSearchParams({
            latitude: cityData.latitude,
            longitude: cityData.longitude,
            current: [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "is_day",
                "precipitation",
                "weather_code",
                "cloud_cover",
                "wind_speed_10m"
            ].join(","),
            daily: [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min"
            ].join(","),
            timezone: "auto",
            forecast_days: "6"
        });

        const weatherResponse = await fetch(weatherURL);

        if (!weatherResponse.ok) {
            throw new Error("Could not retrieve the weather right now.");
        }

        const data = await weatherResponse.json();

        displayWeather(cityData, data);
        message.textContent = "Weather updated successfully.";
    } catch (error) {
        message.textContent =
            error.message || "Something went wrong. Please try again.";

        forecastList.replaceChildren();

        const errorMessage = document.createElement("p");
        errorMessage.className = "forecast-placeholder";
        errorMessage.textContent =
            "We couldn't load the forecast. Search again when your connection is available.";

        forecastList.appendChild(errorMessage);
    } finally {
        searchBtn.disabled = false;
    }
}

function displayWeather(cityData, data) {
    const current = data.current;
    const daily = data.daily;

    locationText.textContent = [
        cityData.name,
        cityData.admin1,
        cityData.country
    ].filter(Boolean).filter(
        (value, index, array) => array.indexOf(value) === index
    ).join(", ");

    dateText.textContent = formatDate(
        current.time,
        data.timezone || "UTC"
    );

    temperature.textContent =
        `${Math.round(current.temperature_2m)}°`;

    const info = getWeatherInfo(
        current.weather_code,
        current.is_day === 1
    );

    condition.textContent = info.description;
    weatherIcon.textContent = info.icon;

    feelsLike.textContent =
        `Feels like ${Math.round(current.apparent_temperature)}°C`;

    humidity.textContent = `${current.relative_humidity_2m}%`;
    wind.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    rain.textContent = `${Number(current.precipitation).toFixed(1)} mm`;
    clouds.textContent = `${current.cloud_cover}%`;

    renderForecast(daily);
}

function renderForecast(daily) {
    forecastList.replaceChildren();

    const today = daily.time[0];

    const upcomingDays = daily.time
        .map((date, index) => ({ date, index }))
        .filter(item => item.date !== today)
        .slice(0, 5);

    upcomingDays.forEach(({ date, index }) => {
        const info = getWeatherInfo(daily.weather_code[index]);

        const card = document.createElement("article");
        card.className = "forecast-day";

        const dayName = document.createElement("p");
        dayName.className = "day-name";
        dayName.textContent = formatDay(date);

        const icon = document.createElement("span");
        icon.className = "day-icon";
        icon.textContent = info.icon;
        icon.setAttribute("aria-hidden", "true");

        const description = document.createElement("p");
        description.className = "day-condition";
        description.textContent = info.description;

        const temps = document.createElement("div");
        temps.className = "day-temps";

        const high = document.createElement("span");
        high.textContent = `${Math.round(daily.temperature_2m_max[index])}°`;

        const low = document.createElement("span");
        low.className = "low";
        low.textContent = `${Math.round(daily.temperature_2m_min[index])}°`;

        temps.append(high, low);
        card.append(dayName, icon, description, temps);
        forecastList.appendChild(card);
    });
}

searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    getWeather(cityInput.value);
});

getWeather("Lagos");
