const limit = 20;

const posts = (authorId, orderCol, direction, offset) => ({
  query: `SELECT * FROM (SELECT id, topic_id, author_id, alias_id, date_posted, body, coordinates, num_likes, ROW_NUMBER () OVER (ORDER BY ${orderCol} ${direction}) AS RowNum FROM posts WHERE author_id = '${authorId}') AS RowConstrainedResult WHERE RowNum > ${offset} AND RowNum <= ${offset + limit} ORDER BY RowNum`,
  newOffset: offset + limit
});

module.exports = {
  limit,
  posts
};
