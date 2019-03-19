"use strict";

const CONFIG = require('./config/config.js');
const WEBPACK_CONFIG = require('./config/webpack.config.js');

const https = require('https');
const http = require('http');
const path = require('path');
const express = require('express');
const webpack = require('webpack');
const webSocket = require('ws');
const fs = require('fs');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require("webpack-hot-middleware");
const serverApp = require('./bundle/server.js');

let webServer = null;
let app = express();
let port = CONFIG.PORT;

const Template = fs.readFileSync("./src/Meta/index.html");

//==================================================
// EXPRESS CONFIG

if (CONFIG.DEV){
  let compiler = webpack(WEBPACK_CONFIG);

  app.use(webpackDevMiddleware(compiler, {
    noInfo: false, publicPath: WEBPACK_CONFIG.output.publicPath
  }));

  app.use(webpackHotMiddleware(compiler));
}

app.use('/assets', express.static('assets'));

app.get ("*",(req,res)=>{
  console.log(serverApp.renderPage);

  res.status(200).send(Template.replace("[REACT_CODE]",serverApp.renderPage(req.url)));

});

if (CONFIG.SSL){
  webServer = https.createServer({
    key: CONFIG.PRIVATE_KEY,
    cert: CONFIG.CERTIFICATE
  }, app);
}else{
  webServer = http.createServer(app);
}

//==================================================
// WEBSOCKET ROUTING

var wsConfig = null;

if (CONFIG.DEV){
  wsConfig = { port:CONFIG.PORT };
}else{
  wsConfig = { server:webServer };
}

var signalingRooms = {};

function generateRoomID(length){
  var id = "";
  var parts = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";

  for (var i = 0; i < length; i++) {
    id = id + parts.substr(Math.round(Math.random()*(parts.length-1)),1);
  }

  return id;
}


const wss = new webSocket.Server({ server:webServer });

wss.on('connection', function connection(ws) {
  var room = null;
  var userID = generateRoomID(32);

  ws.on('message', function incoming(message) {
    console.log(message);
    message = JSON.parse(message);

    switch(message.type){
      case "NEW_ROOM":
        var roomID = generateRoomID(5);

        while (signalingRooms.hasOwnProperty(roomID)){
          roomID = generateRoomID(5);
        }

        room = roomID;
        signalingRooms[roomID] = [{
          ws:ws,
          host:true,
          lastheartbeat:Date.now(),
          userID:userID
        }];

        if (ws.readyState === webSocket.OPEN){
          ws.send(JSON.stringify({
            success:true,
            type:"JOINED_ROOM",
            roomid:room,
            userid:userID,
            host:true,
            hostid:userID
          }));
        }

        break;
      case "JOIN_ROOM":
        var roomID = message.roomid;

        if (signalingRooms.hasOwnProperty(roomID)){

          room = roomID;

          for (var i = 0; i < signalingRooms[roomID].length; i++) {

            if (signalingRooms[roomID][i].ws.readyState === webSocket.OPEN){
              signalingRooms[roomID][i].ws.send(JSON.stringify({
                success:true,
                type:"USER_CONNECTED",
                userid:userID
              }));
            }
          }

          signalingRooms[roomID].push({
            ws:ws,
            host:false,
            lastheartbeat:Date.now(),
            userid:userID
          });

          if (ws.readyState === webSocket.OPEN){
            ws.send(JSON.stringify({
              success:true,
              type:"JOINED_ROOM",
              roomid:room,
              userid:userID,
              host:false,
              hostid: signalingRooms[roomID][0].userID
            }));
          }

        }else{

          if (ws.readyState === webSocket.OPEN){
            ws.send(JSON.stringify({
              success:false,
              err:"ROOM_NOT_FOUND"
            }));
          }
        }

        break;
      case "BROADCAST_ALL":
      case "BROADCAST_OTHERS":
      case "SEND_HOST":
      case "SEND_USER":
        var roomID = message.roomid;

        if (signalingRooms.hasOwnProperty(roomID)){
          for (var i = 0; i < signalingRooms[roomID].length; i++) {

            console.log("RAN USERS");

            if (signalingRooms[roomID][i].ws.readyState === webSocket.OPEN){
              switch(message.type){
                case "BROADCAST_ALL":

                  signalingRooms[roomID][i].ws.send(JSON.stringify({
                    success:true,
                    type:"RECEIVED_MESSAGE",
                    userid:userID,
                    message:message.message
                  }));

                  break;
                case "BROADCAST_OTHERS":
                  if (signalingRooms[roomID][i].ws !== ws){

                    signalingRooms[roomID][i].ws.send(JSON.stringify({
                      success:true,
                      type:"RECEIVED_MESSAGE",
                      userid:userID,
                      message:message.message
                    }));

                  }
                  break;
                case "SEND_HOST":
                  console.log(signalingRooms[roomID][i].host);
                  if (signalingRooms[roomID][i].host == true){

                    signalingRooms[roomID][i].ws.send(JSON.stringify({
                      success:true,
                      type:"RECEIVED_MESSAGE",
                      userid:userID,
                      message:message.message
                    }));

                  }
                  break;
                case "SEND_USER":
                  if (message.receiver){
                    if (signalingRooms[roomID][i].userid == message.receiver){

                      signalingRooms[roomID][i].ws.send(JSON.stringify({
                        success:true,
                        type:"RECEIVED_MESSAGE",
                        userid:userID,
                        message:message.message
                      }));
                    }
                  }
                  break;
              }
            }

          }
        }
        break;
      case "HEARTBEAT":

        if (signalingRooms.hasOwnProperty(room)){
          for (var i = 0; i < signalingRooms[room].length; i++) {
            if (signalingRooms[room][i].ws == ws){
              signalingRooms[room][i].lastheartbeat = Date.now();
            }
          }
        }

        break;
    }
  });

});

setInterval(()=>{

  for (var roomID in signalingRooms) {
    if (signalingRooms[roomID] !== undefined){

      for (var i = 0; i < signalingRooms[roomID].length; i++) {

        if (signalingRooms[roomID][i].lastheartbeat < Date.now() - 10000){

          if (signalingRooms[roomID].length > 0){
            for (var p = 0; p < signalingRooms[roomID].length; p++) {
              if (p != i){

                if (signalingRooms[roomID][p].ws.readyState === webSocket.OPEN){
                  signalingRooms[roomID][p].ws.send(JSON.stringify({
                    success: true,
                    type: "USER_DISCONNECTED",
                    userid: signalingRooms[roomID][i].userid,
                    host: signalingRooms[roomID][i].host
                  }));
                }

              }
            }
          }

          signalingRooms[roomID].splice(i,1);

          if (signalingRooms[roomID].length == 0){
            delete signalingRooms[roomID];
            break;
          }
        }else{
          if (signalingRooms[roomID][i].ws.readyState === webSocket.OPEN){
            signalingRooms[roomID][i].ws.send(JSON.stringify({
              success:true,
              type:"HEARTBEAT"
            }));
          }
        }

        if (!signalingRooms.hasOwnProperty(roomID)){
          continue;
        }

      }
    }
  }

},5000);

if (!CONFIG.DEV){
  if (CONFIG.SSL){
    port = 443;
  }else{
    port = 80;
  }

  webServer.listen(port);
}else{
  app.listen(port);
}


console.log("WEBSERVER LISTENING ON "+port);
