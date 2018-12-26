module.exports = (server, pool) => {
  const io = require('socket.io')(server);
  var SOCKETID_TO_USERID = {}; // Links actual socket.id to user ID
  var USERID_TO_SOCKET = {}; // Links user ID to socket connection object

  io.on('connection', socket => {
    console.log('user connected with ID: ' + socket.id);

    socket.on('initialize-connection', userID => {
      console.log('initialized connection with user ID: ' + userID);
      SOCKETID_TO_USERID[socket.id] = userID;
      USERID_TO_SOCKET[userID] = socket;
      socket.emit('connection-success');
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
      delete USERID_TO_SOCKET[SOCKETID_TO_USERID[socket.id]];
      delete SOCKETID_TO_USERID[socket.id];
    })
  })
}
