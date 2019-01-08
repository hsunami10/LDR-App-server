const bcrypt = require('bcrypt');
const saltRounds = 10;

const hashPlainText = async plaintext => {
  const hash = await bcrypt.hash(plaintext, saltRounds);
  return hash;
};

const compareHash = async (plaintext, hash) => {
  const match = await bcrypt.compare(plaintext, hash);
  return match;
};

module.exports = {
  hashPlainText,
  compareHash,
};
