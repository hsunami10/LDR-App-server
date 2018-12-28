const compareHash = require('../assets/authentication').compareHash;
const LocalStrategy = require('passport-local');

// https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
module.exports = (passport, pool) => {
  // Determine what data should be stored in session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Fetch data that was stored in session
  passport.deserializeUser(async (id, done) => {
    try {
      const result = await pool.query(`SELECT id, username, password, profile_pic, bio, date_joined, active, user_type, 'self' AS type FROM users WHERE id = '${id}' AND deleted = false`);
      if (result.rows.length === 0) {
        done(null, false);
      } else {
        done(null, result.rows[0]);
      }
    } catch (error) {
      done(error);
    }
  });

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const result = await pool.query(`SELECT id, username, password, profile_pic, bio, date_joined, active, user_type, 'self' AS type FROM users WHERE username = '${username}' AND deleted = false`);
      if (result.rows.length === 0) {
        done(null, false);
      } else {
        const user = result.rows[0];
        const match = await compareHash(password, user.password);
        if (match) {
          done(null, user);
        } else {
          done(null, false);
        }
      }
    } catch (error) {
      done(error);
    }
  }));
};
