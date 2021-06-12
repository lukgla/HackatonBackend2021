import { debug } from "console";
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
const PublicGames = new Set<string>();

const pendingGames:Set<string>= new Set<string>();


// setInterval(()=>{
//     pendingGames.forEach(
//         (val:string,index)=>{
    
const startGame =(val:string)=>{
            const obj=redis[val]
            if(obj.readyHiddenPlayer+1>=obj.playerAndStatus.size){
                io.to(obj.roomId).emit("gameStart",obj)
                // pendingGames.//remove el from array
                console.log(obj.playerAndStatus)
                pendingGames.delete(val)
                if(obj.gameIsPublic){
                    PublicGames.delete(obj.roomId)
                }
                console.log(`GameStartLoop: ${obj.roomId}`);
                
            }
        }
        // }
    // )
// },1000)


io.on('connection',(socket:Socket)=>{
    console.log(`New chalenger have arived ${socket.id}`)

    socket.on("public",(callback:CallableFunction)=>{
        let res=[]
        PublicGames.forEach((val)=>{
            res.push([redis[val].name,val])
        })
        callback(res)
    })

    socket.on("createGame",(GameSetupObject:GameForm,callback:CallableFunction)=>{
        const gameId:string = uuid();
            redis[gameId]=createGameObject(GameSetupObject,gameId)
        socket.join(gameId)
        socket.props={room:gameId}
        redis[gameId].playerAndStatus[socket.id]=  {
            name:"",
            role:"",
            isReady:false,
            pos:[0,0]
        }

        console.log(`CreateGame: ${gameId} by ${socket.id}`);
        if(GameSetupObject.gameIsPublic){
            PublicGames.add(gameId)
        }

        callback(gameId);
    })
    socket.on("startGame",(roomId:string,callback:CallableFunction)=>{
        io.in(roomId).allSockets().then(
            (res:Set<String>)=>{
                console.log(`StartGame:\n\t Sockets in room: ${res.toString()}`)
                let index=Math.floor(Math.random()*(res.size))
                if (index+1==res.size){index-=1}
                const seeker:any=Array.from(res)[index]
                const seekerSocket =io.to(seeker)
                console.log(`Seeker: ${seeker}`);
                
                seekerSocket.emit("choice",'seeker')
                // const gameObj:Map<string,PlayerProp> =redis[roomId].playerAndStatus

                redis[roomId].playerAndStatus[seeker].role="seeker"
                redis[roomId].playerAndStatus[seeker].isReady=true
                
                res.forEach((socketId:string)=>{
                    if(socketId!=seeker){
                        io.to(socketId).emit("choice","hide")
                        redis[roomId].playerAndStatus[socketId].role="hide"
                        console.log(redis[roomId].playerAndStatus)
                    }
                })
                pendingGames.add(roomId)
                callback(redis[roomId])
            }  
            )
    })


    socket.on('hideReady',(pos:[number,number])=>{
        console.log("startedhidding");
        
        const id=socket.props.room
        if(redis[id].playerAndStatus[socket.id].role=="hide"){
            redis[id].playerAndStatus[socket.id].isReady=true
            redis[id].playerAndStatus[socket.id].pos=pos
            redis[id].readyHiddenPlayer+=1
            console.log(`Player ${socket.id} is ready`);
            console.log(redis[id].playerAndStatus)
            
        }
        startGame(id)
        
    })
    socket.on("winGame",()=>{
        //TODO CleanUP

    })
    socket.on("joinGame",(id:string,callback:CallableFunction)=>{
        socket.props={room:id}
        socket.join(id)
        if(redis[id]!=undefined){
            redis[id].playerAndStatus[socket.id]={
                name:"",
                role:"",
                isReady:false,
                pos:[0,0]
            }
            console.log(`Game Joined by ${socket.id}`);
            
            callback(redis[id])
        }
        else{
            // callback({})
        }
    })
    // socket.on()
    // socket.rooms.
    socket.on('disconnect',()=>{
        console.log(`Dropping socket: ${socket.id}`)
    })

    socket.on("found",(foundedId:string)=>{
        const {room} = socket.props
        io.to(foundedId).emit("founded")
        redis[room].readyHiddenPlayer-=1
        if(redis[room].readyHiddenPlayer==0){
            io.to(room).emit("gameEnd")
        }

    })
    // socket.onAny((args)=>{
    //     console.log(redis)
    // })

})

io.listen(5000)
console.log('started');
