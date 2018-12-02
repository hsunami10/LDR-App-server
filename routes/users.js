const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../helpers/wrapper');
const mailgun = require('../config/mail').mailgun;
const devEmail = require('../config/mail').devEmail;
const EmailSubjectEnum = require('../config/mail').EmailSubjectEnum;
const getFullSubject = require('../config/mail').getFullSubject;
const getSuccessMessage = require('../config/mail').getSuccessMessage;

const pagePostsQuery = require('../helpers/paginate').posts;
const pageInteractionsQuery = require('../helpers/paginate').interactions;
const pageFeedQuery = require('../helpers/paginate').feed;

module.exports = (app, pool) => {
  app.route('/api/user/:id')
    .get(wrapper(async (req, res, next) => { // TODO: Figure out how to lazy load
      // According to the type "private" or "public" or "edit"
      // "private" - stores (own) profile in state, "public" - seeing public profiles, both get the same data, different client actions
      // "edit" - get the rest of the data needed for profile management
      const client = await pool.connect();
      try {
        let users, posts, interactions, friends;
        const targetID = req.params.id;
        const { type, user_id } = req.query;
        if (type === 'private' || type === 'public') {
          const usersQuery = `SELECT id, username, profile_pic, coordinates, date_joined, active, user_type FROM users WHERE id = '${targetID}'`;
          const postsQuery = pagePostsQuery(targetID, 'date_posted', 'DESC', 0);
          const interactionsQuery = pageInteractionsQuery(targetID, 0);
          const friendsQuery = `SELECT id, user1_id, user2_id, date_friended FROM friends WHERE user1_id = '${targetID}' OR user2_id = '${targetID}'`; // TODO: Page friends query here

          // Get friends and subscribers when the tabs (in view profile screen) are visited
          [users, posts, interactions, friends] = await Promise.all([
            client.query(usersQuery),
            client.query(postsQuery),
            client.query(interactionsQuery),
            client.query(friendsQuery)
          ]);
        } else {
          throw new Error('get: /api/user, type has to be either "private", "public"');
        }

        const store = {}; // Track which postIDs have already been stored in filter
        const filter = []; // Store postID queries
        const postsLen = posts.rows.length;
        const postsOrder = new Array(postsLen), postsObj = {};

        const interLen = interactions.rows.length;
        const interOrder = new Array(interLen), interObj = {};

        const friendsLen = friends.rows.length;

        let flag = true;
        let i = 0;
        while (flag) {
          if (i <= postsLen - 1) {
            if (!store[posts.rows[i].id]) {
              filter.push(`post_id = '${posts.rows[i].id}'`);
              store[posts.rows[i].id] = true;
            }
            postsOrder[i] = posts.rows[i].id;
            postsObj[posts.rows[i].id] = posts.rows[i];
            flag = false;
          }
          if (i <= interLen - 1) {
            if (!store[posts.rows[i].id]) {
              filter.push(`post_id = '${interactions.rows[i].id}'`);
              store[interactions.rows[i].id] = true;
            }
            interOrder[i] = interactions.rows[i].id;
            interObj[interactions.rows[i].id] = interactions.rows[i];
            flag = false;
          }

          flag = !flag;
          i++;
        }

        // NOTE: ALL post likes - posts & interactions
        let post_likes = await client.query(`SELECT post_id FROM post_likes WHERE (user_id = '${user_id}') ${filter.length > 0 ? `AND (${filter.join(' OR ')})` : ''}`);
        // Convert to object that keeps track of whether or not the post has already been liked
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
              posts: {
                offset: postsLen,
                data: postsObj,
                order: postsOrder,
                post_likes // Includes post_likes from posts AND interactions
              },
              interactions: {
                offset: interLen,
                data: interObj,
                order: interOrder
              },
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
};
