const User = require('../models/User');
const onlineUsers = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('setup', async (userId) => {
      socket.join(userId);
      onlineUsers.set(userId, socket.id);
      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit('user_online', userId);
    });

    socket.on('join_chat', (chatId) => socket.join(chatId));

    socket.on('send_message', ({ chatId, message }) => {
      socket.to(chatId).emit('receive_message', message);
    });

    socket.on('typing',      (chatId) => socket.to(chatId).emit('typing', chatId));
    socket.on('stop_typing', (chatId) => socket.to(chatId).emit('stop_typing', chatId));

    socket.on('disconnect', async () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
          io.emit('user_offline', userId);
          break;
        }
      }
    });
  });
};
