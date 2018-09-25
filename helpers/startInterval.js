const cleanLinks = require('./cleanLinks');

const startInterval = liveLinks => {
  liveLinks = cleanLinks(liveLinks);
  if (Object.keys(liveLinks).length !== 0) {
    setTimeout(startInterval, 1000);
  }
};

module.exports = startInterval;
