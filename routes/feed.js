const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../helpers/wrapper');

module.exports = (app, pool) => {
  app.get('/api/feed/:id', wrapper(async (req, res, next) => {
    // TODO: Get feed
    // TODO: Paginate with query params
    // req.params.id - user id
  }))
};
