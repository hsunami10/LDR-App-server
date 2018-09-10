"use strict";

/*
Promises / async / await - https://javascript.info/async
- async function - always return a promise, runs asynchronously
- await (only in async function) - make Javascript wait until the promise settles, then return result
  - result is resolve(result)
  - reject goes to .catch
- no bottleneck because its asynchronous, so other code can run
- () after definitions means run the function
- return resolve/reject stops everything from running after
  - throw new Error('error message') in promise is the same as reject(new Error('error message'))
  - throwing error gets treated like a rejection
  - both jump to .catch
*/

module.exports = (server, pool) => {
  const io = require('socket.io')(server);

  io.on('connection', socket => {
    console.log('user connected with ID: ' + socket.id);

    socket.on('disconnect', () => {
      console.log('user disconnected');
    })
  })
}
