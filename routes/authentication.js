const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../middleware/wrapper');
const mailgun = require('../config/mail').mailgun;
const devEmail = require('../config/mail').devEmail;
const EmailSubjectEnum = require('../config/mail').EmailSubjectEnum;
const getFullSubject = require('../config/mail').getFullSubject;
const getSuccessMessage = require('../config/mail').getSuccessMessage;
const hashPlainText = require('../assets/authentication').hashPlainText;

// TODO: Change cookie-based authentication to token-based authentication

module.exports = (app, pool) => {
  // ======================================= Forgot Password =======================================
  app.post('/api/login/forgot-password', wrapper(async (req, res, next) => {
    const { email } = req.body;
    const subject = getFullSubject(EmailSubjectEnum.password);
    const successMessage = getSuccessMessage(EmailSubjectEnum.password);

    const res2 = await pool.query(`SELECT username, password, email_verified FROM users WHERE email = '${email}' AND deleted = false`);
    if (res2.rows.length === 0) {
      res.status(200).send({ msg: 'Email address is not registered / verified to any account' });
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
  // Only on logging in screen
  app.post('/api/login', wrapper(async (req, res, next) => {
    // TODO: Finish this later
    res.status(200).send({ id: req.user.id });
  }));

  app.get('/api/logout', wrapper(async (req, res, next) => {
    // TODO: Finish this later
    res.sendStatus(200);
  }));

  // ========================================== Signing Up ==========================================
  app.post('/api/signup', wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      const { username, password } = req.body;
      const id = uuidv4();
      let res2, hashPassword;
      [res2, hashPassword] = await Promise.all([
        client.query(`SELECT id FROM users WHERE lowercase_username = '${username.toLowerCase()}' AND deleted = false`),
        hashPlainText(password)
      ]);
      if (res2.rows.length === 0) {
        const cols = [id, username, username.toLowerCase(), hashPassword, moment().unix()];
        await client.query(`INSERT INTO users (id, username, lowercase_username, password, date_joined) VALUES ($1, $2, $3, $4, $5)`, cols);
        res.status(200).send({ id });
      } else {
        res.status(200).send({ msg: 'Username already taken.' });
      }
    } finally {
      client.release();
    }
  }))

  // Only after sign up response
  app.post('/api/start-session', wrapper(async (req, res, next) => {
    // TODO: Finish this later
    res.sendStatus(200);
  }))
};
