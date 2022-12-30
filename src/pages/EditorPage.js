import React , {useEffect, useRef, useState} from 'react'
import ACTIONS from '../Actions';
import Client from '../Components/Client';
import Editor from '../Components/Editor';
import { initSocket } from '../socket';
import { useLocation, useNavigate,Navigate,useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const EditorPage = () => {

  const socketRef=useRef(null);
  const codeRef=useRef(null);
  const location=useLocation();
  const {roomId}=useParams();
  // console.log(params);

  const reactNavigator=useNavigate();

  const  [clients,setClients]=useState([]);


  useEffect(()=>{
    const init =async()=>{

      //making connection to server
      socketRef.current=await initSocket();

      //error handling
      socketRef.current.on('connect_error',(err)=>handleErrors(err));
      socketRef.current.on('connect_failed',(err)=>handleErrors(err));
      
      function handleErrors(e)
      {
        console.log('socket error',e);
        toast.error('Socket connection failed, try again later.');
        reactNavigator('/');
      }
      
      //emitting custom event of telling server that client is trying to join 
      //and client is emitting his roomId and username to server or payload
      socketRef.current.emit(ACTIONS.JOIN,{
           roomId,
        username:location.state?.username,
      });

      //Listening for joined event we use on() for listening an event
      socketRef.current.on(ACTIONS.JOINED,
        ({clients,username,socketId})=>{
          //if username if not equal to current username that only we'll notify(as we dont't want to notify outself that we've joined room ,that would be silly if we do so )
          if(username!==location.state?.username){

            toast.success(`${username} joined the room.`);
            console.log(`${username} joined`);
          }
          setClients(clients);
          socketRef.current.emit(ACTIONS.SYNC_CODE,{
            code:codeRef.current,
            socketId,
          });
        });


      //Listening for disconnected 
      socketRef.current.on(ACTIONS.DISCONNECTED,
        ({socketId,username})=>{
          toast.success(`${username} left the room.`);
          //removing disconnected client from client lists 
          setClients((prev)=>{
            return prev.filter(client=>client.socketId !== socketId)
          });
        });
    };
    init();
    //clearing the listeners (freeing the memory as listeners are heavy they hold onto the memory )
    return ()=>{
      socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);
    }
  },[]);

  async function copyRoomId(){
    try{
      await navigator.clipboard.writeText(roomId);
      toast.success('Room ID has been copied to your clipboard.')
    }catch(err){
      toast.success('Could not copy the Room ID');
      console.log(err);
    }
  }

  //leave room button
  function leaveRoom(){
    return reactNavigator('/');
  }
  //if no username then redirect to home page
  if(!location.state)
  {
    return <Navigate to="/"/>
  }
  
  return (

    <div className='mainWrap'>
      <div className='aside'>
        <div className='asideInner'>
          <div className='logo'>
            <h3>Code-Together</h3>
          </div>
          <h3>Connected</h3>
          <div className='clientsList'>
            { 
              clients.map((client)=> (
                <Client 
                  key={client.socketId}
                  username={client.username}

                  /> 
              ))}

          </div>
        </div>
        <button className='btn copyBtn' onClick={copyRoomId}>Copy ROOM ID</button>
        <button className='btn leaveBtn' onClick={leaveRoom}>Leave</button>
      </div>
      <div className='editorWrap'>
        <Editor socketRef={socketRef}
         roomId={roomId} 
         onCodeChange={(code)=>{
          codeRef.current=code;
        }}/>
      </div>
    </div>
  );
}; 

export default EditorPage;