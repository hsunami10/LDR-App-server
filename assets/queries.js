// This file is for functions that RUN queries
const friendsQuery = require('./paginate').friends;
const pagePostsQuery = require('./paginate').posts;
const pageUsersQuery = require('./paginate').users;
const rowsToOrderAndObj = require('./helpers').rowsToOrderAndObj;

const userExists = async (client, id) => {
  const user = await client.query(`SELECT id FROM users WHERE id = '${id}' AND deleted = false`);
  return user.rows.length > 0;
}

const getComments = async (client, user_id, offset, queryString) => {
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
    // Convert to object that maps comment_ids to likes
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
};

const getUserRequests = async (client, user_id) => {
  const requests = await client.query(`SELECT friend_requests.sender_id AS id, users.username, users.profile_pic, 'request' as type FROM friend_requests INNER JOIN users ON friend_requests.sender_id = users.id WHERE friend_requests.receiver_id = '${user_id}' ORDER BY friend_requests.date_sent DESC`);
  if (requests.rows.length === 0) {
    return {
      data: {},
      order: []
    };
  } else {
    const length = requests.rows.length;
    let requestsObj = {};
    let requestsOrder = new Array(requests.rows.length);
    for (let i = 0; i < length; i++) {
      const request = requests.rows[i];
      requestsObj[request.id] = request;
      requestsOrder[i] = request.id;
    }
    return {
      data: requestsObj,
      order: requestsOrder
    };
  }
};

const getPendingRequests = async (client, user_id) => {
  const pendings = await client.query(`SELECT friend_requests.receiver_id AS id, users.username, users.profile_pic, friend_requests.date_sent, 'pending' as type FROM friend_requests INNER JOIN users ON friend_requests.receiver_id = users.id WHERE friend_requests.sender_id = '${user_id}' ORDER BY friend_requests.date_sent DESC`);
  if (pendings.rows.length === 0) {
    return {
      data: {},
      order: []
    };
  } else {
    const length = pendings.rows.length;
    let pendingsObj = {};
    let pendingsOrder = new Array(pendings.rows.length);
    for (let i = 0; i < length; i++) {
      const pending = pendings.rows[i];
      pendingsObj[pending.id] = pending;
      pendingsOrder[i] = pending.id;
    }
    return {
      data: pendingsObj,
      order: pendingsOrder
    };
  }
};

const getUserFriends = async (client, user_id, offset) => {
  const friends = await client.query(friendsQuery(user_id, offset));
  if (friends.rows.length === 0) {
    return {
      data: {},
      order: [],
      offset,
      keepPaging: false
    };
  } else {
    const length = friends.rows.length;
    let friendsObj = {};
    let friendsOrder = new Array(friends.rows.length);
    for (let i = 0; i < length; i++) {
      const friend = friends.rows[i];
      friendsObj[friend.id] = friend;
      friendsOrder[i] = friend.id;
    }
    return {
      data: friendsObj,
      order: friendsOrder,
      offset: offset + friendsOrder.length,
      keepPaging: friendsOrder.length !== 0
    };
  }
};

const removeFriendRequestQuery = (senderID, receiverID) => `DELETE FROM friend_requests WHERE sender_id = '${senderID}' AND receiver_id = '${receiverID}'`;

const getBlockedUserIDs = async (client, userID) => {
  const blocked = await client.query(`SELECT user1_id, user2_id FROM blocked WHERE user1_id = '${userID}' OR user2_id = '${userID}'`);
  const length = blocked.rows.length;
  const result = new Array(length);

  for (let i = 0; i < length; i++) {
    const row = blocked.rows[i];
    result[i] = (row.user1_id === userID ? row.user2_id : row.user1_id);
  }
  return result;
};

const getPostLikes = async (client, userID, filter) => {
  let post_likes = await client.query(`SELECT post_id FROM post_likes WHERE user_id = '${userID}' AND (${filter})`);
  // Convert to object that maps post_id to likes
  post_likes = post_likes.rows.reduce((acc, post_like) => {
    acc[post_like.post_id] = true;
    return acc;
  }, {});
  return post_likes;
}

const getPostsData = async (client, userID, filterQuery, order, direction, offset, latest) => {
  const postsQuery = pagePostsQuery(filterQuery, order, direction, parseInt(offset, 10), latest);
  const posts = await client.query(postsQuery);
  const length = posts.rows.length;
  const filter = new Array(length), postsOrder = new Array(length), postsObj = {};

  for (let i = 0; i < length; i++) {
    filter[i] = `post_id = '${posts.rows[i].id}'`;
    postsOrder[i] = posts.rows[i].id;
    postsObj[posts.rows[i].id] = posts.rows[i];
  }

  if (length === 0) {
    return {
      post_likes: {},
      posts: {},
      order: [],
      offset: 0,
      replace: false
    };
  }
  const post_likes = await getPostLikes(client, userID, filter.join(' OR '));
  return {
    post_likes,
    posts: postsObj,
    order: postsOrder,
    offset: parseInt(offset, 10) + postsOrder.length,
    replace: parseInt(offset, 10) === 0
  };
};

const getUsersData = async (client, userID, filterQuery, order, direction, offset, latest) => {
  const usersQuery = pageUsersQuery(userID, filterQuery, parseInt(offset, 10), order, direction, latest);
  console.log(usersQuery);
  const users = await client.query(usersQuery);
  const obj = rowsToOrderAndObj(users.rows, 'id');
  return {
    order: obj.order,
    users: obj.data,
    offset: parseInt(offset, 10) + obj.order.length,
    replace: parseInt(offset, 10) === 0
  };
};

module.exports = {
  getComments,
  getUserRequests,
  getPendingRequests,
  getUserFriends,
  userExists,
  removeFriendRequestQuery,
  getBlockedUserIDs,

  getPostsData,
  getUsersData,
}
