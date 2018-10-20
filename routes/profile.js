const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../helpers/wrapper');
const upload = require('../config/multer');

module.exports = (app, pool) => {
  // NOTE: Anything related to editing profile here
  // ======================================= Create Profile =======================================
  app.put('/api/profile/create', upload.single('clientImage'), wrapper(async (req, res, next) => {
    // NOTE: Make sure the path has a / as the first character
    const { bio, user_id } = req.body;
    let path = '';
    if (req.file) {
      path = req.file.path.substring(6); // Get rid of "public"
    } else {
      path = null;
    }
    const res2 = await pool.query(`UPDATE users SET bio = ${bio.length === 0 ? `''` : `'${bio}'`}, profile_pic = ${path ? `'${path}'` : null} WHERE id = '${user_id}'`);
    res.sendStatus(200);
  }));

  // ======================================== Create Alias ========================================
  app.post('/api/profile/alias/:id', wrapper(async (req, res, next) => {
    // req.params.id = user_id
    // req.body = alias
    const client = await pool.connect();
    const { id } = req.params;
    const { alias } = req.body;
    const lowercase_alias = alias.toLowerCase();
    const res2 = await client.query(`SELECT id FROM aliases WHERE lowercase_alias = '${lowercase_alias}'`);
    if (res2.rows.length === 0) {
      const alias_id = uuidv4();
      const cols = [alias_id, id, alias, lowercase_alias];
      const res3 = await client.query(`INSERT INTO aliases VALUES ($1, $2, $3, $4)`, cols);
      res.status(200).send({
        success: true,
        alias: {
          id: alias_id,
          alias
        }
      });
    } else {
      res.status(200).send({ msg: 'Alias already taken' });
    }
  }))
};
