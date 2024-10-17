const http = require('http');
const path = require('path');
const fs = require('fs');
const port = process.env.PORT || process.env.NODE_PORT || 3001;

// Read static files
const index = fs.readFileSync(path.resolve(__dirname, '../front/client.html'));
const css = fs.readFileSync(path.resolve(__dirname, '../front/general.css'));
const img = fs.readFileSync(path.resolve(__dirname, '../front/map.png'));

// Currency conversion rates (mocked)
const currencyRates = {
    'USD': { 'EUR': 0.85, 'USD': 1 },
    'EUR': { 'EUR': 1, 'USD': 1.18 },
};

// Get all countries from the JSON file
const getCountriesData = () => {
    try {
        const countriesData = fs.readFileSync(path.resolve(__dirname, '../data/countries.json'), 'utf-8');
        return JSON.parse(countriesData);
    } catch (error) {
        console.error('Error reading countries data:', error);
        return [];
    }
};

const countries = getCountriesData();

const getIndex = (response) => {
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(index);
};

const getCSS = (response) => {
    response.writeHead(200, { 'Content-Type': 'text/css' });
    response.end(css);
};

const getImage = (response) => {
    response.writeHead(200, { 'Content-Type': 'image/png' });
    response.end(img);
};

const parseBody = (request, handler) => {
    const body = [];
    request.on('data', (chunk) => {
        body.push(chunk);
    });
    request.on('end', () => {
        const bodyString = Buffer.concat(body).toString();
        const parsedData = JSON.parse(bodyString);
        handler(parsedData);
    });
    request.on('error', (err) => {
        console.error('Error handling POST request:', err);
    });
};

const handleGet = (request, response, parsedUrl) => {
    if (parsedUrl.pathname === '/api/countries') {
        const countryName = parsedUrl.searchParams.get('name');
        if (countryName) {
            const country = countries.find(c => c.name.toLowerCase() === countryName.toLowerCase());
            if (!country) {
                response.writeHead(404, { 'Content-Type': 'application/json' });
                return response.end(JSON.stringify({ error: 'Country not found' }));
            }
            response.writeHead(200, { 'Content-Type': 'application/json' });
            return response.end(JSON.stringify(country));
        }
        response.writeHead(200, { 'Content-Type': 'application/json' });
        return response.end(JSON.stringify(countries));
    }

    if (parsedUrl.pathname === '/api/timezones') {
        const countryTime = parsedUrl.searchParams.get('countryTime');
        if (!countryTime) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            return response.end(JSON.stringify({ error: 'Country name is required for timezones' }));
        }

        const country = countries.find(c => c.name.toLowerCase() === countryTime.toLowerCase());
        if (!country || !country.timezones) {
            response.writeHead(404, { 'Content-Type': 'application/json' });
            return response.end(JSON.stringify({ error: 'Country or timezones not found' }));
        }

        response.writeHead(200, { 'Content-Type': 'application/json' });
        return response.end(JSON.stringify(country.timezones));
    }

    // Serve static files
    if (parsedUrl.pathname === '/general.css') {
        getCSS(response);
    } else if (parsedUrl.pathname === '/map.png') {
        getImage(response);
    } else {
        getIndex(response);
    }
};

const handlePost = (request, response, parsedUrl) => {
    if (parsedUrl.pathname === '/api/countries') {
        parseBody(request, (parsedData) => {
            const newCountry = parsedData.name;
            const existingCountry = countries.find(c => c.name.toLowerCase() === newCountry.toLowerCase());

            if (existingCountry) {
                response.writeHead(400, { 'Content-Type': 'application/json' });
                return response.end(JSON.stringify({ error: 'Country already exists' }));
            }

            countries.push({ name: newCountry });
            response.writeHead(201, { 'Content-Type': 'application/json' });
            return response.end(JSON.stringify({ message: 'Country added successfully', country: { name: newCountry } }));
        });
    }
};

const onRequest = (request, response) => {
    const protocol = request.connection.encrypted ? 'https' : 'http';
    const parsedUrl = new URL(request.url, `${protocol}://${request.headers.host}`);

    if (request.method === 'POST') {
        handlePost(request, response, parsedUrl);
    } else {
        handleGet(request, response, parsedUrl);
    }
};

// Start the server
http.createServer(onRequest).listen(port, () => {
    console.log(`Listening on 127.0.0.1:${port}`);
});
