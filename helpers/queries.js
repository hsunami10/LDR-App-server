// Regular queries used in multiple areas
const getUserAliases = id => `SELECT id, alias FROM aliases WHERE user_id = '${id}' ORDER BY alias DESC`; // Alphabetical order

const fetchComments = async (client, user_id, offset, queryString) => {
  const comments = await client.query(queryString);
  const length = comments.rows.length;

  let order = new Array(length), commentsObj = {};
  for (let i = 0; i < length; i++) {
    commentsObj[comments.rows[i].id] = comments.rows[i];
    order[length - i - 1] = comments.rows[i].id; // Want latest element to be at bottom of screen, not top
  }

  const newOffset = parseInt(offset, 10) + order.length;
  if (order.length === 0) {
    return {
      comment_likes: {},
      comments: commentsObj,
      order,
      offset: newOffset
    };
  } else {
    let comment_likes = await client.query(`SELECT comment_id FROM comment_likes WHERE user_id = '${user_id}'`);
    // Convert to object that maps post_id to likes
    comment_likes = comment_likes.rows.reduce((acc, comment_like) => {
      acc[comment_like.comment_id] = true;
      return acc;
    }, {});
    return {
      comment_likes,
      comments: commentsObj,
      order,
      offset: newOffset
    };
  }
}

module.exports = {
  getUserAliases,
  fetchComments
}
