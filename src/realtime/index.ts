import { Socket, Server} from 'socket.io';


let players: any = []

class Realtime {
  socket: Socket;
  io: Server;

  constructor(io: Server, socket: Socket) {
    this.socket = socket;
    this.io = io;
    this.joinRoom("1")

    socket.on('getMessages', (room) => this.getMessages(room));
    socket.on('message', (value) => this.handleMessage(value.message, value.room, value.payload));
    socket.on('join-room', (room) => this.joinRoom(room))
    socket.on('disconnect', () => this.disconnect());
    socket.on('connect_error', (err) => {
      console.log(`connect_error due to ${err.message}`);
    });
  }

  joinRoom(room: string){
    this.socket.join(room)
    console.log('joined room:', room)
  }
  
  sendMessage(message: string, room: string) {
    console.log("hey", room, message)
    this.io.to(room).emit("message", {message, room})
  }
  
  getMessages(room: string) {
  }

  handleMessage(value: any, room: string, payload: any) {
    console.log(value)
    if(value === "player_ready"){
      if(players.find((p: any) => p.id === this.socket.id) === undefined){
        players.push({
          id: this.socket.id,
        })
      }

      if(players.length === 2){
        this.sendMessage("start_timer", "1");
      }
    }

    if(value === "shot"){
      const player = players.find((p: any) => p.id === this.socket.id)
      player.time = payload.time
      console.log(player.time)
      
      const hasFired = players.map((p: any) => !!p.time).reduce((ac: any, at: any) => ac&&at)
      console.log(hasFired)
      if(hasFired){
        const winnerID = players.sort((a:any, b:any) => b.time-a.time)[0].id
        this.io.to("1").emit("message", {message: "bangbang_result", id: winnerID})
      }

    }
  }

  disconnect() {
  }
}

function realtime(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log("Connected on Socket: ", socket.id)
    console.log(socket.handshake.auth.name)
    console.log(socket.handshake.auth.room)
    new Realtime(io, socket);   
  })
}

export default realtime;

