const wrapper = require('../assets/wrapper');
const mailgun = require('../config/mail').mailgun;
const devEmail = require('../config/mail').devEmail;
const EmailSubjectEnum = require('../config/mail').EmailSubjectEnum;
const getFullSubject = require('../config/mail').getFullSubject;
const getSuccessMessage = require('../config/mail').getSuccessMessage;
const ensureAuthenticated = require('../assets/authentication').ensureAuthenticated;

module.exports = (app, pool) => {
  app.post('/api/send-email', wrapper(async (req, res, next) => {
    const { text, subjectEnum, id } = req.body;
    const subject = getFullSubject(subjectEnum);
    const successMessage = getSuccessMessage(subjectEnum);

    const res2 = await pool.query(`SELECT username, email, email_verified FROM users WHERE id = '${id}' AND deleted = false`);
    if (res2.rows.length === 0) {
      res.status(200).send({ msg: 'User account does not exist' });
    } else {
      const { username, email, email_verified } = res2.rows[0];
      if (!email) {
        res.status(200).send({ msg: 'No email registered for this account', register_email: true });
      } else {
        if (email_verified) {
          const data = {
            from: `${username} <${email}>`,
            to: devEmail,
            subject,
            text
          }
          mailgun.messages().send(data, (error, body) => {
            if (error) {
              throw new Error('Email cannot be sent');
            } else {
              res.status(200).send({ msg: successMessage, success: true });
            }
          });
        } else {
          res.status(200).send({ msg: 'Email address not verified', not_verified: true });
        }
      }
    }
  }))
}
