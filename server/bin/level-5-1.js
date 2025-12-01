// javascript
import { Server } from "socket.io";
import app from '../app.js';
import debugLib from 'debug';
import http from 'http';
import passport from "passport";
const debug = debugLib('expressjs-module-starterkit:server');

// Use an explicit hostname default so the server binds predictably in dev
const hostname = process.env.HOSTNAME || '127.0.0.1';
app.set('hostname', hostname);

// Normalize and store the port (accepts strings like "3000" or named pipes)
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const server = http.createServer(app);
// Allow connections from local dev servers (adjust origins for production)
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
  }
});

// Engine-level middleware: authenticate only during the initial handshake.
// We check for the absence of a `sid` query param to detect a handshake.
// Note: accessing `req._query` is an implementation detail of the engine.
io.engine.use((req, res, next) => {
  const isHandshake = req._query.sid === undefined;
  if (isHandshake) {
    // Authenticate the handshake request with passport JWT (no session).
    passport.authenticate("jwt", { session: false })(req, res, next);
  } else {
    // For subsequent socket-engine requests (with sid), skip auth here.
    next();
  }
});

io.on('connection', (socket) => {
  console.log('Someone is connecting through WebSocket');

  // If authentication succeeded during handshake, passport attaches user to request.
  let name = '';
  if (socket.request.user && socket.request.user.name) {
    name = socket.request.user.name;
  }

  // Broadcast that a user joined. Using `io.emit` so all connected clients receive it.
  io.emit('user connected', { 'name': name, 'message': name + ' has entered the chat' });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    io.emit('user disconnected', { 'name': name, 'message': 'A user has disconnected' });
  });

  socket.on('chat message', (msg) => {
    console.log('server Received message:', msg);
    // Relay chat messages to all clients
    io.emit('chat message', msg);
  });
});

// Make the io instance available on the express app for routes/middleware that need it
app.set('io', io);

// Start listening
server.listen(port, hostname);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) {
    // Named pipe
    return val;
  }
  if (port >= 0) {
    // Port number
    return port;
  }
  return false;
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const bind = typeof port === 'string'
      ? 'Hostname ' + hostname + ' Pipe ' + port
      : 'Hostname ' + hostname + ' Port ' + port;
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

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
  console.log(`Server running on [http://${addr.address}:${addr.port}]\n\nPress Ctrl+C to stop the server\n`);
  debug('Listening on ' + bind);
}
