const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../assets/wrapper');
const pageCommentsQuery = require('../assets/paginate').comments;
const fetchComments = require('../assets/queries').fetchComments;
const NO_POST_MSG = require('../assets/constants').NO_POST_MSG;

// get post put delete single posts
module.exports = (app, pool) => {
  app.route('/api/posts/:id')
    .get(wrapper(async (req, res, next) => {
      const client = await pool.connect();
      try {
        const { earliest_date, post_id } = req.query;
        const user_id = req.params.id;
        const res2 = await client.query(`SELECT id FROM posts WHERE id = '${post_id}'`);
        if (res2.rows.length === 0) {
          res.status(200).send({ success: false, error: NO_POST_MSG });
        } else {
          // Get post
          // NOTE: Match format of helpers/paginate.posts & helpers/paginate.feed query
          const postsQuery = `SELECT posts.id, posts.topic_id, topics.name, posts.author_id, users.username, users.profile_pic, posts.date_posted, posts.body, posts.coordinates, (SELECT COUNT(*) FROM post_likes WHERE post_likes.post_id = posts.id) AS num_likes, (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) as num_comments FROM posts INNER JOIN users ON users.id = posts.author_id INNER JOIN topics ON posts.topic_id = topics.id WHERE posts.id = '${post_id}'`;
          const postRes = await client.query(postsQuery);

          // Get comments
          // NOTE: Match format of helpers/paginate.comments query
          let commentsQuery = '';
          if (parseInt(earliest_date, 10) === 0) { // True only if no comments when refreshing
            commentsQuery = pageCommentsQuery(post_id, 0, moment().unix());
          } else {
            commentsQuery = `SELECT comments.id, comments.post_id, comments.author_id, users.username, users.profile_pic, comments.date_sent, comments.body, (SELECT COUNT(*) FROM comment_likes WHERE comment_likes.comment_id = comments.id) AS num_likes, ROW_NUMBER () OVER (ORDER BY comments.date_sent DESC) AS RowNum FROM comments INNER JOIN users ON users.id = comments.author_id WHERE comments.date_sent >= ${earliest_date} AND comments.post_id = '${post_id}'`;
          }
          const comments = await fetchComments(client, user_id, 0, commentsQuery);

          res.status(200).send({
            success: true,
            result: {
              post: postRes.rows[0],
              comments
            }
          });
        }
      } finally {
        client.release();
      }
    }))
    .post(wrapper(async (req, res, next) => {
      const { topic_id, body, coordinates } = req.body;
      const post_id = uuidv4();
      const date = moment().unix();
      const cols = [post_id, topic_id, req.params.id, date, body, coordinates]
      const res2 = await pool.query(`INSERT INTO posts (id, topic_id, author_id, date_posted, body, coordinates) VALUES ($1, $2, $3, $4, $5, $6)`, cols);

      // NOTE: Keep same format as paginate.js posts query, except rowNum
      // id, topic_id, author_id, date_posted, body, coordinates, num_likes
      res.status(200).send({
        id: post_id,
        topic_id,
        author_id: req.params.id,
        date_posted: date,
        body,
        coordinates,
        num_likes: 0,
        num_comments: 0
      });
    }))
    .put(wrapper(async (req, res, next) => {
      const client = await pool.connect();
      try {
        // req.params.id - user id
        // req.body = { type: 'num_likes' / 'body', post }
        const { type, post } = req.body;
        const user_id = req.params.id;

        // If liking / disliking post
        if (type === 'num_likes') {
          let post_likes, interactions;
          [post_likes, interactions] = await Promise.all([
            client.query(`SELECT id FROM post_likes WHERE user_id = '${user_id}' AND post_id = '${post.id}'`),
            client.query(`SELECT count FROM interactions WHERE user_id = '${user_id}' AND post_id = '${post.id}'`)
          ]);
          if (post_likes.rows.length === 0) { // If haven't liked before, then like the post
            // NOTE: Similar to adding comments endpoint
            const cols = [uuidv4(), user_id, post.id];
            const date = moment().unix();
            const cols2 = [uuidv4(), user_id, post.id, date];
            await Promise.all([
              client.query(`INSERT INTO post_likes (id, user_id, post_id) VALUES ($1, $2, $3)`, cols), // Mark post as liked
              client.query(`INSERT INTO interactions (id, user_id, post_id, date_updated) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, post_id) DO UPDATE SET date_updated = ${date}, count = interactions.count + 1 WHERE interactions.user_id = '${user_id}' AND interactions.post_id = '${post.id}'`, cols2) // Add as interaction
            ]);
          } else { // NOTE: Similar to deleting comments
            if (interactions.rows.length === 0) {
              await client.query(`DELETE FROM post_likes WHERE post_id = '${post.id}' AND user_id = '${user_id}'`);
            } else if (interactions.rows[0].count > 1) { // If not last interaction, then decrement counts
              await Promise.all([
                client.query(`DELETE FROM post_likes WHERE post_id = '${post.id}' AND user_id = '${user_id}'`),
                client.query(`UPDATE interactions SET count = count - 1 WHERE post_id = '${post.id}' AND user_id = '${user_id}'`)
              ]);
            } else { // If last interaction, then remove from interactions
              await Promise.all([
                client.query(`DELETE FROM post_likes WHERE post_id = '${post.id}' AND user_id = '${user_id}'`),
                client.query(`DELETE FROM interactions WHERE post_id = '${post.id}' AND user_id = '${user_id}'`)
              ]);
            }
          }
        } else { // type === 'body'
          await client.query(`UPDATE posts SET body = '${post.body}', topic_id = '${post.topic_id}' WHERE id = '${post.id}'`);
        }
        res.sendStatus(200);
      } finally {
        client.release();
      }
    }))
    .delete(wrapper(async (req, res, next) => {
      const post_id = req.params.id;
      await pool.query(`DELETE FROM posts WHERE id = '${post_id}'`);
      res.sendStatus(200);
    }))
};
