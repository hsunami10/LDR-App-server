const shortid = require('shortid');

module.exports = (app, pool) => {
  // ========================================= Logging In =========================================
  app.get('/api/login/:username/:password', (req, res) => {
    console.log(req.params);
    res.status(200).send({
      response: `username: ${req.params.username}, password: ${req.params.password}`
    });
  });
};
