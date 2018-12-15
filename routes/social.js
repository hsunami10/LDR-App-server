const wrapper = require('../assets/wrapper');
const getUserRequests = require('../assets/queries').getUserRequests;
const getPendingRequests = require('../assets/queries').getPendingRequests;
const getUserFriends = require('../assets/queries').getUserFriends;
const userExists = require('../assets/queries').userExists;
const NO_USER_MSG = require('../assets/constants').NO_USER_MSG;

module.exports = (app, pool) => {
  app.get('/api/social/:id', wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      const res2 = await userExists(client, req.params.id);
      if (res2.length === 0) {
        res.status(200).send({
          success: false,
          error: NO_USER_MSG
        });
      } else {
        const { offset } = req.query;
        let requests, pending, friends;
        [requests, pending, friends] = await Promise.all([
          getUserRequests(client, req.params.id),
          getPendingRequests(client, req.params.id),
          getUserFriends(client, req.params.id, parseInt(offset, 10))
        ]);
        const all_users = {
          ...requests.data,
          ...pending.data,
          ...friends.data
        }
        delete requests['data'];
        delete pending['data'];
        delete friends['data'];
        res.status(200).send({
          success: true,
          social: {
            requests,
            pending,
            friends,
            all_users
          }
        });
      }
    } finally {
      client.release();
    }
  }))
};
