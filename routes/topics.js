const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../assets/wrapper');
const upload = require('../config/multer');
const rowsToOrderAndObj = require('../assets/helpers').rowsToOrderAndObj;
const NO_USER_MSG = require('../assets/constants').NO_USER_MSG;
const ensureAuthenticated = require('../assets/authentication').ensureAuthenticated;

module.exports = (app, pool) => {
  app.route('/api/topics/:id')
    .get(wrapper(async (req, res, next) => {
      // TODO: Get specified topic's posts
      // TODO: Paginate with query params
      // req.params.id - topic id
    }))
    .put(wrapper (async (req, res, next) => {
      // TODO: Update specified topic
      // req.params.id - topic id
      /*
      req.body = user_id (to check if admin of topic),
       */
    }))
    .delete(wrapper(async (req, res, next) => {
      // TODO: Delete topic
      // req.params.id - topic id
    }))

  // NOTE: Similar format to assets/paginate - topics
  app.get('/api/topics/subscribed/:id', ensureAuthenticated, wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const { order, direction } = req.query;
      const topics = await pool.query(`SELECT topics.id, topics.name, topics.lowercase_name, topics.topic_pic, 'already_subscribed' AS type, (SELECT COUNT(*) FROM topic_subscribers WHERE topics.id = topic_subscribers.topic_id) AS num_subscribers FROM topics INNER JOIN topic_subscribers ON topics.id = topic_subscribers.topic_id WHERE topic_subscribers.subscriber_id = '${id}' ORDER BY ${order} ${direction}`);
      const result = rowsToOrderAndObj(topics.rows, 'id');
      res.status(200).send({ success: true, result });
    } finally {
      client.release();
    }
  }));

  app.post('/api/topics/create/:id', ensureAuthenticated, upload.single('clientImage'), wrapper(async (req, res, next) => {
    const client = await pool.connect();
    const date = moment().unix();
    const { name, description, topic_id } = req.body;
    try {
      const res2 = await client.query(`SELECT id FROM topics WHERE lowercase_name = '${name.toLowerCase()}'`);
      if (res2.rows.length === 0) {
        let path = '';
        if (req.file) {
          path = req.file.path.substring(7); // Get rid of "public/"
        } else {
          path = null;
        }
        const topic_id = uuidv4();
        const sub_id = uuidv4();
        const topic_cols = [topic_id, name, name.toLowerCase(), path, description, date]
        const topic_sub_cols = [sub_id, req.params.id, topic_id, date, 'admin']
        const res3 = await client.query(`INSERT INTO topics VALUES ($1, $2, $3, $4, $5, $6)`, topic_cols);
        const res4 = await client.query(`INSERT INTO topic_subscribers (id, subscriber_id, topic_id, date_subscribed, subscriber_type) VALUES ($1, $2, $3, $4, $5)`, topic_sub_cols);
        res.status(200).send({
          success: true,
          topic: {
            id: topic_id,
            name,
            lowercase_name: name.toLowerCase(),
            topic_pic: path,
            description,
            date_created: date,
            num_subscribers: 1,
            type: 'already_subscribed'
          }
        });
      } else {
        res.status(200).send({ success: false, error: 'Topic name already taken' });
      }
    } finally {
      client.release();
    }
  }))

  app.post('/api/topics/subscribe/:id', ensureAuthenticated, wrapper(async (req, res, next) => {
    const { id } = req.params;
    const { topic_id } = req.body;
    const cols = [uuidv4(), id, topic_id, false, moment().unix(), 'standard'];
    await pool.query(`INSERT INTO topic_subscribers VALUES ($1, $2, $3, $4, $5, $6)`, cols);
    res.sendStatus(200);
  }))

  app.delete('/api/topics/unsubscribe/:id', ensureAuthenticated, wrapper(async (req, res, next) => {
    const { id } = req.params;
    const { topic_id } = req.body;
    const cols = [uuidv4(), id, topic_id, false, moment().unix(), 'standard'];
    await pool.query(`DELETE FROM topic_subscribers WHERE subscriber_id = '${id}' AND topic_id = '${topic_id}'`);
    res.sendStatus(200);
  }))
};
