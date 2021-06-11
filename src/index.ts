import { Server,Socket } from "socket.io";
import {v4 as uuid} from 'uuid'

interface GameSetupObject{
    any
}

interface GameForm{
    name:string,
    maxPlayers: number,
    timeToHide: Number, //in sec
    maxGameTime: Number, //in sec
    closeZoneRadius:Number,
    fullZoneRadius: Number,
    gameIsPublic:boolean,
}


const io = new Server();


io.on('connection',(socket:Socket)=>{
    socket.on("createGame",(GameSetupObject:GameForm,callback:CallableFunction)=>{
        const gameId = uuid();
        

        callback(gameId);
    })
    socket.on("leaveGame",()=>{

    })
    // socket.on("endGame",()=>{

    // })
    socket.on("winGame",()=>{

    })
    socket.on("joinRoom",()=>{

    })
    // socket.on()
    socket.rooms.
})