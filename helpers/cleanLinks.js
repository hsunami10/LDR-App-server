const moment = require('moment');
const thirtyMin = 1800;

// This function removes any expired links (30min)
module.exports = liveLinks => {
  const now = moment().unix();
  for (let id in liveLinks) {
    if (liveLinks.hasOwnProperty(id)) {
      if (now - liveLinks[id] >= thirtyMin) {
        delete liveLinks[id];
      }
    }
  }
  return liveLinks;
};
