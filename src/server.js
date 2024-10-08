const http = require('http');
const path = require('path');
const fs = require('fs');
const PORT = 3000;

// Read the countries data from the JSON file
const countries = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/countries.json'), 'utf-8'));

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url.startsWith('/api/countries')) {
        const urlObj = new URL(req.url, `http://${req.headers.host}`);
        const countryName = urlObj.searchParams.get('name');

        if (!countryName) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Country name is required' }));
        }

        const country = countries.find(c => c.name.toLowerCase() === countryName.toLowerCase());

        if (!country) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Country not found' }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(country));
    }

    if (req.method === 'HEAD' && req.url.startsWith('/api/countries')) {
        const urlObj = new URL(req.url, `http://${req.headers.host}`);
        const countryName = urlObj.searchParams.get('name');

        const country = countries.find(c => c.name.toLowerCase() === countryName.toLowerCase());

        if (!country) {
            res.writeHead(404);
            return res.end();
        }

        res.writeHead(200);
        return res.end();
    }

    if (req.method === 'POST' && req.url === '/api/countries') {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', () => {
            try {
                const newCountry = JSON.parse(body); // Parse the JSON body

                // Check if country already exists
                const existingCountry = countries.find(c => c.name.toLowerCase() === newCountry.name.toLowerCase());

                if (existingCountry) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Country already exists' }));
                }

                // Add the new country to the array
                countries.push(newCountry);

                res.writeHead(201, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ message: 'Country added successfully', country: newCountry }));
            } catch (err) {
                console.error('Error parsing JSON:', err);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    }

    // Serve static files (e.g., HTML, CSS, JS)
    const filePath = path.join(__dirname, '../front', req.url === '/' ? 'index.html' : req.url);
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            return res.end('<h1>404 Not Found</h1>');
        }

        const ext = path.extname(filePath);
        let contentType = 'text/html';

        switch (ext) {
            case '.css':
                contentType = 'text/css';
                break;
            case '.js':
                contentType = 'application/javascript';
                break;
        }

        res.writeHead(200, { 'Content-Type': contentType });
        return res.end(content);
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
