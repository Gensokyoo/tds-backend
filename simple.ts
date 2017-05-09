import * as socketio from 'socket.io';
import * as shortid from 'shortid';

let players = new Map<string, object>();

const io = socketio(process.env.PORT || 3000);

io.on('connect', socket => {

  const thisPlayerId = shortid.generate();

  const player = {
    id: thisPlayerId,
    x: 0,
    z: 0
  };

  players.set(thisPlayerId, player);

  socket.broadcast.emit('spawn', players.get(thisPlayerId));
  socket.broadcast.emit('requestPositon');

  for (let playerId of players.keys()) {
    if (playerId !== thisPlayerId) {
      socket.emit('spawn', players.get(playerId));
    }
  }

  console.log(`${thisPlayerId} connect`);

  socket.on('sync', (data) => {
    data.id = thisPlayerId;
    player.x = data.x;
    player.z = data.z;

    socket.broadcast.emit('sync', data);
    console.log(`sync ${JSON.stringify(data)}`);
  });

  socket.on('updatePosition', (data) => {
    data.id = thisPlayerId;

    socket.broadcast.emit('updatePosition', data);
  });

  socket.on('disconnect', () => {
    console.log(`player disconnect: ${thisPlayerId}`);

    players.delete(thisPlayerId);

    socket.broadcast.emit('disconnected', { id: thisPlayerId });
  });

});
