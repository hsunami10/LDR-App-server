const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../assets/wrapper');
const NO_USER_MSG = require('../assets/constants').NO_USER_MSG;
const getPostsData = require('../assets/queries').getPostsData;
const isAuthenticated = require('../assets/authentication').isAuthenticated;

module.exports = (app, pool) => {
  app.get('/api/feed/:id', isAuthenticated, wrapper(async (req, res, next) => {
    // Get blocked user ids
    // Get all topics subscribed to
    // Get your posts - where author_id = user_id
    // Get friends' ids
    // Get partner's posts
    const client = await pool.connect();
    try {
      const { id } = req.params;
      // order - newest (default) - date_joined, popular - num_likes, nearest - coordinates
      // direction - newest (default) - DESC, popular - DESC, nearest - ASC (or something else)
      const { order, direction, last_id, last_data } = req.query;

      // Query filters - which ids to exclude / include
      // Union all - need to have the same number of columns
      const filterQuery = [
        `(SELECT user1_id, user2_id, 'partner' AS table FROM partners WHERE user1_id = '${id}' OR user2_id = '${id}')`,
        `(SELECT user1_id, user2_id, 'friends' AS table FROM friends WHERE user1_id = '${id}' OR user2_id = '${id}')`, // Get friends
        `(SELECT user1_id, user2_id, 'blocked' AS table FROM blocked WHERE user1_id = '${id}' OR user2_id = '${id}')`, // Get blocked users
        `(SELECT id, topic_id, 'topics' AS table FROM topic_subscribers WHERE subscriber_id = '${id}')` // Get topics the user is subscribed to
      ].join(' UNION '); // QUESTION: UNION ALL - does not remove duplicates, UNION - removes duplicates?

      const filterRes = await client.query(filterQuery);
      const filterRows = filterRes.rows;

      let partnerQuery = '(false)', friendArr = [], blockedArr = [], topicArr = [];
      for (let i = 0, len = filterRows.length; i < len; i++) {
        let row = filterRows[i];
        switch (row['table']) {
          case 'partner':
            let partnerID = '';
            if (row.user1_id === id) {
              partnerID = row.user2_id;
            } else {
              partnerID = row.user1_id;
            }
            partnerQuery = `(posts.author_id = '${partnerID}' AND posts.hidden = false)`;
            break;
          case 'friends': // Outermost OR - because if this is true, then you ALWAYS want to get the post - result expression = TRUE
            let friendID = '';
            if (row.user1_id === id) {
              friendID = row.user2_id;
            } else {
              friendID = row.user1_id;
            }
            friendArr.push(`posts.author_id = '${friendID}'`);
            break;
          case 'blocked': // Put blockQuery in the outer AND because the whole expression is false if that is false - false = blocked user
            let blockedUserID = '';
            if (row.user1_id === id) {
              blockedUserID = row.user2_id;
            } else {
              blockedUserID = row.user1_id;
            }
            blockedArr.push(`posts.author_id != '${blockedUserID}'`);
            break;
          case 'topics':
            let topicID = row.user2_id;
            topicArr.push(`posts.topic_id = '${topicID}'`);
            break;
          default:
            break;
        }
      }

      let blockQuery = `(${blockedArr.join(' AND ')})`; // One false, whole expression is false
      if (blockQuery === '()') blockQuery = '(true)'; // If no blocked users, default to true - continue evaluating - in AND

      let friendQuery = `(${friendArr.join(' OR ')})`;
      if (friendQuery === '()') friendQuery = '(false)'; // If no friends, default to false - because in OR

      let topicQuery = `(${topicArr.join(' OR ')})`;
      if (topicQuery === '()') topicQuery = '(false)'; // If no subscribed topics, default to false - because in OR

      const whereQuery = `posts.author_id = '${id}' OR (${blockQuery} AND (${partnerQuery} OR ${friendQuery} OR ${topicQuery}))`;

      const posts = await getPostsData(client, id, whereQuery, order, direction, last_id, last_data);
      res.status(200).send({ success: true, feed: posts });
    } finally {
      client.release();
    }
  }))
};
