const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../helpers/wrapper');

module.exports = (app, pool) => {
  app.route('/api/posts/:id')
    .get(wrapper(async (req, res, next) => {
      // TODO: Get all user specific posts
      // TODO: Paginate with query params
      // req.params.id - user id
    }))
    .put(wrapper(async (req, res, next) => {
      // TODO: Edit post
      // req.params.id - user id
    }))
    .delete(wrapper(async (req, res, next) => {
      // TODO: Delete post
      // req.params.id - user id
    }))

  app.post('/api/posts/:id/:topic_id', wrapper(async (req, res, next) => {
    // TODO: Create post
    // req.params.id - user id, req.params.topic_id - topic id (can be null / undefined)
  }))
};
