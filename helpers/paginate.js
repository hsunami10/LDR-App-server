// Pagination queries
const limit = 20;

// Specific user posts
const posts = (authorId, orderCol, direction, offset) => (
  `SELECT * FROM (SELECT posts.id, posts.topic_id, topics.name, posts.author_id, users.username, users.profile_pic, posts.alias_id, aliases.alias, posts.date_posted, posts.body, posts.coordinates, (SELECT COUNT(*) FROM post_likes WHERE post_likes.post_id = posts.id) AS num_likes, ROW_NUMBER () OVER (ORDER BY posts.${orderCol} ${direction}) AS RowNum FROM posts INNER JOIN users ON posts.author_id = users.id INNER JOIN topics ON posts.topic_id = topics.id INNER JOIN aliases ON posts.alias_id = aliases.id WHERE author_id = '${authorId}') AS RowConstrainedResult WHERE RowNum > ${offset} AND RowNum <= ${offset + limit} ORDER BY RowNum`
);

// If offset is 0, get all posts without a "lastestDate"
// If offset is not 0, then use "lastestDate" - without filtering lastestDate, newest posts will be added on top (like reloading)
// lastestDate - date_posted of the post at the very top of the user's feed ("first" post you see)
const feed = (whereQuery, orderCol, direction, offset, latestDate) => (
  `SELECT * FROM (SELECT posts.id, posts.topic_id, topics.name, posts.author_id, users.username, users.profile_pic, posts.alias_id, aliases.alias, posts.date_posted, posts.body, posts.coordinates, (SELECT COUNT(*) FROM post_likes WHERE post_likes.post_id = posts.id) AS num_likes, ROW_NUMBER () OVER (ORDER BY posts.${orderCol} ${direction}) AS RowNum FROM posts INNER JOIN users ON posts.author_id = users.id INNER JOIN topics ON posts.topic_id = topics.id INNER JOIN aliases ON posts.alias_id = aliases.id WHERE ${offset === 0 ? '' : `posts.date_posted <= ${latestDate} AND`} (${whereQuery})) AS RowConstrainedResult WHERE RowNum > ${offset} AND RowNum <= ${offset + limit} ORDER BY RowNum`
);

module.exports = {
  limit,
  posts,
  feed
};
