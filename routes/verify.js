const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../middleware/wrapper');
const mailgun = require('../config/mail').mailgun;
const devEmail = require('../config/mail').devEmail;
const EmailSubjectEnum = require('../config/mail').EmailSubjectEnum;
const getFullSubject = require('../config/mail').getFullSubject;
const getSuccessMessage = require('../config/mail').getSuccessMessage;
const thirtyMin = require('../assets/constants').THIRTY_MIN; // Seconds
const isAuthenticated = require('../assets/authentication').isAuthenticated;

// QUESTION: BUG: Might not throw correctly? "wrapper" might not catch it?
const sendVerificationEmail = (client, data, res, successMessage, { linkID, id, email }) => {
  mailgun.messages().send(data, (error, body) => {
    if (error) {
      res.status(200).send({ msg: 'Email cannot be sent, please check if it\'s valid' });
    } else {
      (async () => {
        await client.query(`UPDATE users SET email = '${email}', email_token = '${linkID}', email_token_exp = ${moment().unix()}, email_verified = ${false} WHERE id = '${id}'`);
        res.status(200).send({ msg: successMessage, success: true });
      })().catch(err => {
        res.status(500).send(new Error(`Something went wrong: ${err.message}`));
      });
    }
  });
};

module.exports = (app, pool) => {
  app.post('/api/send-verification-email', isAuthenticated, wrapper(async (req, res, next) => {
    const { id, email } = req.body;
    const linkID = uuidv4();
    const subject = getFullSubject(EmailSubjectEnum.verification);
    const successMessage = getSuccessMessage(EmailSubjectEnum.verification);
    // TODO: Change this when in production
    const html = `Click on <a href="http://localhost:3000/verify-email/${linkID}">this link</a> to verify your email.\n\nBest, LDR App Team`;
    const data = {
      from: devEmail,
      to: email,
      subject,
      html
    };

    // Check if 1. email already in use, 2. if already in use, if it's already verified.
    const client = await pool.connect();
    try {
      // Check if there's an existing user with the email
      const res2 = await client.query(`SELECT id, email_verified, email_token_exp FROM users WHERE email = '${email}' AND deleted = false`);
      if (res2.rows.length === 0) { // No existing email
        // QUESTION: Do I even need this check here?
        const res3 = await client.query(`SELECT email, email_verified FROM users WHERE id = '${id}' AND deleted = false`);
        if (res3.rows.length === 0) {
          throw new Error('When sending verification email, the user does not exist.');
        } else {
          sendVerificationEmail(client, data, res, successMessage, { linkID, id, email });
        }
      } else { // Existing email
        if (res2.rows[0].id === id) { // If the email exists and the same user requesting
          if (res2.rows[0].email_verified) {
            res.status(200).send({ msg: 'Email address already verified' });
          } else if (moment().unix() - res2.rows[0].email_token_exp < thirtyMin) {
            res.status(200).send({ msg: 'Verification email already sent' });
          } else {
            sendVerificationEmail(client, data, res, successMessage, { linkID, id, email });
          }
        } else { // If the email exists and not the same user
          res.status(200).send({ msg: 'Email address already in use' });
        }
      }
    } finally {
      client.release();
    }
  }));

  app.get('/verify-email/:id', wrapper(async (req, res, next) => {
    const now = moment().unix();
    const client = await pool.connect();
    try {
      const res2 = await client.query(`SELECT email_token_exp FROM users WHERE email_token = '${req.params.id}' AND deleted = false`);
      if (res2.rows.length === 0) {
        res.send('Oops! This link has expired. You will see a "link expired" page here.');
      } else if (now - res2.rows[0].email_token_exp < thirtyMin) {
        await client.query(`UPDATE users SET email_verified = ${true}, email_token = null WHERE email_token = '${req.params.id}'`);
        res.send('Email Verified!');
      } else {
        res.send('Oops! This link has expired. You will see a "link expired" page here.');
      }
    } finally {
      client.release();
    }
  }));
};
