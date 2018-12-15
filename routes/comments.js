const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../assets/wrapper');
const pageCommentsQuery = require('../assets/paginate').comments;
const getComments = require('../assets/queries').getComments;
const NO_POST_MSG = require('../assets/constants').NO_POST_MSG;

module.exports = (app, pool) => {
  app.route('/api/comments/:id')
    // Similar to fetching feed
    // Only call when paging
    .get(wrapper(async (req, res, next) => {
      const client = await pool.connect();
      try {
        const { offset, latest_date, post_id } = req.query;
        const user_id = req.params.id;
        const res2 = await client.query(`SELECT id FROM posts WHERE id = '${post_id}'`);
        if (res2.rows.length === 0) {
          res.status(200).send({ success: false, error: NO_POST_MSG });
        } else {
          const result = await getComments(
            client,
            user_id,
            offset,
            pageCommentsQuery(post_id, parseInt(offset), latest_date)
          );
          res.status(200).send({ success: true, comments: result });
        }
      } finally {
        client.release();
      }
    }))
    .post(wrapper(async (req, res, next) => {
      // TODO: Finish this later - add comments
      // TODO: See if post still exists - might not need to do this because foreign key violation will handle it
      const client = await pool.connect();
      try {
        const user_id = req.params.id;
        const { body, postID } = req.body;
        const comment_id = uuidv4();
        const date_sent = moment().unix();

        // NOTE: Similar to liking posts (adding likes) endpoint
        const cols = [comment_id, postID, user_id, date_sent, body];
        const cols2 = [uuidv4(), user_id, postID, date_sent];
        await Promise.all([
          client.query(`INSERT INTO comments VALUES ($1, $2, $3, $4, $5)`, cols),
          client.query(`INSERT INTO interactions (id, user_id, post_id, date_updated) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, post_id) DO UPDATE SET date_updated = ${date_sent}, count = interactions.count + 1 WHERE interactions.user_id = '${user_id}' AND interactions.post_id = '${postID}'`, cols2)
        ]);
        // TODO: Change format to match pageCommentsQuery query format
        // id, post_id, author_id, username, profile_pic, date_sent, body, num_likes
        res.status(200).send({
          id: comment_id,
          post_id: postID,
          author_id: user_id,
          date_sent,
          body,
          num_likes: 0
        });
      } finally {
        client.release();
      }
    }))
    .put(wrapper(async (req, res, next) => {
      // TODO: Check to see if comment still exists
      const client = await pool.connect();
      try {
        const user_id = req.params.id;
        const { type, comment } = req.body;
        if (type === 'num_likes') {
          const comment_likes = await client.query(`SELECT id FROM comment_likes WHERE user_id = '${user_id}' AND comment_id = '${comment.id}'`);
          if (comment_likes.rows.length === 0) { // This is always true if the comment is deleted
            const cols = [uuidv4(), user_id, comment.id];
            await client.query(`INSERT INTO comment_likes (id, user_id, comment_id) VALUES ($1, $2, $3)`, cols);
          } else {
            await client.query(`DELETE FROM comment_likes WHERE user_id = '${user_id}' AND comment_id = '${comment.id}'`);
          }
        } else {
          await client.query(`UPDATE comments SET body = '${comment.body}' WHERE id = '${comment.id}'`);
        }
        res.sendStatus(200);
      } finally {
        client.release();
      }
    }))
    .delete(wrapper(async (req, res, next) => {
      const client = await pool.connect();
      try {
        const comment_id = req.params.id;
        const { user_id, post_id } = req.query;

        const interactions = await client.query(`SELECT count FROM interactions WHERE user_id = '${user_id}' AND post_id = '${post_id}'`);
        // NOTE: Similar to editing post - removing likes
        if (interactions.rows.length === 0) {
          await client.query(`DELETE FROM comments WHERE id = '${comment_id}'`);
        } else if (interactions.rows[0].count > 1) {
          await Promise.all([
            client.query(`DELETE FROM comments WHERE id = '${comment_id}'`),
            client.query(`UPDATE interactions SET count = count - 1 WHERE post_id = '${post_id}' AND user_id = '${user_id}'`)
          ]);
        } else {
          await Promise.all([
            client.query(`DELETE FROM comments WHERE id = '${comment_id}'`),
            client.query(`DELETE FROM interactions WHERE post_id = '${post_id}' AND user_id = '${user_id}'`)
          ]);
        }
        res.sendStatus(200);
      } finally {
        client.release();
      }
    }))
}
