const express = require('express');
const app = express();
const http = require('http');
const { Pool } = require('pg');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const passport = require('passport');
const helmet = require('helmet');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
// const cors = require('cors');

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

// app.set('trust proxy', 1) // Trust reverse proxy when setting secure cookies (uncomment later when using nginx)

// ========================================== Middleware ==========================================
// https://expressjs.com/en/guide/error-handling.html
app.use(helmet());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'POST,GET,PUT,PATCH,DELETE'); // CRUD - create, read, update, delete
  res.header('Access-Control-Allow-Headers', 'X-Requested-With,X-HTTP-Method-Override,Content-Type,Accept,Authorization,Access-Control-Allow-Credentials,Access-Control-Allow-Origin,Access-Control-Allow-Methods,Access-Control-Allow-Headers');
  next();
});

app.use(morgan('dev')); // Enable HTTP request logging
app.use(bodyParser.json()); // Parse incoming requests as JSON (request body)
app.use(bodyParser.urlencoded({ extended: false }));
// https://www.npmjs.com/package/express-session
app.use(session({
  secret: 'hsunami',
  store: new pgSession({ pool }), // Where to store session data
  cookie: {
    path: '/',
    httpOnly: false,
    maxAge: null,
    // secure: true, // HTTPS connection
  },
  resave: false,
  saveUninitialized: false,
  unset: 'destroy', // default: 'keep'
}));

require('./config/passport')(passport, pool);
app.use(passport.initialize());
app.use(passport.session());

// const corsOptions = {
//   credentials: true,
//   origin: 'http://localhost:3000'
// };
// app.use(cors(corsOptions));

// Server resources
app.use('/images/topics', express.static(__dirname + '/public/images/topics'));
app.use('/images/profiles', express.static(__dirname + '/public/images/profiles'));

// ==================================== API Endpoints / Routes ====================================
require('./routes/authentication')(app, pool, passport);
require('./routes/comments')(app, pool);
require('./routes/discover')(app, pool);
require('./routes/email')(app, pool);
require('./routes/feed')(app, pool);
require('./routes/notifications')(app, pool);
require('./routes/partner')(app, pool);
require('./routes/posts')(app, pool);
require('./routes/profile')(app, pool);
require('./routes/search')(app, pool);
require('./routes/social')(app, pool);
require('./routes/topics')(app, pool);
require('./routes/users')(app, pool);

// ============================= Temporary routes for verifying email =============================
require('./routes/verify')(app, pool);

const server = http.Server(app);
require('./config/sockets')(server, pool);
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
