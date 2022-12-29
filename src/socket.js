import io from 'socket.io-client';



//this function will return the instance of socket of client
export const initSocket = async ()=>{
  const options ={
    'force new connection':true,
    reconnectionAttempt:'Infinity',
    timeout:10000,
    transports:['websocket'],
  };

  //this tells us where our server is lying (putting details inside .env file)
  return io(process.env.REACT_APP_BACKEND_URL,options);
};