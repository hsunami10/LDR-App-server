const uuidv4 = require('uuid/v4');
const moment = require('moment');
const pagePostsQuery = require('../helpers/paginate').posts;
const wrapper = require('../helpers/wrapper');
const mailgun = require('../config/mail').mailgun;
const devEmail = require('../config/mail').devEmail;
const EmailSubjectEnum = require('../config/mail').EmailSubjectEnum;
const getFullSubject = require('../config/mail').getFullSubject;
const getSuccessMessage = require('../config/mail').getSuccessMessage;
const getUserAliases = require('../helpers/queries').getUserAliases;

module.exports = (app, pool) => {
  app.route('/api/user/:id')
    .get(wrapper(async (req, res, next) => {
      // According to the type "private" or "public" or "edit"
      // "private" - stores (own) profile in state, "public" - seeing public profiles, both get the same data, different client actions
      // "edit" - get the rest of the data needed for profile management
      const client = await pool.connect();
      try {
        let users, posts, partners, aliases;
        const { id } = req.params;
        const { type, user_id } = req.query;
        if (type === 'private' || type === 'public') {
          // Get friends and subscribers when the tabs (in view profile screen) are visited
          [users, posts, partners, aliases] = await Promise.all([
            client.query(`SELECT id, username, profile_pic, bio, coordinates, date_joined, active, user_type FROM users WHERE id = '${id}'`),
            client.query(pagePostsQuery(id, 'date_posted', 'DESC', 0)),
            client.query(`SELECT user1_id, user2_id, date_together, countdown FROM partners WHERE user1_id = '${id}' OR user2_id = '${id}'`),
            client.query(getUserAliases(id))
          ]);
        } else if (type === 'edit') {
          console.log('get rest of profile needed to edit - more private information');
        } else if (type === 'partner') {
          console.log('get partner\'s profile - hide posts that have aliases');
        } else {
          throw new Error('get: /api/user, type has to be either "private", "public", or "edit"');
        }

        // Only get likes for the posts retrieved, not likes from all time
        const length = posts.rows.length;
        const filter = new Array(length), postsOrder = new Array(length), postsObj = {};
        for (let i = 0; i < length; i++) {
          filter[i] = `post_id = '${posts.rows[i].id}'`;
          postsOrder[i] = posts.rows[i].id;
          postsObj[posts.rows[i].id] = posts.rows[i];
        }
        let post_likes = await client.query(`SELECT post_id FROM post_likes WHERE (user_id = '${user_id}') ${filter.length > 0 ? `AND (${filter.join(' OR ')})` : ''}`);

        // Convert to object that maps post_id to likes
        post_likes = post_likes.rows.reduce((acc, post_like) => {
          acc[post_like.post_id] = true;
          return acc;
        }, {});

        if (users.rows.length === 0) {
          res.status(200).send({
            success: false,
            type
          });
        } else {
          res.status(200).send({
            success: true,
            type,
            user: {
              ...users.rows[0],
              aliases: aliases.rows,
              posts: {
                offset: length,
                data: postsObj,
                order: postsOrder,
                post_likes
              },
              partner: partners.rows.length === 0 ? null : partners.rows[0],
              initial_loading: false,
              refreshing: false
            }
          });
        }
      } finally {
        client.release();
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

  app.get('/api/user/alias/:id', wrapper(async (req, res, next) => {
    // NOTE: Same query as above
    const res2 = await pool.query(getUserAliases(req.params.id));
    res.status(200).send(res2.rows);
  }))
};
