const queryDataToOrderAndObj = (queryData, propToMap) => {
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

module.exports = {
  queryDataToOrderAndObj,
};
