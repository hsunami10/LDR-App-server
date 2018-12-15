const friendsQuery = require('./paginate').friends;

const userExists = async (client, id) => {
  const res = await client.query(`SELECT id FROM users WHERE id = '${id}' AND deleted = false`);
  return res.rows;
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
  const requests = await client.query(`SELECT friend_requests.id, friend_requests.sender_id as user_id, users.profile_pic, friend_requests.message, users.date_joined, 'request' as type FROM friend_requests INNER JOIN users ON friend_requests.sender_id = users.id WHERE friend_requests.receiver_id = '${user_id}' ORDER BY friend_requests.date_sent DESC`);
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
  const pendings = await client.query(`SELECT friend_requests.id, friend_requests.receiver_id as user_id, users.profile_pic, friend_requests.date_sent, users.date_joined, 'pending' as type FROM friend_requests INNER JOIN users ON friend_requests.receiver_id = users.id WHERE friend_requests.sender_id = '${user_id}' ORDER BY friend_requests.date_sent DESC`);
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
      offset
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
      offset: offset + friendsOrder.length
    };
  }
};

module.exports = {
  getComments,
  getUserRequests,
  getPendingRequests,
  getUserFriends,
  userExists
}
