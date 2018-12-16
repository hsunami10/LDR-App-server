const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../assets/wrapper');
const mailgun = require('../config/mail').mailgun;
const devEmail = require('../config/mail').devEmail;
const EmailSubjectEnum = require('../config/mail').EmailSubjectEnum;
const getFullSubject = require('../config/mail').getFullSubject;
const getSuccessMessage = require('../config/mail').getSuccessMessage;
const NO_USER_MSG = require('../assets/constants').NO_USER_MSG;
const getUserRequests = require('../assets/queries').getUserRequests;
const getPendingRequests = require('../assets/queries').getPendingRequests;
const getUserFriends = require('../assets/queries').getUserFriends;

const pageInteractionsQuery = require('../assets/paginate').interactions;
const pagePostsQuery = require('../assets/paginate').posts;

module.exports = (app, pool) => {
  app.route('/api/user/:id')
    // TODO: Change to ONLY get posts - do not get interactionsn or friends - lazy loading
    .get(wrapper(async (req, res, next) => { // TODO: Figure out how to lazy load
      // According to the type "private" or "public" or "edit"
      // "private" - stores (own) profile in state, "public" - seeing public profiles, both get the same data, different client actions
      // "edit" - get the rest of the data needed for profile management
      const client = await pool.connect();
      try {
        let partners, users, posts, interactions, friends;
        const targetID = req.params.id;
        const { type, user_id } = req.query;
        if (type === 'private' || type === 'public') {
          // NOTE: Make sure this is the same as routes/partner.js put() /api/partner/accept, partner query - SAME AS GET_USER_PARTNER
          const partnersQuery = `SELECT * FROM get_user_partner('${targetID}') AS (id text, username text, profile_pic text, date_together bigint, countdown bigint, type text)`;
          const usersQuery = `SELECT id, username, profile_pic, bio, coordinates, date_joined, active, user_type FROM users WHERE id = '${targetID}' AND deleted = false`;
          const postsQuery = pagePostsQuery(`posts.author_id = '${targetID}'`, 'date_posted', 'DESC', 0);
          const interactionsQuery = pageInteractionsQuery(targetID, 0);
          // TODO: Remember to take your (user_id) blocked users into account
          // const friendsQuery = `SELECT id, user1_id, user2_id, date_friended FROM friends WHERE user1_id = '${targetID}' OR user2_id = '${targetID}'`; // TODO: Page friends query here

          // Get friends and subscribers when the tabs (in view profile screen) are visited
          [partners, users, posts, interactions, friends] = await Promise.all([
            client.query(partnersQuery),
            client.query(usersQuery),
            client.query(postsQuery),
            client.query(interactionsQuery),
            // client.query(friendsQuery)
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

        // const friendsLen = friends.rows.length;

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
            error: NO_USER_MSG,
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
              refreshing: false,
              partner: partners.rows.length === 0 ? null : partners.rows[0]
            }
          });
        }
      } finally {
        client.release();
      }
    }))
    .post(wrapper(async (req, res, next) => {
      res.sendStatus(200);
    }))
    .put(wrapper(async (req, res, next) => {
      res.sendStatus(200);
    }))
    .delete(wrapper(async (req, res, next) => {
      await pool.query(`SELECT * FROM delete_user('${req.params.id}')`);
      res.sendStatus(200);
    }))

  app.get('/api/user/get-posts/:id', wrapper(async (req, res, next) => {
    const targetID = req.params.id;
    const { user_id, offset, order, direction } = req.query;
    res.sendStatus(200);
  }))

  app.get('/api/user/get-interactions/:id', wrapper(async (req, res, next) => {
    const targetID = req.params.id;
    const { user_id, offset } = req.query;
    res.sendStatus(200);
  }))

  app.get('/api/user/get-friends/:id', wrapper(async (req, res, next) => {
    const targetID = req.params.id;
    const { user_id, offset } = req.query;
  }));
};
