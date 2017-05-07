// import * as socketio from 'socket.io';
import * as Koa from 'koa';
import * as IO from 'koa-socket';
import * as shortid from 'shortid';

class Queue {
  socket: SocketIO.Namespace;
  players: number;

  constructor(queue: Queue) {
    Object.assign(this, queue);
  }
}

// class Lobby {
//   socket: SocketIO.Namespace;
//   players: number;
//
//   constructor(lobby: Lobby) {
//     Object.assign(this, lobby);
//   }
// }

class Room {
  socket: SocketIO.Namespace;
  players: number;

  constructor(room: Room) {
    Object.assign(this, room);
  }
}

class Player {
  id: string;
  x: number;
  z: number;
  status: string;

  constructor(player: Player) {
    Object.assign(this, player);
  }
}

const app = new Koa();
const io = new IO();
// const lobbySocket = new IO({
//   namespace: 'lobby'
// });
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
  room.attach(app);

  room.on('connection', (ctx, data) => {

    rooms[i].players++;

    console.log(`some one connected room ${i}. There are ${rooms[i].players} people in the room`);

    ctx.socket.emit("request:data")

    ctx.socket.on('disconnect', () => {
      rooms[i].players--;
    });
  });

  rooms[i] = new Room({
    players: 0,
    socket: room
  });

}


io.on('connection', (ctx, data) => {
  const thisPlayerId = shortid.generate();


  const player = new Player({
    id: thisPlayerId,
    x: 0,
    z: 0,
    status: 'init'
  });

  players.set(thisPlayerId, player);
  console.log(`${thisPlayerId} connected lobby . There are ${players.size} people in the lobby`);

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
    ctx.socket.emit(`match:success`, {
      roomID
    });
  }

  ctx.socket.on('cancel:match', () => {
    queue.players--;
  });

  ctx.socket.on('disconnect', () => {
    queue.players--;
    console.log('a player left queue. There are ' + queue.players + ' people in queue');
  });
});

function getFreeRoom() {
  for (let n = 0; n < MAX; n++) {
    if (rooms[n].players < 10) {
      return n;
    }
  }

  return -1;
}

app.listen(process.env.PORT || 3000);

console.log(`Server listening on port: ${process.env.PORT || 3000}`);
