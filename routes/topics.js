const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../helpers/wrapper');

module.exports = (app, pool) => {
  app.route('/api/topics/:id')
    .get(wrapper(async (req, res, next) => {
      // TODO: Get specified topic's posts
      // TODO: Paginate with query params
      // req.params.id - topic id
    }))
    .post(wrapper(async (req, res, next) => {
      // TODO: Create topic
      // req.params.id - user id
      // req.body - name, topic_pic, description
      const client = await pool.connect();
      try {
        // TODO: Update database here
      } finally {
        client.release();
      }
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
};
