const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../helpers/wrapper');
const paginateComments = require('../helpers/paginate').comments;

module.exports = (app, pool) => {
  app.route('/api/posts/:id')
    // Only call when refreshing
    .get(wrapper(async (req, res, next) => {
      const { offset, latestDate, post_id } = req.query;
      const user_id = req.params.id;
      let query = '';
      // TODO: Finish getting post and comments later
      // NOTE: Make sure post and comment JSON format are the same
      // Get the comments.date_sent > latestDate, until the end (no limit)
      // NOTE: When a post is changed (num_likes, edited, body), you want to find every instance of that post and change it
    }))
    .post(wrapper(async (req, res, next) => {
      const { topic_id, alias_id, body, coordinates } = req.body;
      const post_id = uuidv4();
      const date = moment().unix();
      const cols = [post_id, topic_id, req.params.id, alias_id, date, body, coordinates]
      const res2 = await pool.query(`INSERT INTO posts (id, topic_id, author_id, alias_id, date_posted, body, coordinates) VALUES ($1, $2, $3, $4, $5, $6, $7)`, cols);

      // NOTE: Keep same format as paginate.js posts query, except rowNum
      // id, topic_id, author_id, alias_id, date_posted, body, coordinates, num_likes
      res.status(200).send({
        id: post_id,
        topic_id,
        author_id: req.params.id,
        alias_id,
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

        if (type === 'num_likes') {
          const post_likes = await client.query(`SELECT id FROM post_likes WHERE user_id = '${user_id}' AND post_id = '${post.id}'`);
          if (post_likes.rows.length === 0) {
            const cols = [uuidv4(), user_id, post.id];
            await client.query(`INSERT INTO post_likes (id, user_id, post_id) VALUES ($1, $2, $3)`, cols);
          } else {
            await client.query(`DELETE FROM post_likes WHERE post_id = '${post.id}' AND user_id = '${user_id}'`);
          }
          res.sendStatus(200);
        } else { // type === 'body'
          await pool.query(`UPDATE posts SET alias_id = '${post.alias_id}', body = '${post.body}', topic_id = '${post.topic_id}' WHERE id = '${post.id}'`);
          res.sendStatus(200);
        }
      } finally {
        client.release();
      }
    }))
    .delete(wrapper(async (req, res, next) => {
      const post_id = req.params.id;
      await pool.query(`DELETE FROM posts WHERE id = '${post_id}'`);
      res.sendStatus(200);
    }))

  // Similar to fetching feed
  // Only call when paging - view previous comments and initial retrieval
  app.get('/api/posts/comments/:id', wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      const { offset, latest_date, post_id } = req.query;
      const user_id = req.params.id;
      const comments = await client.query(paginateComments(post_id, parseInt(offset), latest_date));
      const length = comments.rows.length;

      let order = new Array(length), commentsObj = {};
      for (let i = 0; i < length; i++) {
        commentsObj[comments.rows[i].id] = comments.rows[i];
        order[length - i - 1] = comments.rows[i].id; // Want latest element to be at bottom of screen, not top
      }

      if (order.length === 0) {
        res.status(200).send({
          comment_likes: {},
          comments: commentsObj,
          order,
          offset: parseInt(offset, 10) + order.length
        });
      } else {
        let comment_likes = await client.query(`SELECT comment_id FROM comment_likes WHERE user_id = '${user_id}'`);
        // Convert to object that maps post_id to likes
        comment_likes = comment_likes.rows.reduce((acc, comment_like) => {
          acc[comment_like.comment_id] = true;
          return acc;
        }, {});

        res.status(200).send({
          comment_likes,
          comments: commentsObj,
          order,
          offset: parseInt(offset, 10) + order.length
        });
      }
    } finally {
      client.release();
    }
  }));

  // Create comments
  app.post('/api/posts/comments/:id', wrapper(async (req, res, next) => {
    const user_id = req.params.id;
    const { body, postID } = req.body;
    const comment_id = uuidv4();
    const date_sent = moment().unix();
    const cols = [comment_id, postID, user_id, date_sent, body];
    await pool.query(`INSERT INTO comments VALUES ($1, $2, $3, $4, $5)`, cols);
    // TODO: Change format to match paginateComments query format
    // id, post_id, author_id, username, profile_pic, date_sent, body, num_likes
    res.status(200).send({
      id: comment_id,
      post_id: postID,
      author_id: user_id,
      date_sent,
      body
    });
  }));
};
