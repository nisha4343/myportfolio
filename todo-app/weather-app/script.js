
/* ==============================
   1. GET HTML ELEMENTS
   ============================== */

const searchForm = document.querySelector("#search-form");
const cityInput = document.querySelector("#city-input");
const searchButton = document.querySelector("#search-button");
const statusMessage = document.querySelector("#status");
const weatherPanel = document.querySelector("#weather-panel");

const cityName = document.querySelector("#city-name");
const localTime = document.querySelector("#local-time");
const weatherEmoji = document.querySelector("#weather-emoji");
const weatherDescription = document.querySelector("#weather-description");
const temperature = document.querySelector("#temperature");
const feelsLike = document.querySelector("#feels-like");
const humidity = document.querySelector("#humidity");
const windSpeed = document.querySelector("#wind-speed");
const precipitation = document.querySelector("#precipitation");


/* ==============================
   2. WEATHER CODE DESCRIPTIONS
   ============================== */

function getWeatherDetails(code, isDay) {
    if (code === 0) {
        return {
            description: "Clear sky",
            emoji: isDay ? "☀️" : "🌙"
        };
    }

    if (code === 1) {
        return { description: "Mainly clear", emoji: "🌤️" };
    }

    if (code === 2) {
        return { description: "Partly cloudy", emoji: "⛅" };
    }

    if (code === 3) {
        return { description: "Overcast", emoji: "☁️" };
    }

    if ([45, 48].includes(code)) {
        return { description: "Foggy", emoji: "🌫️" };
    }

    if ([51, 53, 55, 56, 57].includes(code)) {
        return { description: "Drizzle", emoji: "🌦️" };
    }

    if ([61, 63, 65, 66, 67].includes(code)) {
        return { description: "Rain", emoji: "🌧️" };
    }

    if ([71, 73, 75, 77].includes(code)) {
        return { description: "Snow", emoji: "❄️" };
    }

    if ([80, 81, 82].includes(code)) {
        return { description: "Rain showers", emoji: "🌧️" };
    }

    if ([85, 86].includes(code)) {
        return { description: "Snow showers", emoji: "🌨️" };
    }

    if ([95, 96, 99].includes(code)) {
        return { description: "Thunderstorm", emoji: "⛈️" };
    }

    return { description: "Weather unavailable", emoji: "🌍" };
}


/* ==============================
   3. FETCH CITY COORDINATES
   ============================== */

async function getCityCoordinates(city) {
    const url =
        "https://geocoding-api.open-meteo.com/v1/search" +
        `?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Unable to search for this city. Try again.");
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        throw new Error("City not found. Check the spelling and try again.");
    }

    return data.results[0];
}


/* ==============================
   4. FETCH WEATHER DATA
   ============================== */

async function getWeather(latitude, longitude) {
    const url =
        "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${latitude}` +
        `&longitude=${longitude}` +
        "&current=temperature_2m,relative_humidity_2m," +
        "apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m" +
        "&timezone=auto";

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Unable to retrieve weather data. Please try again.");
    }

    const data = await response.json();

    if (!data.current) {
        throw new Error("Weather information is currently unavailable.");
    }

    return data;
}


/* ==============================
   5. DISPLAY WEATHER
   ============================== */

function displayWeather(location, weather) {
    const current = weather.current;

    const details = getWeatherDetails(
        current.weather_code,
        current.is_day
    );

    const locationParts = [
        location.name,
        location.admin1,
        location.country
    ].filter(Boolean);

    cityName.textContent = [...new Set(locationParts)].join(", ");

    temperature.textContent = Math.round(current.temperature_2m);
    feelsLike.textContent =
        `Feels like ${Math.round(current.apparent_temperature)}°C`;

    humidity.textContent = `${current.relative_humidity_2m}%`;
    windSpeed.textContent = `${current.wind_speed_10m} km/h`;
    precipitation.textContent = `${current.precipitation} mm`;

    weatherEmoji.textContent = details.emoji;
    weatherDescription.textContent = details.description;

    // The API returns the local time for the requested location.
    localTime.textContent = `Local time: ${weather.current.time.replace("T", " ")}`;

    weatherPanel.hidden = false;
}


/* ==============================
   6. SEARCH AND HANDLE ERRORS
   ============================== */

async function searchWeather(city) {
    searchButton.disabled = true;
    searchButton.textContent = "Searching...";
    statusMessage.classList.remove("error");
    statusMessage.textContent = "Fetching weather data...";

    try {
        // Step 1: Find the city.
        const location = await getCityCoordinates(city);

        // Step 2: Fetch weather using its coordinates.
        const weather = await getWeather(
            location.latitude,
            location.longitude
        );

        // Step 3: Display the received JSON data.
        displayWeather(location, weather);

        statusMessage.textContent = "Weather updated successfully.";
    } catch (error) {
        statusMessage.textContent =
            error instanceof TypeError
                ? "Network error. Check your internet connection and try again."
                : error.message;

        statusMessage.classList.add("error");
    } finally {
        searchButton.disabled = false;
        searchButton.textContent = "Search";
    }
}


/* ==============================
   7. FORM EVENT LISTENER
   ============================== */

searchForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
        statusMessage.textContent = "Please enter a city name.";
        statusMessage.classList.add("error");
        cityInput.focus();
        return;
    }

    searchWeather(city);
});


/* ==============================
   8. INITIAL WEATHER
   ============================== */

// Show Chennai weather when the app first opens.
cityInput.value = "Chennai";
searchWeather("Chennai");
