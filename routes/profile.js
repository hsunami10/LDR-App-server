const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../assets/wrapper');
const upload = require('../config/multer');
const isAuthenticated = require('../assets/authentication').isAuthenticated;

module.exports = (app, pool) => {
  // NOTE: Anything related to editing profile here
  // ======================================= Create Profile =======================================
  app.put('/api/profile/create', isAuthenticated, upload.single('clientImage'), wrapper(async (req, res, next) => {
    // NOTE: Make sure the path has a / as the first character
    const { bio, code, user_id } = req.body;
    let path = '';
    if (req.file) {
      path = req.file.path.substring(7); // Get rid of "public/"
    } else {
      path = null;
    }
    await pool.query(`UPDATE users SET bio = ${bio.length === 0 ? `''` : `'${bio}'`}, profile_pic = ${path ? `'${path}'` : null} WHERE id = '${user_id}'`);
    res.sendStatus(200);
  }));
};
