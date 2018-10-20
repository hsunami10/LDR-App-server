const uuidv4 = require('uuid/v4');
const moment = require('moment');
const limit = require('../config/constants').limit;
const wrapper = require('../helpers/wrapper');
const mailgun = require('../config/mail').mailgun;
const devEmail = require('../config/mail').devEmail;
const EmailSubjectEnum = require('../config/mail').EmailSubjectEnum;
const getFullSubject = require('../config/mail').getFullSubject;
const getSuccessMessage = require('../config/mail').getSuccessMessage;

module.exports = (app, pool) => {
  app.route('/api/user/:id')
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

  app.get('/api/user/:id/:type', wrapper(async (req, res, next) => {
    // According to the type "private" or "public" or "edit"
    // "private" - stores (own) profile in state, "public" - seeing public profiles, both get the same data, different client actions
    // "edit" - get the rest of the data needed for profile management
    const client = await pool.connect();
    try {
      let users, posts, partners;
      const { id, type } = req.params;
      if (type === 'private' || type === 'public') {
        // Get friends and subscribers when the tabs (in view profile screen) are visited
        [users, posts, partners] = await Promise.all([
          client.query(`SELECT username, profile_pic, bio, date_joined, active, user_type FROM users WHERE id = '${id}'`),
          client.query(`SELECT * FROM (SELECT id, topic_id, author_id, alias_id, date_posted, body, coordinates, num_likes, ROW_NUMBER () OVER (ORDER BY date_posted DESC) AS RowNum FROM posts WHERE author_id = '${id}') AS RowConstrainedResult WHERE RowNum > 0 AND RowNum <= ${limit} ORDER BY RowNum`),
          client.query(`SELECT user1_id, user2_id, date_together, countdown FROM partners WHERE user1_id = '${id}' OR user2_id = '${id}'`)
        ]);
      } else if (type === 'edit') {
        console.log('get rest of profile needed to edit - more private information');
      } else {
        throw new Error('get: /api/user, type has to be either "private", "public", or "edit"');
      }

      if (users.rows.length === 0) {
        res.status(200).send({
          success: false,
          type: type
        });
      } else {
        res.status(200).send({
          success: true,
          type: type,
          user: {
            ...users.rows[0],
            posts: posts.rows,
            partner: partners.rows.length === 0 ? null : partners.rows[0]
          }
        });
      }
    } finally {
      client.release();
    }
  }))
};
