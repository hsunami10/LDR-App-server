const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../middleware/wrapper');
const getBlockedUserIDs = require('../assets/queries').getBlockedUserIDs;
const rowsToOrderAndObj = require('../assets/helpers').rowsToOrderAndObj;
const filterBlockedQuery = require('../assets/helpers').filterBlockedQuery;
const getPostsData = require('../assets/queries').getPostsData;
const getUsersData = require('../assets/queries').getUsersData;
const getTopicsData = require('../assets/queries').getTopicsData;
const NO_USER_MSG = require('../assets/constants').NO_USER_MSG;
const isAuthenticated = require('../assets/authentication').isAuthenticated;

module.exports = (app, pool) => {
  app.get('/api/discover/posts/:id', isAuthenticated, wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const blocked = await getBlockedUserIDs(client, id);
      const { order, direction, last_id, last_data } = req.query;
      const filterQuery = filterBlockedQuery('posts', blocked);
      const result = await getPostsData(client, id, filterQuery, order, direction, last_id, last_data);
      res.status(200).send({ success: true, result });
    } finally {
      client.release();
    }
  }))

  app.get('/api/discover/users/:id', isAuthenticated, wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const blocked = await getBlockedUserIDs(client, id);
      const { order, direction, last_id, last_data } = req.query;
      const filterQuery = filterBlockedQuery('users', blocked);
      const result = await getUsersData(client, id, filterQuery, order, direction, last_id, last_data);
      res.status(200).send({ success: true, result });
    } finally {
      client.release();
    }
  }))

  app.get('/api/discover/topics/:id', isAuthenticated, wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const { order, direction, last_id, last_data } = req.query;
      const result = await getTopicsData(client, id, '', order, direction, last_id, last_data);
      res.status(200).send({ success: true, result });
    } finally {
      client.release();
    }
  }))
};
