// Hanldes all errors in one area
module.exports = (fn) => {
  return (req, res, next) =>
    Promise.resolve(fn(req, res, next))
      .catch(err => {
        console.log('error in middleware/wrapper.js');
        console.log(err);
        next();
      })
}
