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

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send(NO_USER_MSG);
}

module.exports = {
  isAuthenticated,
  hashPlainText,
  compareHash,
};
