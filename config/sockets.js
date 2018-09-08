"use strict";

module.exports = (server, pool) => {
  const io = require('socket.io')(server);

  io.on('connection', socket => {
    console.log('user connected with ID: ' + socket.id);

    socket.on('disconnect', () => {
      console.log('user disconnected');
    })
  })
}
