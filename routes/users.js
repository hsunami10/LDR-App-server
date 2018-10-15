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
      // According to the type "private" or "public" or "edit"
      // "private" - stores (own) profile in state, "public" - seeing public profiles, both get the same data, different client actions
      // "edit" - get the rest of the data needed for profile management
      let res2 = null;
      const { type } = req.query;
      if (type === 'private' || type === 'public') {
        // TODO: Finish getting all public information - partner (if applicable), countdown (if applicable), posts
        // Get friends and subscribers when the tabs (in view profile screen) are visited
        // NOTE: Same query as get /api/login/:username/:password
        res2 = await pool.query(`SELECT username, profile_pic, bio, date_joined, active, user_type FROM users WHERE id = '${req.params.id}'`);
      } else if (type === 'edit') {
        console.log('get rest of profile needed to edit - more private information');
      } else {
        throw new Error('get: /api/user, type has to be either "private", "public", or "edit"');
      }

      if (res2.rows.length === 0) {
        res.status(200).send({
          success: false,
          type: type
        });
      } else {
        res.status(200).send({
          success: true,
          type: type,
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
