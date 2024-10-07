const express = require('express');
const http = require('http');
const path = require('path');
const PORT = 3000;

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use('/', express.static(path.resolve(`${__dirname}/../front/`)));


// Start the server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });