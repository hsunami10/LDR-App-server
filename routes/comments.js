const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../helpers/wrapper');
const pageCommentsQuery = require('../helpers/paginate').comments;
const fetchComments = require('../helpers/queries').fetchComments;

module.exports = (app, pool) => {
  app.route('/api/comments/:id')
    // Similar to fetching feed
    // Only call when paging - view previous comments and initial retrieval
    .get(wrapper(async (req, res, next) => {
      const client = await pool.connect();
      try {
        const { offset, latest_date, post_id } = req.query;
        const user_id = req.params.id;
        const result = await fetchComments(
          client,
          user_id,
          offset,
          pageCommentsQuery(post_id, parseInt(offset), latest_date)
        );
        res.status(200).send(result);
      } finally {
        client.release();
      }
    }))
    .post(wrapper(async (req, res, next) => {
      // TODO: Finish this later - add comments
      const user_id = req.params.id;
      const { body, postID } = req.body;
      const comment_id = uuidv4();
      const date_sent = moment().unix();
      const cols = [comment_id, postID, user_id, date_sent, body];
      await pool.query(`INSERT INTO comments VALUES ($1, $2, $3, $4, $5)`, cols);
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
    }))
    .put(wrapper(async (req, res, next) => {
      // TODO: Finish this later - edit commments - liking and changing body
      res.sendStatus(200);
    }))
    .delete(wrapper(async (req, res, next) => {
      const comment_id = req.params.id;
      await pool.query(`DELETE FROM comments WHERE id = '${comment_id}'`);
      res.sendStatus(200);
    }))
}
