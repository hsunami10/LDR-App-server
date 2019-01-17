const jwt = require('jsonwebtoken');
const config = require('../config/jwt');
const constants = require('../assets/constants');

/*
HOW TO INVALIDATE TOKENS ON LOGOUT?
Add 2 columns in users table - "token", "token_exp"

Do it like Lyft
- update an "expires" time (users.token_exp) every time the user opens / uses the app
- have it be 1 year from the current time (unix timestamp)
- so if the user does not open the app for over a year, it logs them out

AES - secret key = user's unhashed password (b4 bcrypt)

EXPIRATION FOR JWT TOKEN - 1 month?

- Logging in / Signing up:
  - sign token (jwt)
  - encrypt token with user's (unhashed) password - using AES (https://www.npmjs.com/package/crypto-js#aes-encryption)
  - store / update database in users.token and users.token_exp
  - send hashed token back to user to store (locally)
- Regular requests (authenticating)
  - decrypt token with user's (unhashed) password - using AES
  - verify token (jwt)
    - if fails
      - find row with token (WHERE users.token = token)
      - check token_exp
      - if expired, send back HTTP error code 401 Unauthorized, log user out
      - if not expired, repeat logging in / signing up steps above
    - if does not fail, then continue
- Logging out
  - update users.token & users.token_exp to null (when user is logged out)
- Changing password
  - sign token
  - encrypt with new password
  - update token and token_exp in database
 */

const checkToken = (req, res, next) => {
  // Express headers are lowercase
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  // 'Authorization': 'Bearer ...'
  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }
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
