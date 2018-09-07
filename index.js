const app = require('express')();
const pg = require('pg');
const morgan = require('morgan');

const PORT = process.env.PORT || 3000;
console.log(process.env);
const pool = new pg.Pool({
  user: 'michaelhsu',
  host: 'localhost',
  database: 'ldr_app',
  port: 5432
});

app.use(morgan('dev'));

require('./routes/authentication')(app, pool);

const server = require('http').Server(app);
require('./config/sockets')(server);
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
