import {io} from "socket.io-client";

con=io("wss://localhost:5000")
con.emit("createGame",()=>{})