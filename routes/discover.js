const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../assets/wrapper');
const userExists = require('../assets/queries').userExists;
const getBlockedUserIDs = require('../assets/queries').getBlockedUserIDs;
const pagePostsQuery = require('../assets/paginate').posts;
const queryDataToOrderAndObj = require('../assets/helpers').queryDataToOrderAndObj;
const getPostsData = require('../assets/queries').getPostsData;
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

        const posts = await getPostsData(client, id, filterQuery, order, direction, offset, latest);
        res.status(200).send({ success: true, posts });
      }
    } finally {
      client.release();
    }
  }))

  app.get('/api/discover/users/:id', wrapper(async (req, res, next) => {
    res.sendStatus(200);
  }))

  app.get('/api/discover/topics/:id', wrapper(async (req, res, next) => {
    res.sendStatus(200);
  }))
};
