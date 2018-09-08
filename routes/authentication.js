const uuidv4 = require('uuid/v4');
const shortid = require('shortid');
const wrapper = require('../middleware/wrapper');

module.exports = (app, pool) => {
  // ====================================== Logging In / Out ======================================
  app.get('/api/login/:username/:password', wrapper(async (req, res) => {
    // TODO: Query database to see if log in exists - await
    // If exists, then return json of user data
    // If doesn't exist, send status 400
    res.status(200).send({
      response: `username: ${req.params.username}, password: ${req.params.password}`
    });
  }));

  // ========================================== Signing Up ==========================================
  app.post('/api/signup/username', (req, res) => {
    console.log(req.body);
    res.status(200).send({
      body: req.body,
      msg: 'sign up username response!!!'
    });
  });
};
