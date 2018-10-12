// Generate an error message for foreign key constraint errors
// NOTE: If table names / number changes, change this too
const generateMessage = type => {
  let msg = ' no longer exists. Please try again.';
  // Tables that have a foreign key referencing them
  switch (type) {
    case 'topics':
      msg = 'This topic' + msg;
      break;
    case 'users':
      msg = 'This user' + msg;
      break;
    case 'posts':
      msg = 'This post' + msg;
      break;
    case 'aliases':
      msg = 'This alias' + msg;
      break;
    default:
      msg = 'This' + msg;
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
        res.status(500).send({ ...err, ...generateMessage(err.detail.split("\"")[1]) })
      } else {
        res.status(500).send(err);
      }
    })
}
