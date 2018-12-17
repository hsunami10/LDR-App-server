const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../assets/wrapper');
const userExists = require('../assets/queries').userExists;
const getBlockedUserIDs = require('../assets/queries').getBlockedUserIDs;
const pagePostsQuery = require('../assets/paginate').posts;
const rowsToOrderAndObj = require('../assets/helpers').rowsToOrderAndObj;
const getPostsData = require('../assets/queries').getPostsData;
const getUsersData = require('../assets/queries').getUsersData;
const NO_USER_MSG = require('../assets/constants').NO_USER_MSG;

module.exports = (app, pool) => {
  app.get('/api/discover/posts/:id', wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      let user, blocked;
      const { id } = req.params;
      [user, blocked] = await Promise.all([
        userExists(client, id),
        getBlockedUserIDs(client, id)
      ]);
      if (!user) {
        res.status(200).send({ success: false, error: NO_USER_MSG });
      } else {
        const { offset, order, direction, latest } = req.query;
        const filterQuery = blocked.map(id => {
          return `posts.author_id != '${id}'`;
        }).join(' AND ');

        const result = await getPostsData(client, id, filterQuery, order, direction, offset, latest);
        res.status(200).send({ success: true, result });
      }
    } finally {
      client.release();
    }
  }))

  app.get('/api/discover/users/:id', wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      let user, blocked;
      const { id } = req.params;
      [user, blocked] = await Promise.all([
        userExists(client, id),
        getBlockedUserIDs(client, id)
      ]);
      if (!user) {
        res.status(200).send({ success: false, error: NO_USER_MSG });
      } else {
        const { offset, order, direction, latest } = req.query;
        const filterQuery = blocked.map(id => {
          return `users.id != '${id}'`;
        }).join(' AND ');

        const result = await getUsersData(client, id, filterQuery, order, direction, offset, latest);
        res.status(200).send({ success: true, result });
      }
    } finally {
      client.release();
    }
  }))

  app.get('/api/discover/topics/:id', wrapper(async (req, res, next) => {
    res.sendStatus(200);
  }))
};
