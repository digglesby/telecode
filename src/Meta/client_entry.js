import React from 'react'
import { render } from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import App from '../app.js'

function hasUserMedia() {
   navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia
      || navigator.mozGetUserMedia || navigator.msGetUserMedia;
   return !!navigator.getUserMedia;
}

if (hasUserMedia()) {

  render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
  , document.getElementById('app'));

}else{
  document.getElementById("no_webrtc").className = "error";
}
