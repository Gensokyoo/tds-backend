import * as Koa from 'koa';
import { Context } from 'koa';
import * as IO from 'koa-socket';
import * as shortid from 'shortid';

class Queue {
  socket: SocketIO.Namespace;
  players: number;

  constructor(queue: Queue) {
    Object.assign(this, queue);
  }
}

class Room {
  socket: SocketIO.Namespace;
  players: Map<string, Player>;

  constructor(room: Room) {
    Object.assign(this, room);
  }
}

class Player {
  id: string;
  x: number;
  z: number;

  constructor(player: Player) {
    Object.assign(this, player);
  }
}

const app = new Koa();
const io = new IO();
const queueSocket = new IO('queue');

io.attach(app);
queueSocket.attach(app);


let MAX = 10;
let rooms: Room[] = [];
let players = new Map<string, Player>();

const queue = new Queue({
  socket: queueSocket,
  players: 0
});

for (let i = 0; i < MAX; i++) {
  let room = new IO(`room:${i}`);
  let roomPlayers = new Map<string, Player>();
  room.attach(app);

  room.on('connection', (ctx: Context, data) => {
    let currentPlayer = new Player({
      id: null,
      x: 0,
      z: 0
    });

    ctx.socket.emit('joinRoom');
    ctx.socket.on('joinRoom', data => {
      currentPlayer.id = data;
      roomPlayers.set(currentPlayer.id, currentPlayer);
      console.log(`${data} connected room ${i}. There are ${rooms[i].players.size} people in the room`);

      for (let playerId of roomPlayers.keys()) {
        if (playerId !== currentPlayer.id) {
          ctx.socket.emit('spawn', players.get(playerId));
        }
      }

      room.broadcast('spawn', { id: currentPlayer.id });
      room.broadcast('requestPosition');
    });

    ctx.socket.on('sync', data => {
      currentPlayer.id = currentPlayer.id;
      currentPlayer.x = data.x;
      currentPlayer.z = data.z;

      room.broadcast('sync', currentPlayer);
      console.log(`sync ${JSON.stringify(currentPlayer)}`);
    });

    ctx.socket.emit('requestPosition');

    ctx.socket.on('updatePosition', data => {
      room.broadcast('updatePosition', data);
    });


    ctx.socket.on('disconnect', () => {
      roomPlayers.delete(currentPlayer.id);
      room.broadcast('disconnect', { id: currentPlayer });
    });
  });

  rooms[i] = new Room({
    players: roomPlayers,
    socket: room
  });

}


io.on('connection', (ctx, data) => {
  const thisPlayerId = shortid.generate();


  const player = new Player({
    id: thisPlayerId,
    x: 0,
    z: 0
  });

  players.set(thisPlayerId, player);
  console.log(`${thisPlayerId} connected lobby . There are ${players.size} people in the lobby`);

  ctx.socket.emit('connectSuccess', player);

  ctx.socket.on('test', data => {
    console.log(data);
  });

  ctx.socket.on('disconnect', () => {
    console.log(`player disconnect lobby: ${thisPlayerId}`);

    players.delete(thisPlayerId);
  });
});

queue.socket.on('connection', (ctx, data) => {

  queue.players++;
  console.log('a player connected queue. There are ' + queue.players + ' people in queue');


  let roomID = getFreeRoom();

  if (roomID >= 0) {
    ctx.socket.emit(`matchSuccess`, {
      roomID
    });
  }

  ctx.socket.on('disconnect', () => {
    queue.players--;
    console.log('a player left queue. There are ' + queue.players + ' people in queue');
  });
});

function getFreeRoom() {
  for (let n = 0; n < MAX; n++) {
    if (rooms[n].players.size < 10) {
      return n;
    }
  }

  return -1;
}

app.listen(process.env.PORT || 3000);

console.log(`Server listening on port: ${process.env.PORT || 3000}`);
