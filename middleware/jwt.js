const jwt = require('jsonwebtoken');
const config = require('../config/jwt');
const constants = require('../assets/constants');

const checkToken = (req, res, next) => {
  // Express headers are lowercase
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  // 'Authentication': 'Bearer ...'
  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }

  // If token exists, validate token
  if (token) {
    jwt.verify(token, config.secret, (error, decoded) => {
      if (error) {
        return res.status(200).send({
          success: false,
          message: 'Authentication token not valid'
        });
      }
      req.decoded = decoded;
      next();
    });
  } else {
    return res.status(200).send({
      success: false,
      message: 'Authentication token is not supplied'
    });
  }
};

module.exports = {
  checkToken
};
