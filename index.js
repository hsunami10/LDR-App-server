const express = require('express');
const app = express();
const pg = require('pg');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 3000;
console.log(process.env);
const pool = new pg.Pool({
  user: 'michaelhsu',
  host: 'localhost',
  database: 'ldr_app',
  port: 5432
});

// Middleware
app.use(morgan('dev')); // Enable HTTP request logging
app.use(bodyParser.json()) // Parse in coming requests as JSON (under request body)
app.use(bodyParser.urlencoded({ extended: false }))

// Routes
require('./routes/authentication')(app, pool);
require('./routes/users')(app, pool);

const server = require('http').Server(app);
require('./config/sockets')(server);
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
