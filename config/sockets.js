module.exports = (server, pool) => {
  const io = require('socket.io')(server);
  var SOCKETID_TO_USERID = {}; // Links actual socket.id to user ID
  var USERID_TO_SOCKET = {}; // Links user ID to socket connection object

  io.on('connection', socket => {
    console.log('user connected with ID: ' + socket.id);

    socket.on('initialize-connection', data => {
      console.log('initialized connection with user ID: ' + data.id);
      SOCKETID_TO_USERID[socket.id] = data.id;
      USERID_TO_SOCKET[data.id] = socket;
      socket.emit('connection-success', data.changeIOCookie);
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
      delete USERID_TO_SOCKET[SOCKETID_TO_USERID[socket.id]];
      delete SOCKETID_TO_USERID[socket.id];
    })
  })
}
