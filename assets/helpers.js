const rowsToOrderAndObj = (queryData, propToMap) => {
  const length = queryData.length;
  let order = new Array(length), data = {};
  for (let i = 0; i < length; i++) {
    const row = queryData[i];
    const propVal = row[propToMap];
    order[i] = propVal;
    data[propVal] = row;
  }
  return { order, data };
}

const filterBlockedQuery = (type, blocked) => {
  switch (type) {
    case 'posts':
      return blocked.map(id => {
        return `posts.author_id != '${id}'`;
      }).join(' AND ');
    case 'users':
      return blocked.map(id => {
        return `users.id != '${id}'`;
      }).join(' AND ');
    case 'comments':
      return blocked.map(id => {
        return `comments.author_id != '${id}'`;
      }).join(' AND ');
    case 'notifications':
      return blocked.map(id => {
        return `notifications.sender_id != '${id}'`;
      }).join(' AND ');
    default:
      return '';
  }
}

module.exports = {
  rowsToOrderAndObj,
  filterBlockedQuery,
};
