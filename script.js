//Initialize map
var map = L.map('map').setView([20.5937, 78.9629], 5); // Centered on India

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var street_layer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
attribution: '&copy; OpenStreetMap contributors'
});

var satellite_layer = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
attribution: 'Tiles © Esri'
});

var terrain_layer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
attribution: '© OpenStreetMap contributors'
});

// Web Speech Recognition
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-US';
recognition.interimResults = false;
alert('Example command:\nShow weather of delhi,\nNavigate to delhi,\nshow cafe near me')
recognition.onresult = (event) => {
    const command = event.results[0][0].transcript.toLowerCase();
    console.log(`Recognized command: ${command}`);
    if (command.includes('navigate to')) {
        const location = command.replace('navigate to', '').trim();
        navigateToLocation(location);
    } else if (command.includes('show weather of')) {
        const location = command.replace('show weather of', '').trim();
        showWeather(location);
    } else if (command.includes('zoom in')) {
        map.zoomIn();
    } else if (command.includes('zoom out')) {
        map.zoomOut();
    } else if (command.includes('move left')) {
        moveMap('left');
    } else if (command.includes('move right')) {
        moveMap('right');
    } else if (command.includes('satellite')) {
        satellite_layer.addTo(map);
    } else if (command.includes('terrain')) {
        terrain_layer.addTo(map);
    } else if (command.includes('street')) {
        street_layer.addTo(map);
    } else if (command.includes('show') && command.includes('near me')) {
        const poi = command.replace('show', '').replace('near me', '').trim();
        findNearby(poi);
    }
};

recognition.onend = () => {
    recognition.start();
};


document.getElementById('start').addEventListener('click', () => {
    recognition.start();
    console.log('Speech recognition service started');
});

document.getElementById('stop').addEventListener('click', () => {
    recognition.stop();
    console.log('Speech recognition service stopped');
});

// Geocoding and navigation function
function navigateToLocation(location) {
    console.log(`Navigating to: ${location}`);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${location}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const latLng = [data[0].lat, data[0].lon];
                map.setView(latLng, 13);
                L.marker(latLng).addTo(map)
                    .bindPopup(`<b>${location}</b>`)
                    .openPopup();
            } else {
                alert('Location not found.');
            }
        })
        .catch(error => console.error('Error:', error));
}

// OpenWeatherMap API function
function showWeather(location) {
    console.log(`Fetching weather for: ${location}`);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${location}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = data[0].lat;
                const lon = data[0].lon;
                fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=4f6ba3987835b8631fae760151f32675&units=metric`)
                    .then(response => response.json())
                    .then(weatherData => {
                        const weather = weatherData.weather[0].description;
                        const temperature = weatherData.main.temp;
                        alert(`Weather in ${location}: ${weather}, ${temperature}°C`);
                    })
                    .catch(error => console.error('Error:', error));
            } else {
                alert('Location not found.');
            }
        })
        .catch(error => console.error('Error:', error));
}

// Move map
function moveMap(direction) {
    const offset = 0.1;
    const center = map.getCenter();
    let lat = center.lat;
    let lng = center.lng;

    if (direction === 'left') {
        lng -= offset;
    } else if (direction === 'right') {
        lng += offset;
    }
    
    map.setView([lat, lng], map.getZoom());
}

// Find nearby points of interest within 5 km radius
function findNearby(poi) {
    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        console.log(`Finding ${poi} near [${latitude}, ${longitude}]`);
        const radius = 10000; // 10 km radius
        const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node["amenity"="${poi}"](around:${radius},${latitude},${longitude});out;`;

        fetch(overpassUrl)
            .then(response => response.json())
            .then(data => {
                if (data.elements.length > 0) {
                    data.elements.forEach(place => {
                        const latLng = [place.lat, place.lon];
                        L.marker(latLng).addTo(map)
                            .bindPopup(`<b>${place.tags.name || poi}</b>`)
                            .openPopup();
                    });
                } else {
                    alert(`No ${poi} found within 10 km of your location.`);
                }
            })
            .catch(error => console.error('Error:', error));
    }, error => {
        console.error('Geolocation error:', error);
    });
}
