const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../helpers/wrapper');

module.exports = (app, pool) => {
  // Create post
  app.post('/api/create-post', wrapper(async (req, res, next) => {
    // TODO: Finish this later
    // req.body: topic_id, author_id (user_id), alias_id, body, coordinates (optional, 'long lat')
  }));

  // Delete post
  app.delete('/api/remove-post', wrappe(async (req, res, next) => {
    // TODO: Finish this later
  }));

  // Get user feed
  app.get('/api/retrieve-feed/:id', wrapper(async (req, res, next) => {
    // TODO: Finish this later
  }));
};
