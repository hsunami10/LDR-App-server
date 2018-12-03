const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../helpers/wrapper');
const thirtyMin = 1800; // Seconds

module.exports = (app, pool) => {
  app.get('/api/partner/find-code/:code', wrapper(async (req, res, next) => {
    const res2 = await pool.query(`SELECT partners.user1_id AS id, users.username, users.profile_pic, users.date_joined FROM partners INNER JOIN users ON partners.user1_id = users.id WHERE request_code = '${req.params.code}' AND ${moment().unix() - thirtyMin} <= date_requested`);
    if (res2.rows.length === 0) {
      res.status(200).send({ success: false });
    } else {
      res.status(200).send({ success: true, result: res2.rows[0] });
    }
  }))

  app.put('/api/partner/accept', wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      const { userID, partnerID } = req.body;
      if (userID !== partnerID) {
        // Check if the user already has a partner
        const res2 = await client.query(`SELECT id FROM partners WHERE user1_id = '${userID}' OR user2_id = '${userID}'`);
        if (res2.rows.length === 0) {
          let update, del, partner;
          [update, del, partner] = await Promise.all([
            client.query(`UPDATE partners SET user2_id = '${userID}', date_requested = 0 WHERE user1_id = '${partnerID}'`), // Force expire code
            client.query(`DELETE FROM partners WHERE user1_id = '${userID}'`), // Remove your own generated codes
            client.query(`SELECT partners.id, users.id AS partner_id, users.username, users.profile_pic, partners.date_together, partners.countdown, partners.type FROM partners INNER JOIN users ON users.id = partners.user1_id WHERE partners.user1_id = '${partnerID}'`)
          ]);
          res.status(200).send({ success: true, result: partner.rows[0], msg: 'Partner has been added!' });
        } else {
          res.status(200).send({ success: false, msg: 'You can only have one partner at a time.'});
        }
      } else {
        res.status(200).send({ success: false, msg: 'You cannot be a partner with yourself!' });
      }
    } finally {
      client.release();
    }
  }))
}
