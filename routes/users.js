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
const getPostsData = require('../assets/queries').getPostsData;
const getBlockedUserIDs = require('../assets/queries').getBlockedUserIDs;
const userExists = require('../assets/queries').userExists;
const getUserInteractions = require('../assets/queries').getUserInteractions;

module.exports = (app, pool) => {
  // QUESTION: How to handle refreshing? Which tab to grab data for?
  app.route('/api/user/:id')
    // NOTE: Similar to assets.paginate.js - users, except no num_friends
    .get(wrapper(async (req, res, next) => {
      const client = await pool.connect();
      try {
        const { type, user_id } = req.query;
        const targetID = req.params.id;
        let user, blocked;
        [user, blocked] = await Promise.all([
          client.query(`SELECT id, username, profile_pic, bio, date_joined, active, user_type, (SELECT get_user_relation('${user_id}', users.id)) AS type FROM users WHERE id = '${targetID}' AND deleted = false`),
          getBlockedUserIDs(client, user_id)
        ]);
        if (!user) {
          res.status(200).send({ success: false, error: NO_USER_MSG });
        } else {
          let partnerData, postsData;
          let filterQuery = blocked.map(id => {
            return `posts.author_id != '${id}'`;
          }).join(' AND ');
          filterQuery = `posts.author_id = '${targetID}' AND (${filterQuery === '' ? 'true' : filterQuery})`;

          if (type === 'private' || type === 'public') {
            // NOTE: Make sure this is the same as routes/partner.js put() /api/partner/accept, partner query - SAME AS GET_USER_PARTNER
            // If there's no row, it returns an object with all values = null
            const partnersQuery = `SELECT * FROM get_user_partner('${targetID}') AS (id text, username text, profile_pic text, date_together bigint, countdown bigint, type text)`;

            // Get friends and subscribers when the tabs (in view profile screen) are visited
            [partnerData, postsData] = await Promise.all([
              client.query(partnersQuery),
              getPostsData(client, user_id, filterQuery, 'date_posted', 'DESC', '', '')
            ]);
          } else {
            throw new Error('get: /api/user, type has to be either "private", "public"');
          }

          res.status(200).send({
            success: true,
            user: {
              ...user.rows[0],
              posts: {
                ...postsData,
                data: postsData.data
              },
              initial_loading: false,
              refreshing: false,
              partner: partnerData.rows.length === 0 ? null : partnerData.rows[0]
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
      await pool.query(`SELECT delete_user('${req.params.id}')`);
      res.sendStatus(200);
    }))

  app.get('/api/user/get-posts/:id', wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      const targetID = req.params.id;
      const { user_id, order, direction, last_id, last_data } = req.query;
      let user, blocked;
      [user, blocked] = await Promise.all([
        userExists(client, targetID),
        getBlockedUserIDs(client, user_id)
      ]);
      if (!user) {
        res.status(200).send({ success: false, error: NO_USER_MSG });
      } else {
        let filterQuery = blocked.map(id => {
          return `posts.author_id != '${id}'`;
        }).join(' AND ');
        filterQuery = `posts.author_id = '${targetID}' AND (${filterQuery === '' ? 'true' : filterQuery})`;

        const posts = await getPostsData(client, user_id, filterQuery, order, direction, last_id, last_data);
        res.status(200).send(posts);
      }
    } finally {
      client.release();
    }
  }))

  app.get('/api/user/get-interactions/:id', wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      const targetID = req.params.id;
      const { user_id, last_id, last_date } = req.query;
      let user, blocked;
      [user, blocked] = await Promise.all([
        userExists(client, targetID),
        getBlockedUserIDs(client, user_id)
      ]);
      if (!user) {
        res.status(200).send({ success: false, error: NO_USER_MSG });
      } else {
        const filterQuery = blocked.map(id => {
          return `posts.author_id != '${id}'`;
        }).join(' AND ');

        const interactions = await getUserInteractions(client, targetID, filterQuery, last_id, last_date);
        res.status(200).send(interactions);
      }
    } finally {
      client.release();
    }
  }))

  app.get('/api/user/get-friends/:id', wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      const targetID = req.params.id;
      const { user_id, order, direction, last_id, last_data } = req.query;
      let user, blocked;
      [user, blocked] = await Promise.all([
        userExists(client, targetID),
        getBlockedUserIDs(client, user_id)
      ]);
      if (!user) {
        res.status(200).send({ success: false, error: NO_USER_MSG });
      } else {
        const filterQuery = blocked.map(id => {
          return `users.id != '${id}'`;
        }).join(' AND ');

        const friends = await getUserFriends(client, targetID, filterQuery, order, direction, last_id, last_data);
        res.status(200).send(friends);
      }
    } finally {
      client.release();
    }
  }));
};
