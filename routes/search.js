const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../assets/wrapper');
const getPostsData = require('../assets/queries').getPostsData;
const getUsersData = require('../assets/queries').getUsersData;
const getTopicsData = require('../assets/queries').getTopicsData;
const rowsToOrderAndObj = require('../assets/helpers').rowsToOrderAndObj;

module.exports = (app, pool) => {
  app.get('/api/search/search-term/:id', wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      const { id } = req.params; // all_searches id
      const { term } = req.query;
      // Look up both term and term.toLowerCase() to query - users, posts, topics
      // When upserting all_searches, look up with: WHERE lowercase_search_term = term.toLowerCase() AND search_term = term
    } finally {
      client.release();
    }
  }))

  app.get('/api/search/get-user-searches/:id', wrapper(async (req, res, next) => {
    const { id } = req.params; // user id
    const { term } = req.query;
    let searches;
    if (term === '') {
      searches = await pool.query(`SELECT id, user_id, search_term, date_searched FROM user_searches WHERE user_id = '${id}' ORDER BY date_searched DESC`);
    } else {
      searches = await pool.query(`SELECT id, search_term, num_searches FROM all_searches WHERE lowercase_search_term LIKE '%${term.toLowerCase()}%' ORDER BY num_searches DESC FETCH FIRST 10 ROWS ONLY`);
    }
    res.status(200).send(rowsToOrderAndObj(searches.rows, 'id'));
  }))

  app.delete('/api/search/remove-user-search/:id', wrapper(async (req, res, next) => {
    const { id } = req.params; // user_searches id
    await pool.query(`DELETE FROM user_searches WHERE id = '${id}'`);
    res.sendStatus(200);
  }))
};
