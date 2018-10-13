const uuidv4 = require('uuid/v4');
const wrapper = require('../helpers/wrapper');
const mailgun = require('../config/mail').mailgun;
const devEmail = require('../config/mail').devEmail;
const EmailSubjectEnum = require('../config/mail').EmailSubjectEnum;
const getFullSubject = require('../config/mail').getFullSubject;
const getSuccessMessage = require('../config/mail').getSuccessMessage;

module.exports = (app, pool) => {
  app.route('/api/user/:id')
    .get(wrapper(async (req, res, next) => { // http://localhost:3000/api/user/sfldkfjadskfsdf?type=private
      // TODO: Find a way to get all user's posts & subscribers & other info (countdown, partner, etc.)
      // According to the type "private" or "public"
      let res2 = null;
      if (req.query.type === 'private') {
        res2 = await pool.query(`SELECT id, username, password, email, profile_pic, bio, date_joined, coordinates, active, user_type FROM users WHERE id = '${req.params.id}'`);
      } else if (req.query.type === 'public') {
        res2 = await pool.query(`SELECT id, username, profile_pic, bio, date_joined, active FROM users WHERE id = '${req.params.id}'`);
      }

      if (res2.rows.length === 0) {
        res.status(200).send({ success: false });
      } else {
        res.status(200).send({
          success: true,
          type: req.query.type,
          user: res2.rows[0]
        });
      }
    }))
    .post(wrapper(async (req, res, next) => {
      if (req.params.id === 'send-email') {
        const { text, subjectEnum, id } = req.body;
        const subject = getFullSubject(subjectEnum);
        const successMessage = getSuccessMessage(subjectEnum);

        const res2 = await pool.query(`SELECT username, email, email_verified FROM users WHERE id = '${id}'`);
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
      }
    }))
    .put(wrapper(async (req, res, next) => {
      if (req.params.id === 'set-active') {
        const { id, bool } = req.body;
        const res2 = await pool.query(`UPDATE users SET active = ${bool} WHERE id = '${id}'`)
        res.sendStatus(200);
      }
    }))
    .delete(wrapper(async (req, res, next) => {
      res.send('delete user with user id: ' + req.params.id);
    }))
};
