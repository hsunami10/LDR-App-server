const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../helpers/wrapper');
const mailgun = require('../config/mail').mailgun;
const devEmail = require('../config/mail').devEmail;
const EmailSubjectEnum = require('../config/mail').EmailSubjectEnum;
const getFullSubject = require('../config/mail').getFullSubject;
const getSuccessMessage = require('../config/mail').getSuccessMessage;

module.exports = (app, pool) => {
  // ======================================= Forgot Password =======================================
  app.post('/api/login/forgot-password', wrapper(async (req, res, next) => {
    const { email } = req.body;
    const subject = getFullSubject(EmailSubjectEnum.password);
    const successMessage = getSuccessMessage(EmailSubjectEnum.password);

    const res2 = await pool.query(`SELECT username, password, email_verified FROM users WHERE email = '${email}'`);
    if (res2.rows.length === 0) {
      res.status(200).send({ msg: 'Email address is not registered to any account' });
    } else {
      const { username, password, email_verified } = res2.rows[0];
      if (email_verified) {
        const text = `Here is your password: ${password}. Please keep it secure, and don't forget it!\n\nBest, LDR App Team`;
        const data = {
          from: devEmail,
          to: `${username} <${email}>`,
          subject,
          text
        };
        mailgun.messages().send(data, (error, body) => {
          if (error) {
            throw new Error('Email cannot be sent.');
          } else {
            res.status(200).send({ msg: successMessage, success: true });
          }
        });
      } else {
        res.status(200).send({ msg: 'Email address not verified', not_verified: true });
      }
    }
  }));

  // ====================================== Logging In / Out ======================================
  // Info needed upon login: id only
  app.get('/api/login/:username/:password', wrapper(async (req, res, next) => {
    const { username, password } = req.params;
    // NOTE: Same query as get /api/user/:id private || public
    const res2 = await pool.query(`SELECT id FROM users WHERE username = '${username}' AND password = '${password}'`);
    if (res2.rows.length === 0) {
      res.status(200).send({ msg: 'Invalid username or password' }); // Cannot find user
    } else {
      res.status(200).send({ id: res2.rows[0].id });
    }
  }));

  // ========================================== Signing Up ==========================================
  app.post('/api/signup/username', wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      const { username, password } = req.body;
      const id = uuidv4();
      const res2 = await client.query(`SELECT id FROM users WHERE lowercase_username = '${username.toLowerCase()}'`); // Ignore case sensitivity
      if (res2.rows.length === 0) {
        const cols = [id, username, username.toLowerCase(), password, '', moment().unix()];
        const res3 = await client.query(`INSERT INTO users (id, username, lowercase_username, password, bio, date_joined) VALUES ($1, $2, $3, $4, $5, $6)`, cols);
        res.status(200).send({ id });
      } else {
        res.status(200).send({ msg: 'Username already taken.' });
      }
    } finally {
      client.release();
    }
  }));
};
