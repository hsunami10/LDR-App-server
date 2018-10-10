const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../helpers/wrapper');
const upload = require('../config/multer');

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

  app.post('/api/topics/create/:id', upload.single('clientImage'), wrapper(async (req, res, next) => {
    const client = await pool.connect();
    const date = moment().unix();
    const { name, description, topic_id } = req.body;
    try {
      const res2 = await client.query(`SELECT id FROM topics WHERE lowercase_name = '${name.toLowerCase()}'`);
      if (res2.rows.length === 0) {
        let path = '';
        if (req.file) {
          path = req.file.path.substring(6); // Get rid of "public"
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
            date_created: date
          },
          subscribers: {
            id: sub_id,
            subscriber_id: req.params.id,
            topic_id,
            muted: false,
            date_subscribed: date,
            subscriber_type: 'admin'
          }
        });
      } else {
        res.status(200).send({ msg: 'Topic name already taken' });
      }
    } finally {
      client.release();
    }
  }))
};
