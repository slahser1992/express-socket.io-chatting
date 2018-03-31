const app = require('../app');
const debug = require('debug')('express-generator-example:server');
const http = require('http');
const sio = require('socket.io');
const onlineUnit = require('../public/javascript/onlineUnit')

const online = new onlineUnit()
const currentOnlinePerson = online.totalOnline

const normalizePort = val => {
  const port = parseInt(val, 10);
  return isNaN(port) ? val : port >= 0 ? port : false;
}

const port = normalizePort(process.env.PORT || '3000');

const onError = error => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

const onListening = () => {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

// create socket server
const server = http.createServer(app);
const io = sio(server);
io.on('connection', (socket) => {
  if(!currentOnlinePerson.has(socket.handshake.query.id) || (socket.id != currentOnlinePerson.get(socket.handshake.query.id).sid)) {
    currentOnlinePerson.set(socket.handshake.query.id, {
      id: socket.handshake.query.id,
      sid: socket.id
    })
  }
  socket.on('NORMAL_MESSAGE', (v, fn) => {
    if(currentOnlinePerson.has(v.to)) {
      io.sockets.to(currentOnlinePerson.get(v.to).sid).emit('NORMAL_MESSAGE_SERVER', v.content, fn('success'))
    } else {
      socket.emit('NORMAL_MESSAGE_SERVER', '对方没有上线，暂时不支持离线消息')
    }
  })
});

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
