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
    .post(wrapper(async (req, res, next) => {
      // TODO: Create post
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
};
