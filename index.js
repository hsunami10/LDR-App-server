const express = require('express');
const app = express();
const { Pool } = require('pg');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 3000;
console.log(process.env);

const pool = new Pool({
  connectionString: 'postgres://michaelhsu:ewoks4life@localhost:5432/ldr_app'
});
pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// Middleware
app.use(morgan('dev')); // Enable HTTP request logging
app.use(bodyParser.json()) // Parse incoming requests as JSON (request body)
app.use(bodyParser.urlencoded({ extended: false }))

// Routes
require('./routes/authentication')(app, pool);
require('./routes/users')(app, pool);

const server = require('http').Server(app);
require('./config/sockets')(server, pool);
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
