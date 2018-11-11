// Generate an error message for foreign key constraint errors
// NOTE: If table names / number changes, change this too
const generateMessage = type => {
  console.log(type);
  let msg = ' does not exist or has been deleted.';
  // Tables that have a foreign key referencing them
  // NOTE: Same as client, helpers/index.js, function handleError
  switch (type) {
    case 'topics':
      msg = 'This topic' + msg;
      break;
    case 'users':
      msg = 'This account' + msg + ' If this keeps recurring, please send a bug report, and we will get it fixed as soon as possible.';
      break;
    case 'posts':
      msg = 'This post' + msg;
      break;
    case 'aliases':
      msg = 'This alias' + msg;
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
