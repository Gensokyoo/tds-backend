import * as socketio from 'socket.io';
import * as shortid from 'shortid';

let players = new Map<string, object>();
let enemys = new Map<string, object>();
let hostPlayer = null;


const io = socketio(process.env.PORT || 3000);

io.on('connect', socket => {

  const thisPlayerId = shortid.generate();

  const player = {
    id: thisPlayerId,
    px: 0,
    pz: 0,
    rx: 0,
    rz: 0
  };

  players.set(thisPlayerId, player);

  socket.broadcast.emit('spawn', players.get(thisPlayerId));
  socket.broadcast.emit('requestPositon');

  for (let playerId of players.keys()) {
    if (playerId !== thisPlayerId) {
      socket.emit('spawn', players.get(playerId));
    }
  }

  for (let enemyId of enemys.keys()) {
    socket.emit('spawnEnemy', enemys.get(enemyId));
  }

  console.log(`${thisPlayerId} connect`);

  socket.on('sync', (data) => {
    Object.assign(player, data);
    if (!players.has(hostPlayer)) {
      console.log('set hostplayer ' + thisPlayerId);
      hostPlayer = thisPlayerId;
      socket.emit('host');
    }

    data.id = thisPlayerId;
    socket.broadcast.emit('sync', data);
    console.log(`sync ${JSON.stringify(data)}`);
  });

  socket.on('die', data => {
    console.log('die');

    data.id = thisPlayerId;
    socket.broadcast.emit('sync', data);
  });

  socket.on('spawnEnemy', data => {
    console.log('spawnEnemy');

    data.id = shortid.generate();

    enemys.set(data.id, data);
    socket.broadcast.emit('spawnEnemy', data);
  });

  socket.on('enemyDead', data => {
    console.log('enemyDead');
    enemys.delete(data.id);

    socket.broadcast.emit('enemyDead', data);
  });

  socket.on('updatePosition', (data) => {
    console.log('updatePosition');

    data.id = thisPlayerId;

    socket.broadcast.emit('updatePosition', data);
  });

  socket.on('shoot', data => {
    console.log('shoot');

    data.id = thisPlayerId;

    socket.broadcast.emit('shoot', data);
  });

  socket.on('disconnect', () => {
    console.log(`player disconnect: ${thisPlayerId}`);

    players.delete(thisPlayerId);

    socket.broadcast.emit('disconnected', { id: thisPlayerId });
  });

});
