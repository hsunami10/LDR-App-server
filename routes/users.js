const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../middleware/wrapper');
const mailgun = require('../config/mail').mailgun;
const devEmail = require('../config/mail').devEmail;
const EmailSubjectEnum = require('../config/mail').EmailSubjectEnum;
const getFullSubject = require('../config/mail').getFullSubject;
const getSuccessMessage = require('../config/mail').getSuccessMessage;
const NO_USER_MSG = require('../assets/constants').NO_USER_MSG;
const filterBlockedQuery = require('../assets/helpers').filterBlockedQuery;
const getUserRequests = require('../assets/queries').getUserRequests;
const getPendingRequests = require('../assets/queries').getPendingRequests;
const getUserFriends = require('../assets/queries').getUserFriends;
const getPostsData = require('../assets/queries').getPostsData;
const getBlockedUserIDs = require('../assets/queries').getBlockedUserIDs;
const getUserInteractions = require('../assets/queries').getUserInteractions;

module.exports = (app, pool) => {
  app.route('/api/user/:id')
    // NOTE: Similar to assets.paginate.js - users, except no num_friends
    .get(wrapper(async (req, res, next) => {
      const client = await pool.connect();
      try {
        const { user_id, current_tab, order, direction, last_id, last_data } = req.query;
        const targetID = req.params.id;
        let user, blocked;
        [user, blocked] = await Promise.all([
          client.query(`SELECT id, username, profile_pic, bio, date_joined, active, user_type, (SELECT get_user_relation('${user_id}', users.id)) AS type FROM users WHERE id = '${targetID}' AND deleted = false`),
          getBlockedUserIDs(client, user_id)
        ]);
        if (user.rows.length === 0 || blocked.includes(targetID)) {
          res.status(200).send({ success: false, message: NO_USER_MSG });
        } else {
          let partner, posts, interactions, friends;
          // NOTE: Make sure this is the same as routes/partner.js put() /api/partner/accept, partner query - SAME AS GET_USER_PARTNER
          // If there's no row, it returns an object with all values = null
          const partnersQuery = `SELECT * FROM get_user_partner('${targetID}') AS (id text, username text, profile_pic text, date_together bigint, countdown bigint, type text)`;
          let filterPostsQuery = filterBlockedQuery('posts', blocked);
          const filterInteractionsQuery = filterPostsQuery;
          filterPostsQuery = `posts.author_id = '${targetID}' AND (${filterPostsQuery === '' ? 'true' : filterPostsQuery})`;
          const filterUsersQuery = filterBlockedQuery('users', blocked);

          // Handle loading data from 3 different tabs
          switch (current_tab) {
            case 'posts':
              [partner, posts] = await Promise.all([
                client.query(partnersQuery),
                getPostsData(client, user_id, filterPostsQuery, order, direction, last_id, last_data)
              ]);
              res.status(200).send({
                success: true,
                user: {
                  ...user.rows[0],
                  posts,
                  partner: partner.rows[0].id ? partner.rows[0] : null
                }
              });
              break;
            case 'interactions':
              [partner, interactions] = await Promise.all([
                client.query(partnersQuery),
                getUserInteractions(client, targetID, filterInteractionsQuery, last_id, last_data)
              ]);
              res.status(200).send({
                success: true,
                user: {
                  ...user.rows[0],
                  interactions,
                  partner: partner.rows[0].id ? partner.rows[0] : null
                }
              });
              break;
            case 'friends':
              [partner, friends] = await Promise.all([
                client.query(partnersQuery),
                getUserFriends(client, targetID, filterUsersQuery, order, direction, last_id, last_data)
              ]);
              res.status(200).send({
                success: true,
                user: {
                  ...user.rows[0],
                  friends,
                  partner: partner.rows[0].id ? partner.rows[0] : null
                }
              });
              break;
            default:
              break;
          }
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
      await pool.query(`SELECT delete_user('${req.params.id}')`);
    }))

  app.get('/api/user/get-posts/:id', wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      const targetID = req.params.id;
      const { user_id, order, direction, last_id, last_data } = req.query;
      const blocked = await getBlockedUserIDs(client, user_id);
      let filterQuery = filterBlockedQuery('posts', blocked);
      filterQuery = `posts.author_id = '${targetID}' AND (${filterQuery === '' ? 'true' : filterQuery})`;
      const posts = await getPostsData(client, user_id, filterQuery, order, direction, last_id, last_data);
      res.status(200).send({ success: true, posts });
    } finally {
      client.release();
    }
  }))

  app.get('/api/user/get-interactions/:id', wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      const targetID = req.params.id;
      const { user_id, last_id, last_date } = req.query;
      const blocked = await getBlockedUserIDs(client, user_id);
      const filterQuery = filterBlockedQuery('posts', blocked);
      const interactions = await getUserInteractions(client, targetID, filterQuery, last_id, last_date);
      res.status(200).send({ success: true, interactions });
    } finally {
      client.release();
    }
  }))

  app.get('/api/user/get-friends/:id', wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      const targetID = req.params.id;
      const { user_id, order, direction, last_id, last_data } = req.query;
      const blocked = await getBlockedUserIDs(client, user_id);
      const filterQuery = filterBlockedQuery('users', blocked);
      const friends = await getUserFriends(client, targetID, filterQuery, order, direction, last_id, last_data);
      res.status(200).send({ success: true, friends });
    } finally {
      client.release();
    }
  }));
};
