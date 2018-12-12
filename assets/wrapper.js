const {
  NO_TOPIC_MSG,
  NO_USER_MSG,
  NO_POST_MSG,
  NO_COMMENT_MSG
} = require('./constants');

// Generate an error message for foreign key constraint errors
// NOTE: If table names / number changes, change this too
// NOTE: Same cases as handleAction in client/src/assets/helpers/errors/index.js
const generateMessage = type => {
  let msg = `Foreign key violation for table: ${type}`;
  // Tables that have a foreign key referencing them
  // NOTE: Same as client, helpers/index.js, function handleError
  switch (type) {
    case 'topics':
      msg = NO_TOPIC_MSG;
      break;
    case 'users':
      msg = NO_USER_MSG;
      break;
    case 'posts':
      msg = NO_POST_MSG;
      break;
    case 'comments':
      msg = NO_COMMENT_MSG;
      break;
    default:
      break;
  }
  return {
    fk_error_msg: msg,
    fk_error_type: type
  };
}

// Wrap async function with a Promise.resolve for centralized error handling
module.exports = fn => async (req, res, next) => {
  fn(req, res, next)
    .catch(err => {
      console.log(err);
      if (err.code === '23503') { // Handle foreign key violation
        console.log('foreign key violation');
        res.status(500).send({ ...err, ...generateMessage(err.detail.split("\"")[1]) });
      } else {
        res.status(500).send(err);
      }
    })
}
