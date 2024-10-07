const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const PORT = 3000;

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use('/', express.static(path.resolve(`${__dirname}/../front/`)));

// Read the countries data from the JSON file
const countries = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/countries.json'), 'utf-8'));

// Endpoint to handle GET and HEAD requests for countries
app.get('/api/countries', (req, res) => {
  const countryName = req.query.name;

  // Find the country by name (case-insensitive)
  const country = countries.find(c => c.name.toLowerCase() === countryName.toLowerCase());

  if (!country) {
    return res.status(404).send({ error: 'Country not found' });
  }

  res.json(country); // Send the country data as JSON
});

app.head('/api/countries', (req, res) => {
  const countryName = req.query.name;

  // Find the country by name (case-insensitive)
  const country = countries.find(c => c.name.toLowerCase() === countryName.toLowerCase());

  if (!country) {
    return res.status(404).send();
  }

  // Send only the headers, no body content
  res.status(200).end();
});


// POST request to add a new country
app.post('/api/countries', (req, res) => {
  const newCountry = { name: req.body.name || 0 };

  // Check if country with the same name already exists
  const existingCountry = countries.find(c => c.name.toLowerCase() === newCountry.name.toLowerCase());

  if (existingCountry) {
      return res.status(400).json({ error: 'Country already exists' });
  }

  // Add the new country to the array
  countries.push(newCountry);

  // Respond with success
  return res.status(201).json({ message: 'Country added successfully', country: newCountry });
});


// Start the server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });