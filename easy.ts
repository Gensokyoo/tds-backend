import * as socketio from 'socket.io';


let players = new Map<string, object>();
let enemys = new Map<string, object>();
let hostPlayer = null;
let isHost = null;


const io = socketio(process.env.PORT || 3000);

io.on('connect', socket => {
  console.log('connect');
  let currentId = null;

  socket.on('join', data => {
    console.log('join' + JSON.stringify(data));
    currentId = data.id;

    if (!isHost) {
      isHost = currentId;
      socket.emit('host', { id: currentId });
    }


    players.set(data.id, data);
    socket.broadcast.emit('spawnPlayer', data);
    for (let playerId of players.keys()) {
      socket.emit('spawnPlayer', players.get(playerId));
    }
  });

  socket.on('sync', data => {
    console.log(`sync` + JSON.stringify(data));
    // players.set(data.id, data);

    socket.broadcast.emit('sync', data);
  });


  socket.on('shoot', data => {
    console.log('shoot' + JSON.stringify(data));
    // players.set(data.id, data);

    socket.broadcast.emit('shoot', data);

  });

  socket.on('takeDamage', data => {
    console.log('takeDamage' + JSON.stringify(data));
    // players.set(data.id, data);

    // socket.broadcast.emit('takeDamage', data);
    io.emit('takeDamage', data);

  });

  socket.on('die', data => {
    console.log('die' + JSON.stringify(data));
    // players.set(data.id, data);

    // socket.broadcast.emit('die', data);
    io.emit('die', data);
  });

  socket.on('spawnEnemy', data => {
    console.log('spawnEnemy');
    enemys.set(data.id, data);
    // pools.set(data.id, data);
    io.emit('spawnEnemy', data);
  });

  socket.on('enemyDie', data => {
    console.log('die');


    io.emit('enemyDie', data);
  });

  socket.on('enemyTakeDamage', data => {
    console.log('enemyTakeDamage');

    io.emit('enemyTakeDamage', data);
  });

  socket.on('disconnect', data => {
    console.log('disconnect' + JSON.stringify(data));

    players.delete(currentId);
    if (currentId == isHost) {
      isHost = null;
    }
    socket.broadcast.emit('disconnected', { id: currentId });
  });
};
