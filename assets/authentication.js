const bcrypt = require('bcrypt');
const NO_USER_MSG = require('./constants').NO_USER_MSG;
const saltRounds = 10;

const hashPlainText = async plaintext => {
  const hash = await bcrypt.hash(plaintext, saltRounds);
  return hash;
};

const compareHash = async (plaintext, hash) => {
  const match = await bcrypt.compare(plaintext, hash);
  return match;
};

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(200).send({ success: false, error: NO_USER_MSG });
}

module.exports = {
  ensureAuthenticated,
  hashPlainText,
  compareHash,
};
