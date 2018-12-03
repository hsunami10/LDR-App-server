const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../helpers/wrapper');
const mailgun = require('../config/mail').mailgun;
const devEmail = require('../config/mail').devEmail;
const EmailSubjectEnum = require('../config/mail').EmailSubjectEnum;
const getFullSubject = require('../config/mail').getFullSubject;
const getSuccessMessage = require('../config/mail').getSuccessMessage;
const thirtyMin = 1800; // Seconds

// QUESTION: BUG: Might not throw correctly? "wrapper" might not catch it?
const sendEmail = (client, data, res, successMessage, { linkID, id, email }) => {
  mailgun.messages().send(data, (error, body) => {
    if (error) {
      res.status(200).send({ msg: 'Email cannot be sent, please check if it\'s valid' });
    } else {
      (async () => {
        await client.query(`UPDATE users SET email = '${email}', token = '${linkID}', token_time = ${moment().unix()}, email_verified = ${false} WHERE id = '${id}'`);
        res.status(200).send({ msg: successMessage, success: true });
      })().catch(err => {
        res.status(500).send(new Error(`Something went wrong: ${err.message}`));
      });
    }
  });
};

module.exports = (app, pool) => {
  app.post('/api/send-verification-email', wrapper(async (req, res, next) => {
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
      const res2 = await client.query(`SELECT id, email_verified, token_time FROM users WHERE email = '${email}'`);
      if (res2.rows.length === 0) { // No existing email
        // QUESTION: Do I even need this check here?
        const res3 = await client.query(`SELECT email, email_verified FROM users WHERE id = '${id}'`);
        if (res3.rows.length === 0) {
          throw new Error('When sending verification email, the user does not exist.');
        } else {
          sendEmail(client, data, res, successMessage, { linkID, id, email });
        }
      } else { // Existing email
        if (res2.rows[0].id === id) { // If the email exists and the same user requesting
          if (res2.rows[0].email_verified) {
            res.status(200).send({ msg: 'Email address already verified' });
          } else if (moment().unix() - res2.rows[0].token_time < thirtyMin) {
            res.status(200).send({ msg: 'Verification email already sent' });
          } else {
            sendEmail(client, data, res, successMessage, { linkID, id, email });
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
      const res2 = await client.query(`SELECT token_time FROM users WHERE token = '${req.params.id}'`);
      if (res2.rows.length === 0) {
        res.send('Oops! This link has expired. You will see a "link expired" page here.');
      } else if (now - res2.rows[0].token_time < thirtyMin) {
        await client.query(`UPDATE users SET email_verified = ${true}, token = null WHERE token = '${req.params.id}'`);
        res.send('Email Verified!');
      } else {
        res.send('Oops! This link has expired. You will see a "link expired" page here.');
      }
    } finally {
      client.release();
    }
  }));
};
