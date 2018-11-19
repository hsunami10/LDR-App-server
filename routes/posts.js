const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../helpers/wrapper');

module.exports = (app, pool) => {
  app.route('/api/posts/:id')
    .get(wrapper(async (req, res, next) => {
      // TODO: Get post + comments - for view post screen
      // TODO: Paginate with query params - for paginating comments
      // req.params.id - post id
      // NOTE: Paginate comments
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
        num_likes: 0
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

          // If the user hasn't liked the post yet, increment num_likes and insert into post_likes table
          if (post_likes.rows.length === 0) {
            const cols = [uuidv4(), user_id, post.id];
            await Promise.all([
              client.query(`UPDATE posts SET num_likes = num_likes + 1 WHERE id = '${post.id}'`),
              client.query(`INSERT INTO post_likes (id, user_id, post_id) VALUES ($1, $2, $3)`, cols)
            ])
          } else { // Otherwise decremen num_likes and insert into post_likes table
            await Promise.all([
              client.query(`UPDATE posts SET num_likes = num_likes - 1 WHERE id = '${post.id}'`),
              client.query(`DELETE FROM post_likes WHERE post_id = '${post.id}' AND user_id = '${user_id}'`)
            ])
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
};
