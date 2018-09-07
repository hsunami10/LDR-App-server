const shortid = require('shortid');

module.exports = (app, pool) => {
  app.route('/api/user/:id/:type')
    .get((req, res) => {
      const { id, type } = req.params;
      if (type === 'private') {
        res.status(200).send({ msg: 'private user', id: req.params.id });
      } else if (type === 'public') {
        res.status(200).send({ msg: 'public user', id: req.params.id });
      }
    })
};
