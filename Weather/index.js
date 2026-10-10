const checkWeather = document.querySelector("#checkWeather");

checkWeather.addEventListener("click", function () {

    const city = prompt("Enter your city or location:");

    if (!city) {
        alert("Please enter a city or location.");
        return;
    }

    async function getWeather() {

        try {
            const locationResponse = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
            );

            const locationData = await locationResponse.json();

            if (!locationData.results) {
                alert("Location not found. Please check the city name.");
                return;
            }

            const location = locationData.results[0];

            const weatherResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
            );

            const weatherData = await weatherResponse.json();
            const weather = weatherData.current;

            const temperature = weather.temperature_2m;
            const humidity = weather.relative_humidity_2m;
            const wind = weather.wind_speed_10m;
            const weatherCode = weather.weather_code;

            let condition;
            let advice;

            if (weatherCode === 0) {
                condition = "Sunny";
                advice = "The weather is sunny. You may want to use an umbrella or stay in the shade.";
            } 
            else if (weatherCode >= 1 && weatherCode <= 3) {
                condition = "Cloudy";
                advice = "The sky is cloudy. Keep an eye on the weather.";
            } 
            else if (weatherCode >= 51 && weatherCode <= 67) {
                condition = "Rainy";
                advice = "It is raining. Don't forget your umbrella.";
            } 
            else if (weatherCode >= 80 && weatherCode <= 82) {
                condition = "Rain Showers";
                advice = "Rain showers are expected. Take an umbrella with you.";
            } 
            else if (weatherCode >= 95) {
                condition = "Thunderstorm";
                advice = "There may be a thunderstorm. Consider staying indoors.";
            } 
            else {
                condition = "Changing Weather";
                advice = "Check the weather before going outside.";
            }

            alert(
                `Weather in ${location.name}\n\n` +
                `Temperature: ${temperature}°C\n` +
                `Condition: ${condition}\n` +
                `Humidity: ${humidity}%\n` +
                `Wind: ${wind} km/h\n\n` +
                `Advice: ${advice}`
            );

        } catch (error) {
            alert("Something went wrong while getting the weather.");
            console.log(error);
        }
    }

    getWeather();
});