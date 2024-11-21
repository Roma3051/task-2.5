"use strict";

function initWeatherForecast() {
    const weatherBoxes = document.querySelector('.weather-boxs');
    const cityInput = document.querySelector('.search-box input');
    const cityNameElement = document.querySelector('.details h4');
    const searchButton = document.getElementById('search-button');

    document.addEventListener('DOMContentLoaded', async () => {
        showLoading();
        await fetchAndUpdateWeather();
        getLocationWeather();
        getLocationByIP(); 
    });

    searchButton && searchButton.addEventListener('click', async () => {
        showLoading();
        await fetchAndUpdateWeather(cityInput.value.trim());
    });

    cityInput && cityInput.addEventListener('keypress', async (event) => {
        if (event.key === 'Enter') {
            showLoading();
            await fetchAndUpdateWeather(cityInput.value.trim());
        }
    });

    async function getLocationWeather() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${APIKey}`);
                    const data = await response.json();
                    const city = data.name;
                    await fetchAndUpdateWeather(city);
                } catch (error) {
                    console.error('Error fetching weather data based on location:', error);
                }
            }, (error) => {
                handleLocationError(error);
            });
        } else {
            console.error('Geolocation is not supported by this browser.');
        }
    }

    async function getLocationByIP() {
        try {
            const response = await fetch('https://ipinfo.io/json');
            const data = await response.json();
            const { city, region, country, loc } = data;
            console.log(`City: ${city}, Region: ${region}, Country: ${country}, Coordinates: ${loc}`);
            await fetchAndUpdateWeather(city); 
        } catch (error) {
            console.error('Error getting location by IP:', error);
        }
    }
    
    async function fetchAndUpdateWeather(city = 'Kyiv') {
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${APIKey}`);
            const data = await response.json();
    
            if (data.code === '404') {
                handleNotFound();
                return;
            }
    
            cityNameElement.textContent = city;
            renderFiveDayWeather(data.list);
    
            const currentWeather = data.list[0];
            const currentTemperature = Math.round(currentWeather.main.temp);
            const currentWeatherDescription = currentWeather.weather[0].main;
    
            const dayTemperature = Math.round(data.list[3].main.temp);
    
            const additionalTemperatureElement = document.querySelector('.additionally h3');
    
            const temperatureDifference = dayTemperature - currentTemperature;
            const temperatureSign = temperatureDifference > 0 ? '+' : temperatureDifference < 0 ? '-' : '';
    
            additionalTemperatureElement.textContent = `${temperatureSign}${Math.abs(temperatureDifference)}°C`;
    
            const weatherImageElement = document.querySelector('.img-weather img');
            weatherImageElement.src = getWeatherImage(currentWeatherDescription); 
    
            const cloudsElement = document.querySelector('.current-weather h5');
            cloudsElement.textContent = currentWeatherDescription;
    
            updateCityAndWeatherDetails(city, currentTemperature, currentWeatherDescription, dayTemperature);
    
        } catch (error) {
            console.error('Error fetching weather data:', error);
            handleNotFound();
        }
    }

    function renderFiveDayWeather(forecasts) {
        const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; 
        weatherBoxes.innerHTML = '';
    
        const today = new Date();
    
        for (let i = 0; i < 5; i++) {
            const nextDay = new Date(today);
            nextDay.setDate(today.getDate() + i); 
            const dayOfWeek = weekdays[nextDay.getDay()];
    
            const dayForecast = forecasts.find(entry => {
                const entryDate = new Date(entry.dt_txt);
                return entryDate.getDate() === nextDay.getDate() && entryDate.getHours() === 12;
            });
    
            const nightForecast = forecasts.find(entry => {
                const entryDate = new Date(entry.dt_txt);
                return entryDate.getDate() === nextDay.getDate() && entryDate.getHours() < 6;
            });
    
            if (!dayForecast || !nightForecast) {
                continue; 
            }
    
            const weatherDescriptionDay = dayForecast.weather[0].description;
            const temperatureDay = Math.round(dayForecast.main.temp_max);
            const temperatureNight = Math.round(nightForecast.main.temp_min);
            
            const box = `
            <div class='day-${i+1}'>
                <h1 class="day-of-week">${dayOfWeek}</h1>
                <img src="${getWeatherImage(weatherDescriptionDay)}" alt="${weatherDescriptionDay}">
                <h2>${weatherDescriptionDay}</h2>
                <div class="info">
                    <div class="day">
                        <h3>Day</h3>
                        <h4>${temperatureDay}°C</h4>
                    </div>
                    <div class="night">
                        <h3>Night</h3>
                        <h4>${temperatureNight}°C</h4>
                    </div>
                </div>
            </div>`;
            weatherBoxes.insertAdjacentHTML('beforeend', box);
        }
    }    
 
    function handleNotFound() {
        const errorMessage = '<div class="error-message">City not found</div>';
        weatherBoxes.innerHTML = ''; 
        weatherBoxes.insertAdjacentHTML('beforeend', errorMessage);
    }

    function updateCityAndWeatherDetails(city, temperature, weatherDescription) {
        const cityElement = document.querySelector('.details h4');
        const temperatureElement = document.querySelector('.details h1');
        const weatherDescriptionElement = document.querySelector('.additionally h2');
        
        cityElement.textContent = city;
        temperatureElement.textContent = `${Math.round(temperature)}°C`;
        weatherDescriptionElement.textContent = weatherDescription;
    }
    

    function showLoading() {
        const loadingContainer = document.querySelector('.current-weather .loading-container');
        loadingContainer.style.display = 'flex'; 
    
        const firstDetailsH1 = document.querySelector('.current-weather .details h1');
        firstDetailsH1.textContent = 'Loading...';
    
        const detailsElements = document.querySelectorAll('.img, .current-weather .details h2, .current-weather .details h3, .current-weather .details h4, .details h5, .current-weather .current-weather h5');
        detailsElements.forEach(element => {
            element.textContent = ''; 
        });
    }
    
    
    function handleLocationError(error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                console.log("The user rejected the geolocation request.");
                break;
            case error.POSITION_UNAVAILABLE:
                console.log("No location information available.");
                break;
            case error.TIMEOUT:
                console.log("Geolocation service request timeout.");
                break;
            case error.UNKNOWN_ERROR:
                console.log("An unknown error has occurred.");
                break;
        }
    }

    function getWeatherImage(weatherDescription) {
        if (weatherDescription.toLowerCase().includes('clear')) {
            return './img/sunny.svg';
        } else if (weatherDescription.toLowerCase().includes('cloud')) {
            return './img/cloudy.svg';
        } else if (weatherDescription.toLowerCase().includes('rain')) {
            return './img/rain.svg';
        } else if (weatherDescription.toLowerCase().includes('snow')) {
            return './img/snow.svg';
        } else {
            return './img/default.svg';
        }
    }    
}

initWeatherForecast();
