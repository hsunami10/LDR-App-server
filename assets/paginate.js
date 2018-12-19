// All keyset pagination

// Pagination queries - functions that return string queries ONLY
const limit = 20;

// Only allow one ordering - date
const comments = (postID, lastID, lastData, commentsLimit = 5) => (
  `SELECT comments.id, comments.post_id, comments.author_id, users.username, users.profile_pic, comments.date_sent, comments.body, (SELECT COUNT(*) FROM comment_likes WHERE comment_likes.comment_id = comments.id) AS num_likes FROM comments INNER JOIN users ON comments.author_id = users.id WHERE ${lastID === '' ? '' : `(comments.date_sent, comments.id) < (${lastData}, '${lastID}') AND`} comments.post_id = '${postID}' ORDER BY comments.date_sent DESC, comments.id DESC FETCH FIRST ${commentsLimit} ROWS ONLY`
);

// Only allow one ordering - date
const interactions = (userID, filterQuery, lastID, lastData) => (
  `SELECT posts.id, posts.topic_id, topics.name, posts.author_id, users.username, users.profile_pic, posts.date_posted, posts.body, posts.coordinates, (SELECT COUNT(*) FROM post_likes WHERE post_likes.post_id = interactions.post_id) AS num_likes, (SELECT COUNT(*) FROM comments WHERE comments.post_id = interactions.post_id) as num_comments FROM interactions INNER JOIN posts ON interactions.post_id = posts.id INNER JOIN users ON interactions.user_id = users.id INNER JOIN topics ON posts.topic_id = topics.id WHERE (interactions.user_id = '${userID}') AND (${filterQuery === '' ? 'true' : filterQuery}) ${lastID === '' ? '' : `AND (interactions.date_updated, posts.id) < (${lastData}, '${lastID}')`} ORDER BY interactions.date_updated DESC, posts.id DESC FETCH FIRST ${limit} ROWS ONLY`
);

const friends = (userID, filterQuery, orderCol, direction, lastID, lastData) => {
  let orderQuery = '';
  let benchmark = '';
  switch (orderCol) {
    case 'date_friended': // Recently friended - DESC
      orderQuery = `friends.date_friended ${direction}`;
      benchmark = `(friends.date_friended, users.id) < (${lastData}, '${lastID}') AND`;
      break;
    case 'date_joined': // Order by both directions
      orderQuery = `users.date_joined ${direction}`;
      if (direction === 'DESC') {
        benchmark = `(users.date_joined, users.id) < (${lastData}, '${lastID}') AND`;
      } else {
        benchmark = `(users.date_joined, users.id) > (${lastData}, '${lastID}') AND`;
      }
      break;
    case 'num_friends':
      orderQuery = `(SELECT COUNT(*) FROM friends WHERE user1_id = users.id OR user2_id = users.id) ${direction}`;
      benchmark = `((SELECT COUNT(*) FROM friends WHERE user1_id = users.id OR user2_id = users.id), users.id) < (${lastData}, '${lastID}') AND`
      break;
    default:
      break;
  }
  return (
    `SELECT users.id, users.username, users.profile_pic, friends.date_friended, users.date_joined, 'friend' AS type FROM friends INNER JOIN users ON (SELECT get_other_id('${userID}', friends.user1_id, friends.user2_id)) = users.id WHERE ${lastID === '' ? '' : benchmark} (${filterQuery === '' ? 'true' : filterQuery}) AND (friends.user1_id = '${userID}' OR friends.user2_id = '${userID}') ORDER BY ${orderQuery}, users.id ${direction} FETCH FIRST ${limit} ROWS ONLY`
  );
};

// lastID - the ID to order on - default is '' (for initial fetch "offset = 0")
// lastData - the data to order on
const posts = (filterQuery, orderCol, direction, lastID, lastData) => {
  let orderQuery = '';
  let benchmark = '';
  switch (orderCol) {
    case 'date_posted':
      orderQuery = `posts.date_posted ${direction}`;
      if (direction === 'DESC') {
        benchmark = `(posts.date_posted, posts.id) < (${lastData}, '${lastID}') AND`;
      } else if (direction === 'ASC') {
        benchmark = `(posts.date_posted, posts.id) > (${lastData}, '${lastID}') AND`;
      }
      break;
    case 'num_likes':
      orderQuery = `(SELECT COUNT(*) FROM post_likes WHERE post_likes.post_id = posts.id) ${direction}`;
      benchmark = `((SELECT COUNT(*) FROM post_likes WHERE post_likes.post_id = posts.id), posts.id) < (${lastData}, '${lastID}') AND`
      break;
    default:
      break;
  }
  return (
    `SELECT posts.id, posts.topic_id, topics.name, posts.author_id, users.username, users.profile_pic, posts.date_posted, posts.body, posts.coordinates, (SELECT COUNT(*) FROM post_likes WHERE post_likes.post_id = posts.id) AS num_likes, (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) AS num_comments FROM posts INNER JOIN users ON posts.author_id = users.id INNER JOIN topics ON posts.topic_id = topics.id WHERE ${lastID === '' ? '' : benchmark} (${filterQuery === '' ? 'true' : filterQuery}) ORDER BY ${orderQuery}, posts.id ${direction} FETCH FIRST ${limit} ROWS ONLY`
  );
};

// NOTE: Same format as routes/users.js - get user except adding num_friends
// QUESTION: Maybe add alphabetical as an ordering? Probably not necessary
const users = (userID, filterQuery, orderCol, direction, lastID, lastData) => {
  let orderQuery = '';
  let benchmark = '';
  switch (orderCol) {
    case 'date_joined':
      orderQuery = `date_joined ${direction}`;
      benchmark = `(date_joined, id) < (${lastData}, '${lastID}') AND`;
      break;
    case 'num_friends':
      orderQuery = `(SELECT COUNT(*) FROM friends WHERE user1_id = users.id OR user2_id = users.id) ${direction}`;
      benchmark = `((SELECT COUNT(*) FROM friends WHERE user1_id = users.id OR user2_id = users.id), users.id) < (${lastData}, '${lastID}') AND`;
      break;
    default:
      break;
  }
  return (
    `SELECT id, username, profile_pic, bio, date_joined, active, user_type, (SELECT COUNT(*) FROM friends WHERE user1_id = users.id OR user2_id = users.id) AS num_friends, (SELECT get_user_relation('${userID}', users.id)) AS type FROM users WHERE id != '${userID}' AND id != '' AND ${lastID === '' ? '' : benchmark} (${filterQuery === '' ? 'true' : filterQuery}) ORDER BY ${orderQuery}, users.id ${direction} FETCH FIRST ${limit} ROWS ONLY`
  );
};

// NOTE: Similar format as routes/topics.js - get subscribed topics
// QUESTION: Maybe add alphabetical as an ordering? Probably not necessary
const topics = (userID, filterQuery, orderCol, direction, lastID, lastData) => {
  let orderQuery = '';
  let benchmark = '';
  switch (orderCol) {
    case 'date_created': // Order by both directions
      orderQuery = `date_created ${direction}`;
      if (direction === 'DESC') {
        benchmark = `(date_created, id) < (${lastData}, '${lastID}') AND`;
      } else {
        benchmark = `(date_created, id) > (${lastData}, '${lastID}') AND`;
      }
      break;
    case 'num_subscribers':
      orderQuery = `(SELECT COUNT(*) FROM topic_subscribers WHERE topics.id = topic_subscribers.topic_id) ${direction}`;
      benchmark = `((SELECT COUNT(*) FROM topic_subscribers WHERE topics.id = topic_subscribers.topic_id), topics.id) < (${lastData}, '${lastID}') AND`
      break;
    default:
      break;
  }
  return (
    `SELECT id, name, lowercase_name, topic_pic, description, date_created, (SELECT COUNT(*) FROM topic_subscribers WHERE topics.id = topic_subscribers.topic_id) AS num_subscribers, (SELECT get_topic_relation('${userID}', topics.id)) AS type FROM topics WHERE ${lastID === '' ? '' : benchmark} (${filterQuery === '' ? 'true' : filterQuery}) ORDER BY ${orderQuery}, topics.id ${direction} FETCH FIRST ${limit} ROWS ONLY`
  );
};

module.exports = {
  limit,
  comments,
  interactions,
  friends,
  posts,
  users,
  topics,
};
