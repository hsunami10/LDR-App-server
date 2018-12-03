const express = require('express');
const app = express();
const { Pool } = require('pg');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const passport = require('passport'); // TODO: Implement authentication
const session = require('express-session'); // TODO: Implement authentication

const PORT = process.env.PORT || 3000; // TODO: Change this when in production
// console.log(process.env);

// Initialize and configure database
const pool = new Pool({
  connectionString: `postgres://michaelhsu:ewoks4life@localhost:5432/ldr_app` // TODO: Change this when in production
});
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// ========================================== Middleware ==========================================
app.use(morgan('dev')); // Enable HTTP request logging
app.use(bodyParser.json()); // Parse incoming requests as JSON (request body)
app.use(bodyParser.urlencoded({ extended: false }));

// Server resources
app.use('/images/topics', express.static(__dirname + '/public/images/topics'));
app.use('/images/profiles', express.static(__dirname + '/public/images/profiles'));

// ==================================== API Endpoints / Routes ====================================
require('./routes/authentication')(app, pool);
require('./routes/comments')(app, pool);
require('./routes/feed')(app, pool);
require('./routes/partner')(app, pool);
require('./routes/posts')(app, pool);
require('./routes/profile')(app, pool);
require('./routes/topics')(app, pool);
require('./routes/users')(app, pool);

// ============================= Temporary routes for verifying email =============================
require('./routes/verify')(app, pool);

const server = require('http').Server(app);
require('./config/sockets')(server, pool);
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
