import React, { useEffect, useInsertionEffect } from 'react';
import Codemirror from 'codemirror';

const Editor = () => {

  useEffect(()=>{
    async function init(){
      Codemirror.fromTextArea(document.getElementById('realTimeEditor'),){
        
      }
    }
  },[]);

  return (
    <textarea id='realTimeEditor'></textarea>
  );
};

export default Editor; 