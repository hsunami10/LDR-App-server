const uuidv4 = require('uuid/v4');
const shortid = require('shortid');
const moment = require('moment');
const wrapper = require('../middleware/wrapper');

module.exports = (app, pool) => {
  // ====================================== Logging In / Out ======================================
  app.get('/api/login/:username/:password', wrapper(async (req, res) => {
    (async () => {
      const client = await pool.connect();
      try {
        const { username, password } = req.params;
        const res2 = await client.query(`SELECT id FROM users WHERE username = '${username}' AND password = '${password}'`);
        if (res2.rows.length === 0) {
          res.status(200).send({ msg: 'Invalid username or password' }); // Cannot find user
        } else {
          res.status(200).send({ id: res2.rows[0].id });
        }
      } finally {
        client.release();
      }
    })().catch(err => {
      console.log(err);
      res.status(500).send(`Something went wrong: ${err}`)
    });
  }));

  // ========================================== Signing Up ==========================================
  app.post('/api/signup/username', (req, res) => {
    (async () => {
      const client = await pool.connect();
      try {
        const { username, password } = req.body;
        const id = uuidv4();
        const res2 = await client.query(`SELECT id FROM users WHERE lower_case_username = '${username.toLowerCase()}'`); // Ignore case sensitivity
        if (res2.rows.length === 0) {
          const cols = [id, username, username.toLowerCase(), password, moment()];
          const res3 = await client.query(`INSERT INTO users (id, username, lower_case_username, password, date_joined) VALUES ($1, $2, $3, $4, $5)`, cols);
          res.status(200).send({ id });
        } else {
          res.status(200).send({ msg: 'Username already taken.' });
        }
      } finally {
        client.release();
      }
    })().catch(err => {
      console.log(err);
      res.status(500).send(`Something went wrong: ${err}`)
    });
  });
};
