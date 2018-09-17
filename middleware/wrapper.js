// Wrap async function with a Promise.resolve for centralized error handling
module.exports = fn => (req, res, next) => {
  fn(req, res, next)
    .catch(err => {
      console.log(err);
      res.status(500).send(`Something went wrong: ${err}`);
    })
}
