const express = require('express');
const app=express();

const http=require('http');


//requiring Server class
const {Server}=require('socket.io');
const ACTIONS = require('./src/Actions');
//creating http server

const server=http.createServer(app);



//creating instance of Server class to use its methods and attributes
const io=new Server(server);


//object to store user along with there socket id
const userSocketMap={};


function getAllConnectedClients(roomId)
{
  //Map of socketId : username
  //adapter is used to retrieve information from socket
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId)=>{
    return{
      socketId,
      username:userSocketMap[socketId], 
    }
  });
}

//connection event gets triggered whenever any sockets gets connected to our server
io.on('connection',(socket)=>{
  console.log('socket connected',socket.id);

  //Listening to event emitted by client
  socket.on(ACTIONS.JOIN,({roomId,username })=>{
    userSocketMap[socket.id]=username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);

    //Emitting the event (list of all joined clients) so that every client 
    //can know how many people are joined
    //we'll be listening this event in front-end
    clients.forEach(({socketId})=>{
      io.to(socketId).emit(ACTIONS.JOINED,{
        clients,
        username,
        socketId:socket.id,
      });  
    });

    console.log(clients);

  });

  //Receiving code change event from client and then we'll send this change to rest of clients 
  //on() listener is used to listen and to() used to send 
  socket.on(ACTIONS.CODE_CHANGE,({roomId,code})=>{
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE,{code});
  });

   socket.on(ACTIONS.SYNC_CODE,( {socketId,code})=>{
    io.to(socketId).emit(ACTIONS.CODE_CHANGE,{code});
  });

  //whenever some one leave room or closes browser tab browser will send disconnecting event to server
  socket.on('disconnecting',()=>{

    //getting all rooms in which disconnecting client is connected
    const rooms=[...socket.rooms];
    rooms.forEach((roomId) => { 
      socket.in(roomId).emit(ACTIONS.DISCONNECTED,{
        socketId:socket.id,
        username:userSocketMap[socket.id],
      });
    });

    delete userSocketMap[socket.id];
    socket.leave();
  });
});


const PORT=process.env.PORT || 5000;
server.listen(PORT,()=>console.log(`Listening to port ${PORT}`));