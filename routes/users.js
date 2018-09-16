const uuidv4 = require('uuid/v4');
const shortid = require('shortid');
const mailgun = require('../config/mail').mailgun;
const devEmail = require('../config/mail').devEmail;
const EmailSubjectEnum = require('../config/mail').EmailSubjectEnum;
const getFullSubject = require('../config/mail').getFullSubject;
const getSuccessMessage = require('../config/mail').getSuccessMessage;

module.exports = (app, pool) => {
  // Send email to development team
  app.post('/api/user/send_email', (req, res) => {
    const { text, subjectEnum, id } = req.body;
    const subject = getFullSubject(subjectEnum);
    const successMessage = getSuccessMessage(subjectEnum);
    let data = {};
    (async () => {
      const res2 = await pool.query(`SELECT username, email, email_verified FROM users WHERE id = '${id}'`);
      if (res2.rows.length === 0) {
        res.status(200).send({ msg: 'User account does not exist' });
      } else {
        const { username, email, email_verified } = res2.rows[0];
        if (!email) {
          res.status(200).send({ msg: 'No email registered for this account'});
        } else {
          if (email_verified) {
            data = {
              from: `${username} <${email}>`,
              to: devEmail,
              subject,
              text
            }
            mailgun.messages().send(data, (error, body) => {
              res.status(200).send({ msg: successMessage, success: true });
            });
          } else {
            res.status(200).send({ msg: 'Email address not verified' });
          }
        }
      }
    })().catch(err => {
      console.log(err);
      res.status(500).send(`Something went wrong: ${err}`)
    });
  });

  // Get public / private user data
  app.get('/api/user/:id/:type', (req, res) => {
      const { id, type } = req.params;
      if (type === 'private') {
        res.status(200).send({ msg: 'private user', id: req.params.id });
      } else if (type === 'public') {
        res.status(200).send({ msg: 'public user', id: req.params.id });
      }
    });

  // Set active status true / false
  app.put('/api/user/set_active', (req, res) => {
    (async () => {
      const { id, bool } = req.body;
      const res2 = await pool.query(`UPDATE users SET active = ${bool} WHERE id = '${id}'`)
      res.sendStatus(200);
    })().catch(err => {
      console.log(err);
      res.status(500).send(`Something went wrong: ${err}`)
    });
  });
};
