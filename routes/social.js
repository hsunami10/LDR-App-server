const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../assets/wrapper');
const getUserRequests = require('../assets/queries').getUserRequests;
const getPendingRequests = require('../assets/queries').getPendingRequests;
const getUserFriends = require('../assets/queries').getUserFriends;
const userExists = require('../assets/queries').userExists;
const removeFriendRequestQuery = require('../assets/queries').removeFriendRequestQuery;
const NO_USER_MSG = require('../assets/constants').NO_USER_MSG;
const REQUEST_CANCELLED_MSG = require('../assets/constants').REQUEST_CANCELLED_MSG;

module.exports = (app, pool) => {
  app.get('/api/social/:id', wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      const user = await userExists(client, req.params.id);
      if (!user) {
        res.status(200).send({ success: false, error: NO_USER_MSG });
      } else {
        const { last_id, last_data } = req.query;
        let requests, pending, friends;
        [requests, pending, friends] = await Promise.all([
          getUserRequests(client, req.params.id),
          getPendingRequests(client, req.params.id),
          getUserFriends(client, req.params.id, '', 'date_friended', 'DESC', last_id, last_data)
        ]);
        const all_users = {
          ...requests.data,
          ...pending.data,
          ...friends.friends
        }
        delete requests['data'];
        delete pending['data'];
        delete friends['friends'];
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

  app.get('/api/social/get-friends/:id', wrapper(async (req, res, next) => {
    const { order, direction, last_id, last_data } = req.query;
    const friends = await getUserFriends(pool, req.params.id, order, direction, last_id, last_data);
    res.status(200).send(friends);
  }))

  app.post('/api/social/send-friend-request/:id', wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      const senderID = req.params.id;
      const { targetID } = req.body;
      const user = userExists(client, targetID);
      if (!user) {
        res.status(200).send({ success: false, error: NO_USER_MSG });
      } else {
        const dateSent = moment().unix();
        const cols = [uuidv4(), senderID, targetID, dateSent];
        await client.query(`INSERT INTO friend_requests (id, sender_id, receiver_id, date_sent) VALUES ($1, $2, $3, $4) ON CONFLICT (sender_id, receiver_id) DO UPDATE SET date_sent = $4`, cols);
        res.status(200).send({ success: true });
      }
    } finally {
      client.release();
    }
  }))

  app.post('/api/social/accept-friend-request/:id', wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const { targetID } = req.body;
      let user, cancelled;
      [user, cancelled] = await Promise.all([
        userExists(client, targetID),
        client.query(`SELECT id FROM friend_requests WHERE sender_id = '${targetID}' AND receiver_id = '${id}'`)
      ]);
      // Don't need to check if the same user sent a friend request, because that should not happen
      if (!user) {
        res.status(200).send({ success: false, error: NO_USER_MSG });
      } else if (cancelled.rows.length === 0) { // Request already cancelled before accepted
        res.status(200).send({ success: false, error: REQUEST_CANCELLED_MSG });
      } else {
        // Remove from friend_requests
        // Add to friends
        await Promise.all([
          client.query(removeFriendRequestQuery(targetID, id)),
          client.query(`INSERT INTO friends VALUES ('${uuidv4()}', '${id}', '${targetID}', ${moment().unix()})`)
        ]);
        res.status(200).send({ success: true });
      }
    } finally {
      client.release();
    }
  }))

  app.delete('/api/social/reject-friend-request/:id', wrapper(async (req, res, next) => {
    await pool.query(removeFriendRequestQuery(req.query.target_id, req.params.id));
    res.sendStatus(200);
  }))

  app.delete('/api/social/cancel-pending/:id', wrapper(async (req, res, next) => {
    const { id } = req.params;
    const { target_id } = req.query;
    await pool.query(`DELETE FROM friend_requests WHERE sender_id = '${id}' AND receiver_id = '${target_id}'`);
    res.sendStatus(200);
  }))

  app.delete('/api/social/unfriend/:id', wrapper(async (req, res, next) => {
    const { id } = req.params;
    const { target_id } = req.query;
    await pool.query(`DELETE FROM friends WHERE (user1_id = '${id}' AND user2_id = '${target_id}') OR (user1_id = '${target_id}' AND user2_id = '${id}')`);
    res.sendStatus(200);
  }))
};
