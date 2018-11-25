const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../helpers/wrapper');
const pageFeedQuery = require('../helpers/paginate').feed;

module.exports = (app, pool) => {
  app.get('/api/feed/:id', wrapper(async (req, res, next) => {
    // Get blocked user ids

    // Get all topics subscribed to

    // Get your posts - where author_id = user_id

    // Get friends' ids
    const client = await pool.connect();
    try {
      const { id } = req.params;
      // order - newest (default) - date_joined, popular - num_likes, nearest - coordinates
      // direction - newest (default) - DESC, popular - DESC, nearest - ASC (or something else)
      const { offset, order, direction, latest_date } = req.query;

      // Query filters - which ids to exclude / include
      // Union all - need to have the same number of columns
      const filterQuery = [
        `(SELECT user1_id, user2_id, 'partners' FROM partners WHERE user1_id = '${id}' OR user2_id = '${id}')`, // Get partner
        `(SELECT user1_id, user2_id, 'friends' FROM friends WHERE user1_id = '${id}' OR user2_id = '${id}')`, // Get friends
        `(SELECT user1_id, user2_id, 'blocked' FROM blocked WHERE user1_id = '${id}' OR user2_id = '${id}')`, // Get blocked users
        `(SELECT id, topic_id, 'topics' FROM topic_subscribers WHERE subscriber_id = '${id}')` // Get topics the user is subscribed to
      ].join(' UNION ALL ');

      const res2 = await client.query(filterQuery);
      const filterRows = res2.rows;
      console.log(filterRows);

      let partnerQuery = '(false)', friendArr = [], blockedArr = [], topicArr = [];
      for (let i = 0, len = filterRows.length; i < len; i++) {
        let row = filterRows[i];
        switch (row['?column?']) {
          case 'partners': // Outermost OR - because if this is true, then you ALWAYS want to get the post - result expression = TRUE
            let partnerID = ''
            if (row.user1_id === id) {
              partnerID = row.user2_id;
            } else {
              partnerID = row.user1_id;
            }
            partnerQuery = `(posts.author_id = '${partnerID}')`;
            break;
          case 'friends': // Outermost OR - because if this is true, then you ALWAYS want to get the post - result expression = TRUE
            let friendID = ''
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

      let whereQuery = `posts.author_id = '${id}' OR (${blockQuery} AND (${partnerQuery} OR ${friendQuery} OR ${topicQuery}))`;
      let feedQuery = pageFeedQuery(whereQuery, order, direction, parseInt(offset), latest_date);

      console.log('page feed');
      console.log(feedQuery);
      const posts = await client.query(feedQuery);

      // Only get likes for the posts retrieved, not likes from all time
      const length = posts.rows.length;
      const filter = new Array(length), postsOrder = new Array(length), postsObj = {};
      for (let i = 0; i < length; i++) {
        filter[i] = `post_id = '${posts.rows[i].id}'`;
        postsOrder[i] = posts.rows[i].id;
        postsObj[posts.rows[i].id] = posts.rows[i];
      }

      if (filter.length === 0) {
        res.status(200).send({
          post_likes: {},
          posts: postsObj,
          order: postsOrder
        })
      } else {
        let post_likes = await client.query(`SELECT post_id FROM post_likes WHERE user_id = '${id}' AND (${filter.join(' OR ')})`);
        // Convert to object that maps post_id to likes
        post_likes = post_likes.rows.reduce((acc, post_like) => {
          acc[post_like.post_id] = true;
          return acc;
        }, {});

        res.status(200).send({
          post_likes,
          posts: postsObj,
          order: postsOrder
        });
      }
    } finally {
      client.release();
    }
  }))
};
