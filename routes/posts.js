const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../helpers/wrapper');

module.exports = (app, pool) => {
  app.route('/api/posts/:id')
    .get(wrapper(async (req, res, next) => {
      // TODO: Get post + comments - for view post screen
      // TODO: Paginate with query params - for paginating comments
      // req.params.id - user (or post?) id
      // NOTE: Sort posts by: 'newest', 'popular', 'nearest'
      /*
      example query
      SELECT  *
      FROM    ( SELECT    id, username, date_joined, ROW_NUMBER() OVER ( ORDER BY date_joined ) AS RowNum
                FROM      users
                WHERE     date_joined >= 0
                AND id != ''
              ) AS RowConstrainedResult
      WHERE   RowNum >= 1
          AND RowNum <= 20
      ORDER BY RowNum
       */
    }))
    .post(wrapper(async (req, res, next) => {
      // TODO: Create post
      // req.params.id - user id
      // req.body - topic_id (can be no topic - ''), alias_id (can be no alias - ''), body, coordinates (can be null)
      const { topic_id, alias_id, body, coordinates } = req.body;
      const post_id = uuidv4();
      const date = moment().unix();
      const cols = [post_id, topic_id, req.params.id, alias_id, date, body, coordinates]
      const res2 = await pool.query(`INSERT INTO posts (id, topic_id, author_id, alias_id, date_posted, body, coordinates) VALUES ($1, $2, $3, $4, $5, $6, $7)`, cols);
      res.status(200).send({
        success: true,
        post: {
          id: post_id,
          // TODO: Figure out the structure of inner joining on post foreign keys here
        }
      })
    }))
    .put(wrapper(async (req, res, next) => {
      // TODO: Edit post
      // req.params.id - user (or post?) id
    }))
    .delete(wrapper(async (req, res, next) => {
      // TODO: Delete post
      // req.params.id - user (or post?) id
    }))
};
