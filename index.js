const express = require('express');
const app = express();
const http = require('http');
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
// https://expressjs.com/en/guide/error-handling.html
app.use(morgan('dev')); // Enable HTTP request logging
app.use(bodyParser.json()); // Parse incoming requests as JSON (request body)
app.use(bodyParser.urlencoded({ extended: false }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'POST,GET,PUT,DELETE'); // CRUD - create, read, update, delete
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  next();
});

// Server resources
app.use('/images/topics', express.static(__dirname + '/public/images/topics'));
app.use('/images/profiles', express.static(__dirname + '/public/images/profiles'));

// ==================================== API Endpoints / Routes ====================================
require('./routes/authentication')(app, pool);
require('./routes/comments')(app, pool);
require('./routes/email')(app, pool);
require('./routes/feed')(app, pool);
require('./routes/partner')(app, pool);
require('./routes/posts')(app, pool);
require('./routes/profile')(app, pool);
require('./routes/topics')(app, pool);
require('./routes/users')(app, pool);

// ============================= Temporary routes for verifying email =============================
require('./routes/verify')(app, pool);

const server = http.Server(app);
require('./config/sockets')(server, pool);
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
