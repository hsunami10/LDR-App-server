const uuidv4 = require('uuid/v4');
const moment = require('moment');
const wrapper = require('../assets/wrapper');
const getBlockedUserIDs = require('../assets/queries').getBlockedUserIDs;
const getPostsData = require('../assets/queries').getPostsData;
const getUsersData = require('../assets/queries').getUsersData;
const getTopicsData = require('../assets/queries').getTopicsData;
const rowsToOrderAndObj = require('../assets/helpers').rowsToOrderAndObj;
const filterBlockedQuery = require('../assets/helpers').filterBlockedQuery;
const NO_USER_MSG = require('../assets/constants').NO_USER_MSG;
const SortListTypes = require('../assets/constants').SortListTypes;
const isAuthenticated = require('../assets/authentication').isAuthenticated;

const filterUsers = (blocked, term) => {
  const filter = filterBlockedQuery('users', blocked);
  return `(users.lowercase_username LIKE '%${term.toLowerCase()}%') AND (${filter === '' ? 'true' : filter})`;
};

const filterPosts = (blocked, term) => {
  const filter = filterBlockedQuery('posts', blocked);
  return `(posts.body LIKE '%${term}%' OR posts.body LIKE '%${term.toLowerCase()}%') AND (${filter === '' ? 'true' : filter})`;
};

const filterTopics = term => `(topics.lowercase_name LIKE '%${term.toLowerCase()}%')`;

module.exports = (app, pool) => {
  // TODO: Use real orders and directions for all three, instead of hardcoded
  app.get('/api/search/search-term/:id', isAuthenticated, wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      const { id } = req.params; // all_searches id
      const { term } = req.query;
      const blocked = await getBlockedUserIDs(client, id);
      const filterUsersQuery = filterUsers(blocked, term);
      const filterPostsQuery = filterPosts(blocked, term);
      const filterTopicsQuery = filterTopics(term);

      let users, posts, topics;
      const colsAll = [uuidv4(), term, term.toLowerCase(), 1];
      const colsUser = [uuidv4(), id, term, term.toLowerCase(), moment().unix()];
      [users, posts, topics] = await Promise.all([
        getUsersData(client, id, filterUsersQuery, SortListTypes.users.default.order, SortListTypes.users.default.direction, '', ''),
        getPostsData(client, id, filterPostsQuery, SortListTypes.posts.default.order, SortListTypes.posts.default.direction, '', ''),
        getTopicsData(client, id, filterTopicsQuery, SortListTypes.topics.default.order, SortListTypes.topics.default.direction, '', ''),
        client.query(`INSERT INTO all_searches (id, search_term, lowercase_search_term, num_searches) VALUES ($1, $2, $3, $4) ON CONFLICT (search_term, lowercase_search_term) DO UPDATE SET num_searches = all_searches.num_searches + 1 WHERE all_searches.search_term = '${term}' AND all_searches.lowercase_search_term = '${term.toLowerCase()}'`, colsAll),
        client.query(`INSERT INTO user_searches (id, user_id, search_term, lowercase_search_term, date_searched) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (user_id, lowercase_search_term) DO UPDATE SET search_term = '${term}', date_searched = ${colsUser[4]} WHERE user_searches.user_id = '${id}' AND user_searches.lowercase_search_term = '${term.toLowerCase()}'`, colsUser)
      ]);
      res.status(200).send({
        success: true,
        result: {
          users,
          posts,
          topics
        }
      });
    } finally {
      client.release();
    }
  }))

  app.get('/api/search/get-user-searches/:id', isAuthenticated, wrapper(async (req, res, next) => {
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

  app.delete('/api/search/remove-user-search/:id', isAuthenticated, wrapper(async (req, res, next) => {
    const { id } = req.params; // user_searches id
    await pool.query(`DELETE FROM user_searches WHERE id = '${id}'`);
    res.sendStatus(200);
  }))

  app.get('/api/search/get-posts/:id', isAuthenticated, wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      const { id } = req.params; // all_searches id
      const { term, order, direction, last_id, last_data } = req.query;
      const blocked = await getBlockedUserIDs(client, id);
      const filterPostsQuery = filterPosts(blocked, term);
      const posts = await getPostsData(client, id, filterPostsQuery, order, direction, last_id, last_data);
      res.status(200).send({ success: true, posts });
    } finally {
      client.release();
    }
  }))

  app.get('/api/search/get-users/:id', isAuthenticated, wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      const { id } = req.params; // all_searches id
      const { term, order, direction, last_id, last_data } = req.query;
      const blocked = await getBlockedUserIDs(client, id);
      const filterUsersQuery = filterUsers(blocked, term);
      const users = await getUsersData(client, id, filterUsersQuery, order, direction, last_id, last_data);
      res.status(200).send({ success: true, users });
    } finally {
      client.release();
    }
  }))

  app.get('/api/search/get-topics/:id', isAuthenticated, wrapper(async (req, res, next) => {
    const client = await pool.connect();
    try {
      const { id } = req.params; // all_searches id
      const { term, order, direction, last_id, last_data } = req.query;
      const blocked = await getBlockedUserIDs(client, id);
      const filterTopicsQuery = filterTopics(term);
      const topics = await getTopicsData(client, id, filterTopicsQuery, order, direction, last_id, last_data);
      res.status(200).send({ success: true, topics });
    } finally {
      client.release();
    }
  }))
};
