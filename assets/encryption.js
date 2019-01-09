const CryptoJS = require('crypto-js');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const isObject = param => typeof param === 'object';

// =========================================== crypto-js ===========================================
const encryptAES = (message, secretKey) => CryptoJS.AES.encrypt(message.toString(), secretKey);

const decryptAES = (ciphertext, secretKey) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext.toString(), secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};

const encryptObjAES = (message, secretKey) => CryptoJS.AES.encrypt(JSON.stringify(message), secretKey);

const decryptObjAES = (ciphertext, secretKey) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext.toString(), secretKey);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

// ============================================ bcrypt ============================================
const hashPassword = async plaintext => {
  const hash = await bcrypt.hash(plaintext, saltRounds);
  return hash;
};

const compareHash = async (plaintext, hash) => {
  const match = await bcrypt.compare(plaintext, hash);
  return match;
};

module.exports = {
  hashPassword,
  compareHash,
  encryptAES,
  decryptAES,
  encryptObjAES,
  decryptObjAES,
};
