const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../helpers/wrapper');
const mailgun = require('../config/mail').mailgun;
const devEmail = require('../config/mail').devEmail;
const EmailSubjectEnum = require('../config/mail').EmailSubjectEnum;
const getFullSubject = require('../config/mail').getFullSubject;
const getSuccessMessage = require('../config/mail').getSuccessMessage;

var liveLinks = {}; // id : unix timestamp (seconds)
var runInterval = false;
const thirtyMin = 1800; // Seconds
const startInterval = () => {
  cleanLinks();
  if (runInterval) { // QUESTION: How often to run this?
    setTimeout(startInterval, 1000); // Milliseconds
  }
};
const cleanLinks = () => {
  const now = moment().unix();
  for (let keyID in liveLinks) {
    if (liveLinks.hasOwnProperty(keyID)) {
      if (now - liveLinks[keyID].time >= thirtyMin) {
        delete liveLinks[keyID];
      }
    }
  }
  if (Object.keys(liveLinks).length === 0) { // If empty object, then terminate interval loop
    runInterval = false;
  }
};

// QUESTION: BUG: Might not throw correctly? "wrapper" might not catch it?
const sendEmail = (client, data, res, successMessage, { linkID, id, email }) => {
  mailgun.messages().send(data, (error, body) => {
    if (error) {
      throw new Error('Email cannot be sent.');
    } else {
      (async () => {
        await client.query(`UPDATE users SET email = '${email}', email_verified = ${false} WHERE id = '${id}'`);
        liveLinks[linkID] = { time: moment().unix(), userID: id };
        if (!runInterval) {
          runInterval = true;
          startInterval();
        }
        res.status(200).send({ msg: successMessage, success: true });
      })().catch(err => {
        throw err;
      });
    }
  });
};

module.exports = (app, pool) => {
  app.post('/api/send_verification_email', wrapper(async (req, res, next) => {
    const { id, email } = req.body;
    const linkID = uuidv4();
    const subject = getFullSubject(EmailSubjectEnum.verification);
    const successMessage = getSuccessMessage(EmailSubjectEnum.verification);
    // TODO: Change this when in production
    const html = `Click on <a href="http://localhost:3000/verify/${linkID}">this link</a> to verify your email.\n\nBest, LDR App Team`;
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
      const res2 = await client.query(`SELECT id, email_verified FROM users WHERE email = '${email}'`);
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

  app.get('/verify/:id', wrapper(async (req, res, next) => {
    if (req.params.id in liveLinks) {
      const now = moment().unix();
      const { time, userID } = liveLinks[req.params.id];
      if (now - time < thirtyMin) { // If the link was visited within 30 min, then email is verified
        await pool.query(`UPDATE users SET email_verified = ${true} WHERE id = '${userID}'`);
        delete liveLinks[req.params.id];
      }
      res.send('Verified email!');
    } else {
      res.send('Oops! This link has expired. You will see a "link expired" page here.')
    }
  }));
};
