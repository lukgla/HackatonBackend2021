import console = require("console");
import { Server,Socket as _Socket } from "socket.io";
import {v4 as uuid} from 'uuid'

interface GameSetupObject{
    any
}
interface PlayerProp{
    name:string,
    role:string,
    isReady:boolean,
    pos:[number,number]
}

interface GameForm{
    name:string,
    maxPlayers: number,
    maxGameTime: Number, //in sec
    closeZoneRadius:Number,
    fullZoneRadius: Number,
    gameIsPublic:boolean,
    
    roomId:string
    timeToHide: Number, //in sec
    //joinedPlayer:number,
    readyHiddenPlayer:number,

    playerAndStatus:Map<string,PlayerProp>

}

function createGameObject(GameForm:GameForm,roomId:string){
    const base={
            name:"string",
            maxPlayers: 15,
            maxGameTime: 15, //in sec
            closeZoneRadius:50,
            fullZoneRadius: 50,
            gameIsPublic:false,
            
            roomId:roomId,
            timeToHide: 5, //in sec
            joinPlayer:1,
            readyHiddenPlayer:0,
        
            playerAndStatus:new Map<string,{
                    name:string,
                    role:string,
                    isReady:boolean,
                    pos:[number,number]
                }>()
        
        }
        return {...base,...GameForm}
    }


interface Socket extends _Socket{
    props:{
        room:string,
    }
}

const io = new Server({
    cors:{
        origin:"*"
    }
});
const redis = new Map<string,GameForm>()


const pendingGames:GameForm[]= [];


setInterval(()=>{
    pendingGames.forEach(
        (val:GameForm,index)=>{
            if(val.readyHiddenPlayer+1>=val.playerAndStatus.size){
                io.to(val.roomId).emit("gameStart",val.playerAndStatus)
                // pendingGames.//remove el from array
            }
        }
    )
},1000)


io.on('connection',(socket:Socket)=>{
    console.log("conn")
    socket.on("createGame",(GameSetupObject:GameForm,callback:CallableFunction)=>{
        const gameId:string = uuid();
            redis[gameId]=createGameObject(GameSetupObject,gameId)
        //todo db
        console.log(socket.id)
        socket.join(gameId)
        socket.props={room:gameId}
        // socket.props.room=gameId
        console.log(gameId);

        redis[gameId].playerAndStatus[socket.id]={
            name:"",
            role:"",
            isReady:false,
            pos:[0,0]
        }

        callback(gameId);
    })
    socket.on("startGame",(roomId:string,callback:CallableFunction)=>{
        io.in(roomId).allSockets().then(
            (res:Set<String>)=>{
                console.log(res)
                
                const seeker:any=Array.from(res)[Math.floor(Math.random()*(res.size-1))]
                const seekerSocket =io.to(seeker)
                seekerSocket.emit("choice",'seeker')
                console.log('seeker');
                const gameObj:Map<string,PlayerProp> =redis[roomId].playerAndStatus

                gameObj[seeker].role="seeker"
                gameObj[seeker].isReady=true
                
                res.forEach((socketId:string)=>{
                    if(socketId!=seeker){
                        io.to(socketId).emit("choice","hide")
                        gameObj[socketId].role="hide"
                    }
                })
                pendingGames.push(redis[roomId])
            }  
            )
            console.log('started')
            callback('ok')
    })


    socket.on('hideReady',(pos:[number,number])=>{
        const id=socket.props.room
        if(!redis[id].playerAndStatus[socket.id]){
            redis[id].playerAndStatus[socket.id]=true
            redis[id].readyHiddenPlayer+=1
        }
        console.log(pos)
        console.log(id);
        
    })
    socket.on("winGame",()=>{

    })
    socket.on("joinGame",(id:string,callback:CallableFunction)=>{
        socket.props={room:id}
        socket.join(id)
        redis[id].playerAndStatus[socket.id]={
            name:"",
            role:"",
            isReady:false,
            pos:[0,0]
        }
        
        console.log("join")
        callback(redis[id])
    })
    // socket.on()
    // socket.rooms.
    socket.on('disconnect',()=>{
        console.log('dis')
    })
})

io.listen(5000)
console.log('started');
