// Pagination queries - functions that return string queries ONLY
const limit = 20;

// If offset is 0, get all posts without a "lastestDate"
// If offset is not 0, then use "lastestDate" - without filtering lastestDate, newest posts will be added on top (like reloading)
// lastestDate - date_posted of the post at the very top of the user's feed ("first" post you see)
const posts = (whereQuery, orderCol, direction, offset, latest) => {
  let orderQuery = '';
  let benchmark = '';
  switch (orderCol) {
    case 'date_posted':
      orderQuery = `posts.date_posted ${direction}`;
      benchmark = `posts.date_posted <= ${latest} AND`;
      break;
    case 'num_likes':
      // TODO: BUG: QUESTION: How to page and order by number of likes?
      orderQuery = `(SELECT COUNT(*) FROM post_likes WHERE post_likes.post_id = posts.id) ${direction}`;
      benchmark = `(SELECT COUNT(*) FROM post_likes WHERE post_likes.post_id = posts.id) <= ${latest} AND`
      break;
    default:
      orderQuery = `posts.date_posted ${direction}`;
      benchmark = `posts.date_posted <= ${latest} AND`;
      break;
  }
  return (
    `SELECT * FROM (SELECT posts.id, posts.topic_id, topics.name, posts.author_id, users.username, users.profile_pic, posts.date_posted, posts.body, posts.coordinates, (SELECT COUNT(*) FROM post_likes WHERE post_likes.post_id = posts.id) AS num_likes, (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) as num_comments, ROW_NUMBER () OVER (ORDER BY ${orderQuery}) AS RowNum FROM posts INNER JOIN users ON posts.author_id = users.id INNER JOIN topics ON posts.topic_id = topics.id WHERE ${offset === 0 ? '' : benchmark} (${whereQuery})) AS RowConstrainedResult WHERE RowNum > ${offset} AND RowNum <= ${offset + limit} ORDER BY RowNum`
  )
};

const commentsLimit = 5; // NOTE: Same as client/src/constants/variables.js
const comments = (postID , offset, latestDate) => (
  `SELECT * FROM (SELECT comments.id, comments.post_id, comments.author_id, users.username, users.profile_pic, comments.date_sent, comments.body, (SELECT COUNT(*) FROM comment_likes WHERE comment_likes.comment_id = comments.id) AS num_likes, ROW_NUMBER () OVER (ORDER BY comments.date_sent DESC) AS RowNum FROM comments INNER JOIN users ON comments.author_id = users.id WHERE ${offset === 0 ? '' : `comments.date_sent <= ${latestDate} AND`} comments.post_id = '${postID}') AS RowConstrainedResult WHERE RowNum > ${offset} AND RowNum <= ${offset + commentsLimit} ORDER BY RowNum`
);

const interactions = (userID, offset) => (
  `SELECT * FROM (SELECT posts.id, posts.topic_id, topics.name, posts.author_id, users.username, users.profile_pic, posts.date_posted, posts.body, posts.coordinates, (SELECT COUNT(*) FROM post_likes WHERE post_likes.post_id = interactions.post_id) AS num_likes, (SELECT COUNT(*) FROM comments WHERE comments.post_id = interactions.post_id) as num_comments, ROW_NUMBER () OVER (ORDER BY interactions.date_updated DESC) AS RowNum FROM interactions INNER JOIN posts ON interactions.post_id = posts.id INNER JOIN users ON interactions.user_id = users.id INNER JOIN topics ON posts.topic_id = topics.id WHERE interactions.user_id = '${userID}') AS RowConstrainedResult WHERE RowNum > ${offset} AND RowNum <= ${offset + limit} ORDER BY RowNum`
);

const friends = (userID, offset) => (
  `SELECT * FROM (SELECT users.id, users.username, users.profile_pic, friends.date_friended, 'friend' AS type, ROW_NUMBER () OVER (ORDER BY friends.date_friended DESC) AS RowNum FROM friends INNER JOIN users ON (SELECT get_other_id('${userID}', friends.user1_id, friends.user2_id)) = users.id WHERE friends.user1_id = '${userID}' OR friends.user2_id = '${userID}') AS RowConstrainedResult WHERE RowNum > ${offset} AND RowNum <= ${offset + limit} ORDER BY RowNum`
);

const users = (userID, offset) => (
  `SELECT * FROM (SELECT users.id, users.username, users.profile_pic, users.date_joined, 'friend' AS type, ROW_NUMBER () OVER (ORDER BY friends.date_friended DESC) AS RowNum FROM friends INNER JOIN users ON (SELECT get_other_id('${userID}', friends.user1_id, friends.user2_id)) = users.id WHERE friends.user1_id = '${userID}' OR friends.user2_id = '${userID}') AS RowConstrainedResult WHERE RowNum > ${offset} AND RowNum <= ${offset + limit} ORDER BY RowNum`
);

module.exports = {
  limit,
  commentsLimit,
  posts,
  comments,
  interactions,
  friends
};
